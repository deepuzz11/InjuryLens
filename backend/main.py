import os
import time
import uuid
import logging
import tempfile
import traceback
from pathlib import Path

import mediapipe as mp
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

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

pose_extractor   = PoseExtractor()
biomechanics_engine = BiomechanicsEngine()
risk_scorer      = RiskScorer()
ai_coach         = AICoach()
frame_annotator  = FrameAnnotator()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered sports movement analysis and injury risk assessment.",
)


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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.on_event("startup")
def on_startup():
    init_db()
    _seed_demo_user()
    logger.info("Database initialised.")

def _seed_demo_user():
    """Ensure a demo account exists so users can try the app without registering."""
    from database import SessionLocal
    from auth_models import User
    from passlib.context import CryptContext
    _pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "demo@injurylens.com").first():
            db.add(User(
                name="Demo Athlete",
                email="demo@injurylens.com",
                hashed_password=_pwd.hash("demo1234"),
            ))
            db.commit()
            logger.info("Demo user created: demo@injurylens.com / demo1234")
    finally:
        db.close()

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi"}
ALLOWED_MIME_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"}

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
    )


# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
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
async def analyze_video(
    file: UploadFile = File(...),
    movement_type: str = Form(default="Squat"),
    fitness_level: str = Form(default="Intermediate"),
    age_group: str = Form(default="25–34"),
    goal: str = Form(default="Injury Prevention"),
    sport: str = Form(default=""),
):
    request_start = time.time()
    logger.info(
        f"Analysis — movement: {movement_type!r}, fitness: {fitness_level!r}, "
        f"age: {age_group!r}, goal: {goal!r}, sport: {sport!r}"
    )

    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unsupported file type '{file_ext or 'unknown'}'. "
                "Please upload an MP4, MOV, or AVI video file."
            ),
        )

    ct = file.content_type or ""
    if ct and ct not in ALLOWED_MIME_TYPES:
        logger.warning(f"Unexpected content-type '{ct}' for extension '{file_ext}'")

    content  = await file.read()
    max_bytes = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        size_mb = len(content) / 1024 / 1024
        raise HTTPException(
            status_code=413,
            detail=(
                f"File size {size_mb:.1f} MB exceeds the {settings.MAX_VIDEO_SIZE_MB} MB limit. "
                "Please compress your video or trim it to a shorter clip."
            ),
        )

    analysis_id = uuid.uuid4().hex
    tmp_path: str | None = None

    try:
        suffix = f"_{analysis_id}{file_ext}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        logger.info(f"Video saved to {tmp_path} ({len(content) / 1024:.0f} KB)")

        # 1. Extract pose landmarks
        try:
            frames, metadata = pose_extractor.extract(tmp_path)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

        logger.info(f"Pose extraction: {len(frames)} valid frames")

        # 2. Biomechanical analysis (movement-aware)
        frame_flags, avg_stats = biomechanics_engine.analyze(frames, movement_type)

        # 3. Risk scoring
        scores     = risk_scorer.score(frame_flags, movement_type)
        risk_level = _risk_level_from_score(scores["overall"])

        # 4. Annotate frames
        worst_valid_idx  = avg_stats["worst_frame_index"]
        best_valid_idx   = avg_stats["best_frame_index"]
        middle_valid_idx = avg_stats["middle_frame_index"]

        valid_indices = metadata["valid_frame_indices"]
        worst_actual  = valid_indices[worst_valid_idx]
        best_actual   = valid_indices[best_valid_idx]
        middle_actual = valid_indices[middle_valid_idx]

        annotated_b64  = frame_annotator.annotate(tmp_path, worst_actual, scores, risk_level)
        annotated_set  = frame_annotator.annotate_multiple(
            tmp_path, worst_actual, best_actual, middle_actual, scores, risk_level
        )

        # 5. AI coaching
        athlete_context = {
            "fitness_level": fitness_level,
            "age_group":     age_group,
            "goal":          goal,
            "sport":         sport,
        }
        coaching = ai_coach.generate(scores, avg_stats, movement_type, athlete_context)

        # 6. Movement Quality Score + Injury Probability (Features 5, 12)
        mqs_result = risk_scorer.calculate_mqs(scores)
        injury_prob = risk_scorer.calculate_injury_probability(scores, avg_stats)

        avg_stats["mqs_score"]            = mqs_result["mqs_score"]
        avg_stats["mqs_grade"]            = mqs_result["mqs_grade"]
        avg_stats["mqs_percentile"]       = mqs_result["mqs_percentile"]
        avg_stats["injury_probability_4w"] = injury_prob

        # 7. Frame timeline (downsampled for charting)
        frame_timeline = _build_frame_timeline(frame_flags)

        elapsed = round(time.time() - request_start, 2)
        logger.info(
            f"Analysis {analysis_id} complete in {elapsed}s — "
            f"overall: {scores['overall']}% ({risk_level}), "
            f"reps: {avg_stats.get('rep_count', 0)}, fatigue: {avg_stats.get('fatigue_score', 0)}%"
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
