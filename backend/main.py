import asyncio
import os
import re
import time
import uuid
import logging
import tempfile
import traceback
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

import mediapipe as mp
from fastapi import Depends, FastAPI, File, Form, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from limiter import limiter

from config import settings
from database import init_db
from auth_router import router as auth_router
from models import (
    AnalysisResponse,
    AnnotatedFrameSet,
    RiskScores,
    SupplementaryStats,
    AICoaching,
    IndividualFeedback,
    ExerciseItem,
    WarmupItem,
    WeeklyPlanDay,
    FrameDataPoint,
    ErrorResponse,
    MovementInfo,
    SportInjuryFlag,
)
from pose_extractor import PoseExtractor
from biomechanics import BiomechanicsEngine
from scoring import RiskScorer
from ai_coach import AICoach
from annotator import FrameAnnotator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("injurylens")

START_TIME = time.time()

pose_extractor      = PoseExtractor()
biomechanics_engine = BiomechanicsEngine()
risk_scorer         = RiskScorer()
ai_coach            = AICoach()
frame_annotator     = FrameAnnotator()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    _seed_demo_user()
    logger.info("Database initialised.")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered sports movement analysis and injury risk assessment.",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again."})


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start    = time.time()
        response = await call_next(request)
        elapsed  = round(time.time() - start, 3)
        logger.info(f"{request.method} {request.url.path} → {response.status_code} ({elapsed}s)")
        return response


app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,   # tokens live in localStorage, not cookies
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)

# ─── Optional auth dependency ────────────────────────────────────────────────
# Reads the Bearer token when present and resolves the caller's email.
# Requests without a token (or with an invalid token) are allowed through so
# that the demo-user flow and unauthenticated clients continue to work.
_optional_bearer = HTTPBearer(auto_error=False)

def _get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
) -> str | None:
    if not creds:
        return None
    try:
        payload = jwt.decode(
            creds.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload.get("sub")
    except ExpiredSignatureError:
        logger.info("Expired JWT presented — treating request as anonymous")
        return None
    except JWTError:
        logger.debug("Invalid JWT presented — treating request as anonymous")
        return None


def _seed_demo_user():
    """Ensure a demo account exists so users can try the app without registering."""
    import bcrypt as _bcrypt
    from database import SessionLocal
    from auth_models import User
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "demo@injurylens.com").first()
        if not existing:
            hashed = _bcrypt.hashpw(b"demo1234", _bcrypt.gensalt()).decode()
            db.add(User(
                name="Alex Rivera",
                email="demo@injurylens.com",
                hashed_password=hashed,
            ))
            db.commit()
            logger.info("Demo user seeded: demo@injurylens.com")
    finally:
        db.close()

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}
ALLOWED_MIME_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/avi", "video/webm"}

# Magic-byte signatures keyed by extension (checked against the first 12 bytes)
_MAGIC: dict[str, callable] = {
    ".mp4":  lambda h: h[4:8] in (b"ftyp", b"moov", b"mdat", b"free"),
    ".mov":  lambda h: h[4:8] in (b"ftyp", b"moov", b"mdat", b"free", b"wide"),
    ".avi":  lambda h: h[:4] == b"RIFF",
    ".webm": lambda h: h[:4] == b"\x1a\x45\xdf\xa3",
}

_SAFE_FIELD_RE = re.compile(r"[^\w\s\-–—/+]+", re.UNICODE)
_MAX_FIELD_LEN = 100


def _sanitize_form_field(value: str) -> str:
    """Strip control chars and limit length for fields embedded in the AI prompt."""
    value = value.strip()[:_MAX_FIELD_LEN]
    return _SAFE_FIELD_RE.sub("", value)


def _validate_magic_bytes(header: bytes, ext: str) -> None:
    check = _MAGIC.get(ext)
    if check and not check(header):
        raise HTTPException(
            status_code=422,
            detail="File content does not match the declared video format. Please re-export as a standard video file.",
        )

SUPPORTED_MOVEMENTS = [
    MovementInfo(id="Squat",          label="Squat",           category="Lower Body",  description="Bilateral lower body strength assessment.", key_metrics=["knee valgus", "trunk lean", "depth", "asymmetry"], difficulty="Beginner"),
    MovementInfo(id="Deadlift",       label="Deadlift",         category="Full Body",   description="Hip-hinge pulling movement from the floor.", key_metrics=["trunk lean", "knee valgus", "hip hinge", "bar path"], difficulty="Intermediate"),
    MovementInfo(id="Lunge",          label="Lunge",            category="Lower Body",  description="Single-leg stepping pattern for unilateral assessment.", key_metrics=["knee valgus", "trunk control", "hip stability"], difficulty="Beginner"),
    MovementInfo(id="Running",        label="Running",          category="Cardio",      description="Gait analysis for running mechanics and injury risk.", key_metrics=["knee valgus", "trunk lean", "bilateral symmetry"], difficulty="Beginner"),
    MovementInfo(id="Jump Landing",   label="Jump Landing",     category="Power",       description="Dynamic deceleration assessment for ACL risk.", key_metrics=["knee valgus on landing", "trunk control", "bilateral load"], difficulty="Intermediate"),
    MovementInfo(id="Push-up",        label="Push-up",          category="Upper Body",  description="Upper body push pattern with core stability demand.", key_metrics=["shoulder asymmetry", "trunk lean", "elbow alignment"], difficulty="Beginner"),
    MovementInfo(id="Plank",          label="Plank",            category="Core",        description="Isometric core stability assessment.", key_metrics=["trunk alignment", "hip sag", "shoulder stability"], difficulty="Beginner"),
    MovementInfo(id="Hip Hinge",      label="Hip Hinge",        category="Lower Body",  description="Posterior chain loading pattern — foundation for deadlift.", key_metrics=["hip flexion", "trunk lean", "knee tracking"], difficulty="Beginner"),
    MovementInfo(id="Overhead Press", label="Overhead Press",   category="Upper Body",  description="Vertical pressing with overhead stability demand.", key_metrics=["trunk lean", "shoulder symmetry", "elbow alignment"], difficulty="Intermediate"),
    MovementInfo(id="Lateral Lunge",  label="Lateral Lunge",    category="Lower Body",  description="Frontal plane single-leg assessment.", key_metrics=["knee valgus", "hip drop", "trunk lean"], difficulty="Intermediate"),
    MovementInfo(id="Split Squat",    label="Split Squat",      category="Lower Body",  description="Unilateral squat pattern with staggered stance.", key_metrics=["knee valgus", "trunk control", "hip stability"], difficulty="Intermediate"),
    MovementInfo(id="Bench Press",    label="Bench Press",      category="Upper Body",  description="Horizontal push pattern with shoulder and chest assessment.", key_metrics=["shoulder asymmetry", "elbow flare", "wrist alignment"], difficulty="Intermediate"),
]


_SUPPORTED_MOVEMENT_IDS = {m.id for m in SUPPORTED_MOVEMENTS}


def _risk_level_from_score(overall: int) -> str:
    if overall < 30:
        return "Low"
    if overall < 60:
        return "Moderate"
    return "High"


def _build_frame_timeline(frame_flags: list[dict], sample_every: int = 3) -> list[FrameDataPoint]:
    """Downsample frame_flags to a manageable timeline for charting (Features 4, 11)."""
    result = []
    for i, f in enumerate(frame_flags):
        if i % sample_every != 0:
            continue
        result.append(FrameDataPoint(
            frame_index=i,
            left_knee_angle=round(f["left_knee_angle"], 1),
            right_knee_angle=round(f["right_knee_angle"], 1),
            trunk_lean_angle=round(f["trunk_lean_angle"], 1),
            shoulder_asymmetry=round(f.get("shoulder_height_diff", 0) * 100, 1),
            risk_score=f.get("frame_risk", 0),
            left_knee_velocity=f.get("left_knee_velocity", 0.0),
            right_knee_velocity=f.get("right_knee_velocity", 0.0),
            trunk_lean_velocity=f.get("trunk_lean_velocity", 0.0),
            left_knee_acceleration=f.get("left_knee_acceleration", 0.0),
            right_knee_acceleration=f.get("right_knee_acceleration", 0.0),
            trunk_rotation_3d=f.get("trunk_rotation_3d", 0.0),
            hip_rotation_3d=f.get("hip_rotation_3d", 0.0),
        ))
    return result


def _build_response(
    analysis_id: str,
    movement_type: str,
    scores: dict,
    avg_stats: dict,
    n_frames: int,
    coaching: dict,
    annotated_b64: str,
    annotated_frames_dict: dict,
    frame_timeline: list,
    metadata: dict,
    risk_breakdown: dict | None = None,
    sport_injury_flags: list | None = None,
) -> AnalysisResponse:
    individual = coaching.get("individual_feedback", {})
    exercises  = [
        ExerciseItem(
            name=ex.get("name", "Exercise"),
            sets_reps=ex.get("sets_reps", "3 × 10"),
            why=ex.get("why", ""),
        )
        for ex in coaching.get("exercise_prescription", [])
    ]
    warmup = [
        WarmupItem(
            name=w.get("name", ""),
            duration=w.get("duration", ""),
            focus=w.get("focus", ""),
        )
        for w in coaching.get("warmup_routine", [])
    ]
    weekly = [
        WeeklyPlanDay(
            day=d.get("day", ""),
            focus=d.get("focus", ""),
            exercises=d.get("exercises", []),
        )
        for d in coaching.get("weekly_plan", [])
    ]

    annotated_frames_model = None
    if annotated_frames_dict:
        annotated_frames_model = AnnotatedFrameSet(
            worst=annotated_frames_dict["worst"],
            best=annotated_frames_dict["best"],
            middle=annotated_frames_dict["middle"],
        )

    return AnalysisResponse(
        analysis_id=analysis_id,
        movement_type=movement_type,
        scores=RiskScores(
            knee_valgus_left=scores["knee_valgus_left"],
            knee_valgus_right=scores["knee_valgus_right"],
            trunk_lean=scores["trunk_lean"],
            asymmetry=scores["asymmetry"],
            shoulder_asymmetry=scores.get("shoulder_asymmetry", 0),
            hip_drop=scores.get("hip_drop", 0),
            overall=scores["overall"],
        ),
        supplementary=SupplementaryStats(
            avg_left_knee_angle=avg_stats["avg_left_knee_angle"],
            avg_right_knee_angle=avg_stats["avg_right_knee_angle"],
            avg_trunk_lean_angle=avg_stats["avg_trunk_lean_angle"],
            avg_shoulder_asymmetry=avg_stats.get("avg_shoulder_asymmetry", 0.0),
            total_frames_analyzed=n_frames,
            worst_frame_index=avg_stats["worst_frame_index"],
            rep_count=avg_stats.get("rep_count", 0),
            fatigue_score=avg_stats.get("fatigue_score", 0),
            video_duration_seconds=metadata.get("duration_seconds", 0.0),
            fps=metadata.get("fps", 0.0),
            avg_trunk_rotation_3d=avg_stats.get("avg_trunk_rotation_3d", 0.0),
            avg_hip_rotation_3d=avg_stats.get("avg_hip_rotation_3d", 0.0),
            avg_knee_depth_asym_3d=avg_stats.get("avg_knee_depth_asym_3d", 0.0),
            peak_left_knee_velocity=avg_stats.get("peak_left_knee_velocity", 0.0),
            peak_right_knee_velocity=avg_stats.get("peak_right_knee_velocity", 0.0),
            mqs_score=avg_stats.get("mqs_score", 0.0),
            mqs_grade=avg_stats.get("mqs_grade", "C"),
            mqs_percentile=avg_stats.get("mqs_percentile", 50),
            injury_probability_4w=avg_stats.get("injury_probability_4w", 0.0),
            analysis_confidence=avg_stats.get("analysis_confidence", 75),
            per_rep_quality=avg_stats.get("per_rep_quality", []),
        ),
        ai_coaching=AICoaching(
            overall_risk_level=coaching.get("overall_risk_level", "Moderate"),
            overall_summary=coaching.get("overall_summary", ""),
            priority_issue=coaching.get("priority_issue", ""),
            coaching_cues=(coaching.get("coaching_cues") or ["", "", ""])[:5],
            exercise_prescription=exercises[:5],
            warmup_routine=warmup[:4],
            weekly_plan=weekly[:5],
            positive_observation=coaching.get("positive_observation", ""),
            follow_up_timeline=coaching.get("follow_up_timeline", ""),
            individual_feedback=IndividualFeedback(
                knee_valgus_left=individual.get("knee_valgus_left", ""),
                knee_valgus_right=individual.get("knee_valgus_right", ""),
                trunk_lean=individual.get("trunk_lean", ""),
                asymmetry=individual.get("asymmetry", ""),
                shoulder_asymmetry=individual.get("shoulder_asymmetry", ""),
                hip_drop=individual.get("hip_drop", ""),
            ),
            sport_specific_note=coaching.get("sport_specific_note", ""),
        ),
        annotated_frame=annotated_b64,
        annotated_frames=annotated_frames_model,
        frame_timeline=frame_timeline,
        risk_breakdown=risk_breakdown or {},
        sport_injury_flags=[
            SportInjuryFlag(**f) for f in (sport_injury_flags or [])
        ],
    )


# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/health")
@limiter.limit("30/minute")
async def health_check(request: Request):
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "model": "gemini-2.0-flash",
        "mediapipe_version": mp.__version__,
        "ai_available": ai_coach.available,
        "uptime_seconds": int(time.time() - START_TIME),
        "supported_movements": len(SUPPORTED_MOVEMENTS),
    }


@app.get("/movements", response_model=list[MovementInfo])
async def list_movements():
    """Return metadata for all supported movement types."""
    return SUPPORTED_MOVEMENTS


@app.post(
    "/analyze",
    response_model=AnalysisResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Unprocessable video"},
        413: {"model": ErrorResponse, "description": "File too large"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
@limiter.limit("10/minute")
async def analyze_video(
    request: Request,
    file: UploadFile = File(...),
    movement_type: Annotated[str, Form(max_length=50)] = "Squat",
    fitness_level: Annotated[str, Form(max_length=50)] = "Intermediate",
    age_group: Annotated[str, Form(max_length=20)] = "25–34",
    goal: Annotated[str, Form(max_length=100)] = "Injury Prevention",
    sport: Annotated[str, Form(max_length=50)] = "",
    current_user: str | None = Depends(_get_optional_user),
):
    # Sanitize fields that will be embedded in the AI prompt
    movement_type = _sanitize_form_field(movement_type)
    fitness_level = _sanitize_form_field(fitness_level)
    age_group     = _sanitize_form_field(age_group)
    goal          = _sanitize_form_field(goal)
    sport         = _sanitize_form_field(sport)

    if movement_type not in _SUPPORTED_MOVEMENT_IDS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unsupported movement type '{movement_type}'. "
                f"Supported: {', '.join(sorted(_SUPPORTED_MOVEMENT_IDS))}."
            ),
        )

    request_start = time.time()
    logger.info(
        f"Analysis — movement: {movement_type!r}, fitness: {fitness_level!r}, "
        f"age: {age_group!r}, goal: {goal!r}, sport: {sport!r}, "
        f"user: {current_user or 'anonymous'}"
    )

    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unsupported file type '{file_ext or 'unknown'}'. "
                "Please upload an MP4, MOV, AVI, or WebM video file."
            ),
        )

    ct = file.content_type or ""
    if ct and ct not in ALLOWED_MIME_TYPES:
        logger.warning(f"Unexpected content-type '{ct}' for extension '{file_ext}'")

    analysis_id = uuid.uuid4().hex
    tmp_path: str | None = None
    max_bytes = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024

    try:
        # Read header first for magic-bytes validation, then stream the rest to disk
        header = await file.read(12)
        _validate_magic_bytes(header, file_ext)

        suffix = f"_{analysis_id}{file_ext}"
        total_size = len(header)
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            tmp.write(header)
            while True:
                chunk = await file.read(1024 * 1024)  # 1 MB chunks
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=(
                            f"File size exceeds the {settings.MAX_VIDEO_SIZE_MB} MB limit. "
                            "Please compress your video or trim it to a shorter clip."
                        ),
                    )
                tmp.write(chunk)

        logger.info(f"Video saved to {tmp_path} ({total_size / 1024:.0f} KB)")

        # 1. Extract pose landmarks (CPU/IO-heavy — run off the event loop)
        try:
            frames, metadata = await asyncio.to_thread(pose_extractor.extract, tmp_path)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

        logger.info(f"Pose extraction: {len(frames)} valid frames")

        # 2. Biomechanical analysis (movement-aware, CPU-heavy)
        frame_flags, avg_stats = await asyncio.to_thread(
            biomechanics_engine.analyze, frames, movement_type
        )

        # 3. Risk scoring (CPU-heavy)
        scores     = await asyncio.to_thread(risk_scorer.score, frame_flags, movement_type)
        risk_level = _risk_level_from_score(scores["overall"])

        # 4. Annotate frames (opens video again — CPU/IO-heavy)
        worst_valid_idx  = avg_stats["worst_frame_index"]
        best_valid_idx   = avg_stats["best_frame_index"]
        middle_valid_idx = avg_stats["middle_frame_index"]

        valid_indices = metadata["valid_frame_indices"]
        worst_actual  = valid_indices[worst_valid_idx]
        best_actual   = valid_indices[best_valid_idx]
        middle_actual = valid_indices[middle_valid_idx]

        annotated_set = await asyncio.to_thread(
            frame_annotator.annotate_multiple,
            tmp_path, worst_actual, best_actual, middle_actual, scores, risk_level,
        )
        annotated_b64 = annotated_set["worst"]  # worst frame also serves as the primary annotated image

        # 5. AI coaching
        athlete_context = {
            "fitness_level": fitness_level,
            "age_group":     age_group,
            "goal":          goal,
            "sport":         sport,
        }
        coaching = await ai_coach.generate(scores, avg_stats, movement_type, athlete_context)

        # 6. Movement Quality Score + Injury Probability (Features 5, 12)
        mqs_result = risk_scorer.calculate_mqs(scores)
        injury_prob = risk_scorer.calculate_injury_probability(scores, avg_stats)

        avg_stats["mqs_score"]            = mqs_result["mqs_score"]
        avg_stats["mqs_grade"]            = mqs_result["mqs_grade"]
        avg_stats["mqs_percentile"]       = mqs_result["mqs_percentile"]
        avg_stats["injury_probability_4w"] = injury_prob

        # 7. Analysis confidence + per-rep quality + risk breakdown + sport injury flags
        rep_count = avg_stats.get("rep_count", 0)
        avg_stats["analysis_confidence"] = risk_scorer.calculate_confidence(len(frames), rep_count)
        avg_stats["per_rep_quality"]     = biomechanics_engine.get_per_rep_quality(frame_flags)
        risk_breakdown   = risk_scorer.calculate_risk_breakdown(frame_flags, movement_type)
        sport_inj_flags  = risk_scorer.get_sport_injury_flags(scores, sport, avg_stats)

        # 8. Frame timeline (downsampled for charting)
        frame_timeline = _build_frame_timeline(frame_flags)

        elapsed = round(time.time() - request_start, 2)
        logger.info(
            f"Analysis {analysis_id} complete in {elapsed}s — "
            f"overall: {scores['overall']}% ({risk_level}), "
            f"reps: {rep_count}, fatigue: {avg_stats.get('fatigue_score', 0)}%, "
            f"confidence: {avg_stats['analysis_confidence']}%"
        )

        return _build_response(
            analysis_id=analysis_id,
            movement_type=movement_type,
            scores=scores,
            avg_stats=avg_stats,
            n_frames=len(frames),
            coaching=coaching,
            annotated_b64=annotated_b64,
            annotated_frames_dict=annotated_set,
            frame_timeline=frame_timeline,
            metadata=metadata,
            risk_breakdown=risk_breakdown,
            sport_injury_flags=sport_inj_flags,
        )

    except HTTPException:
        raise
    except Exception:
        logger.error(f"Unexpected error:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred while processing your video. "
                "Please try again. If the problem persists, try a different video format."
            ),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError as e:
                logger.warning(f"Could not delete temp file {tmp_path}: {e}")
