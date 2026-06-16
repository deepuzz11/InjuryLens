import os
import uuid
import time
import base64
import json
import logging
import tempfile
import traceback
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("injurylens")

START_TIME = time.time()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API configured successfully")
else:
    logger.warning("GEMINI_API_KEY not set — AI coaching will use fallback responses")

app = FastAPI(title="InjuryLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

ALLOWED_MIME_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"}
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi"}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100MB

# Landmark indices (MediaPipe Pose)
NOSE = 0
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28


# ─────────────────────────────────────────────
# BIOMECHANICS UTILITIES
# ─────────────────────────────────────────────

def calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """Return the angle at vertex b formed by segments b→a and b→c, in degrees."""
    ba = a - b
    bc = c - b
    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)
    if norm_ba < 1e-6 or norm_bc < 1e-6:
        return 180.0
    cos_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_angle)))


def get_landmark_xy(landmarks, idx: int, w: int, h: int) -> np.ndarray:
    lm = landmarks.landmark[idx]
    return np.array([lm.x * w, lm.y * h])


def get_landmark_xyz(landmarks, idx: int) -> np.ndarray:
    lm = landmarks.landmark[idx]
    return np.array([lm.x, lm.y, lm.z])


def mean_visibility(landmarks, indices: list[int]) -> float:
    return float(np.mean([landmarks.landmark[i].visibility for i in indices]))


def compute_trunk_lean_angle(landmarks) -> float:
    """Angle between the torso line (mid-hip → mid-shoulder) and vertical axis."""
    mid_hip = (get_landmark_xyz(landmarks, LEFT_HIP) + get_landmark_xyz(landmarks, RIGHT_HIP)) / 2
    mid_shoulder = (get_landmark_xyz(landmarks, LEFT_SHOULDER) + get_landmark_xyz(landmarks, RIGHT_SHOULDER)) / 2
    torso = mid_shoulder - mid_hip
    vertical = np.array([0, -1, 0])
    norm_t = np.linalg.norm(torso)
    if norm_t < 1e-6:
        return 0.0
    cos_a = np.dot(torso, vertical) / norm_t
    cos_a = np.clip(cos_a, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_a)))


# ─────────────────────────────────────────────
# VIDEO PROCESSING
# ─────────────────────────────────────────────

def extract_pose_data(video_path: str) -> dict:
    """
    Run MediaPipe Pose on every frame.
    Returns per-frame angle data and the raw frames list for annotation.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Unable to open video file. It may be corrupted or in an unsupported format.")

    frame_data = []
    raw_frames = []
    frame_idx = 0

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6,
    ) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)

            if results.pose_landmarks:
                lms = results.pose_landmarks
                key_indices = [LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE,
                               LEFT_ANKLE, RIGHT_ANKLE, LEFT_SHOULDER, RIGHT_SHOULDER]
                vis = mean_visibility(lms, key_indices)

                if vis > 0.5:
                    lhip = get_landmark_xy(lms, LEFT_HIP, w, h)
                    lknee = get_landmark_xy(lms, LEFT_KNEE, w, h)
                    lankle = get_landmark_xy(lms, LEFT_ANKLE, w, h)
                    rhip = get_landmark_xy(lms, RIGHT_HIP, w, h)
                    rknee = get_landmark_xy(lms, RIGHT_KNEE, w, h)
                    rankle = get_landmark_xy(lms, RIGHT_ANKLE, w, h)

                    left_knee_angle = calculate_angle(lhip, lknee, lankle)
                    right_knee_angle = calculate_angle(rhip, rknee, rankle)
                    trunk_lean = compute_trunk_lean_angle(lms)
                    asymmetry = abs(left_knee_angle - right_knee_angle)

                    frame_data.append({
                        "frame_idx": frame_idx,
                        "left_knee_angle": left_knee_angle,
                        "right_knee_angle": right_knee_angle,
                        "trunk_lean": trunk_lean,
                        "asymmetry": asymmetry,
                        "landmarks": lms,
                        "frame": frame.copy(),
                        "visibility": vis,
                    })
                    raw_frames.append(frame.copy())

            frame_idx += 1

    cap.release()

    if len(frame_data) < 10:
        raise ValueError(
            f"Only {len(frame_data)} valid pose frames detected (minimum 10 required). "
            "Please re-record with better lighting, ensure your full body is visible, "
            "and keep the camera steady."
        )

    return frame_data


def compute_risk_scores(frame_data: list[dict]) -> dict:
    """Convert per-frame flags to 0–100 risk scores and supplementary stats."""
    n = len(frame_data)

    left_valgus_flags = [1 for f in frame_data if f["left_knee_angle"] < 165]
    right_valgus_flags = [1 for f in frame_data if f["right_knee_angle"] < 165]
    trunk_flags = [1 for f in frame_data if f["trunk_lean"] > 25]
    asym_flags = [1 for f in frame_data if f["asymmetry"] > 10]

    knee_valgus_left = int(round(len(left_valgus_flags) / n * 100))
    knee_valgus_right = int(round(len(right_valgus_flags) / n * 100))
    trunk_lean = int(round(len(trunk_flags) / n * 100))
    asymmetry = int(round(len(asym_flags) / n * 100))

    overall = int(round(
        knee_valgus_left * 0.30 +
        knee_valgus_right * 0.30 +
        trunk_lean * 0.25 +
        asymmetry * 0.15
    ))

    avg_left = float(np.mean([f["left_knee_angle"] for f in frame_data]))
    avg_right = float(np.mean([f["right_knee_angle"] for f in frame_data]))
    avg_trunk = float(np.mean([f["trunk_lean"] for f in frame_data]))

    # Worst frame = highest combined risk per frame
    def frame_risk(f):
        r = 0
        if f["left_knee_angle"] < 165:
            r += 30
        if f["right_knee_angle"] < 165:
            r += 30
        if f["trunk_lean"] > 25:
            r += 25
        if f["asymmetry"] > 10:
            r += 15
        return r

    worst_idx = int(np.argmax([frame_risk(f) for f in frame_data]))

    return {
        "scores": {
            "knee_valgus_left": knee_valgus_left,
            "knee_valgus_right": knee_valgus_right,
            "trunk_lean": trunk_lean,
            "asymmetry": asymmetry,
            "overall": overall,
        },
        "supplementary": {
            "avg_left_knee_angle": round(avg_left, 1),
            "avg_right_knee_angle": round(avg_right, 1),
            "avg_trunk_lean_angle": round(avg_trunk, 1),
            "total_frames_analyzed": n,
            "worst_frame_index": worst_idx,
        },
    }


# ─────────────────────────────────────────────
# FRAME ANNOTATION
# ─────────────────────────────────────────────

# Indigo and white matching the design system
LANDMARK_COLOR = (241, 102, 99)   # BGR of #6366f1 → (241,102,99) — actually let's use proper BGR
LANDMARK_COLOR_BGR = (241, 102, 99)   # BGR: R=99,G=102,B=241 → (241,102,99)
CONNECTION_COLOR_BGR = (255, 255, 255)
LANDMARK_DOT_BGR = (241, 102, 99)   # indigo BGR


def annotate_frame(frame_data: list[dict], worst_idx: int, scores: dict) -> str:
    """Draw MediaPipe skeleton on the worst frame and return base64 PNG."""
    entry = frame_data[worst_idx]
    frame = entry["frame"].copy()
    landmarks = entry["landmarks"]

    h, w = frame.shape[:2]

    # Draw connections (white)
    landmark_drawing_spec = mp_drawing.DrawingSpec(
        color=(241, 102, 99), thickness=2, circle_radius=4  # BGR for indigo
    )
    connection_drawing_spec = mp_drawing.DrawingSpec(
        color=(255, 255, 255), thickness=2, circle_radius=2
    )
    mp_drawing.draw_landmarks(
        frame,
        landmarks,
        mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=landmark_drawing_spec,
        connection_drawing_spec=connection_drawing_spec,
    )

    # Resize to max 800px width
    if w > 800:
        scale = 800 / w
        new_w = 800
        new_h = int(h * scale)
        frame = cv2.resize(frame, (new_w, new_h))
        h, w = new_h, new_w

    # Top-left score overlay
    score_items = [
        ("L.Knee", scores["knee_valgus_left"]),
        ("R.Knee", scores["knee_valgus_right"]),
        ("Trunk", scores["trunk_lean"]),
        ("Symmetry", scores["asymmetry"]),
    ]
    overlay = frame.copy()
    cv2.rectangle(overlay, (8, 8), (180, 8 + len(score_items) * 28 + 10), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    for i, (label, score) in enumerate(score_items):
        y = 30 + i * 28
        if score <= 30:
            color = (78, 197, 34)   # BGR green
        elif score <= 60:
            color = (11, 158, 245)  # BGR amber
        else:
            color = (68, 68, 239)   # BGR red
        cv2.putText(frame, f"{label}: {score}%", (14, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 1, cv2.LINE_AA)

    # Top-right overall risk badge
    overall = scores["overall"]
    if overall <= 30:
        risk_label = "LOW RISK"
        badge_color = (78, 197, 34)
    elif overall <= 60:
        risk_label = "MODERATE"
        badge_color = (11, 158, 245)
    else:
        risk_label = "HIGH RISK"
        badge_color = (68, 68, 239)

    (tw, th), _ = cv2.getTextSize(risk_label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    bx1 = w - tw - 22
    bx2 = w - 8
    by1 = 8
    by2 = 8 + th + 16
    cv2.rectangle(frame, (bx1, by1), (bx2, by2), badge_color, -1)
    cv2.putText(frame, risk_label, (bx1 + 8, by2 - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

    # Bottom watermark bar
    bar_h = 32
    overlay2 = frame.copy()
    cv2.rectangle(overlay2, (0, h - bar_h), (w, h), (0, 0, 0), -1)
    cv2.addWeighted(overlay2, 0.7, frame, 0.3, 0, frame)
    cv2.putText(frame, "InjuryLens Analysis — PhysTech 2026",
                (10, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                (180, 180, 180), 1, cv2.LINE_AA)

    # Encode to base64 PNG
    success, buf = cv2.imencode(".png", frame, [cv2.IMWRITE_PNG_COMPRESSION, 1])
    if not success:
        raise RuntimeError("Failed to encode annotated frame as PNG")
    return base64.b64encode(buf.tobytes()).decode("utf-8")


# ─────────────────────────────────────────────
# AI COACHING
# ─────────────────────────────────────────────

STATIC_FALLBACK = {
    "overall_risk_level": "Moderate",
    "overall_summary": (
        "Your movement analysis shows some areas for improvement, particularly in knee alignment "
        "and trunk stability. With targeted exercises and cue adjustments, you can significantly "
        "reduce your injury risk."
    ),
    "priority_issue": (
        "Focus on knee alignment first — knee cave (valgus collapse) during loading phases "
        "dramatically increases ACL and meniscus stress. Strengthen your glutes and practice "
        "consciously driving knees out over toes."
    ),
    "coaching_cues": [
        "Drive your knees outward in line with your second toe throughout the movement.",
        "Brace your core before initiating the movement and maintain tension throughout.",
        "Keep your chest tall — imagine a string pulling the crown of your head to the ceiling.",
    ],
    "exercise_prescription": [
        {
            "name": "Banded Squat with Knee Tracking",
            "sets_reps": "3 × 15 reps",
            "why": "Resistance band feedback trains the nervous system to maintain knee alignment.",
        },
        {
            "name": "Single-Leg Glute Bridge",
            "sets_reps": "3 × 12 each side",
            "why": "Isolates and strengthens the glute medius, the primary stabilizer against valgus.",
        },
        {
            "name": "Romanian Deadlift (light)",
            "sets_reps": "3 × 10 reps",
            "why": "Builds posterior chain strength and teaches neutral spinal alignment under load.",
        },
    ],
    "positive_observation": (
        "Your movement shows good overall body awareness and consistent rhythm. The bilateral "
        "loading pattern is present, which is a solid foundation to build upon."
    ),
    "follow_up_timeline": (
        "Re-assess your movement in 3–4 weeks after practicing the prescribed exercises. "
        "Most athletes see measurable improvement in knee tracking within 2–3 weeks of consistent training."
    ),
    "individual_feedback": {
        "knee_valgus_left": (
            "Left knee shows inward collapse during the loading phase. This increases medial "
            "compartment stress. Focus on activating your left glute medius before and during the movement."
        ),
        "knee_valgus_right": (
            "Right knee alignment is a key focus area. Practice single-leg balance drills to build "
            "proprioceptive awareness and strengthen the lateral hip stabilizers on this side."
        ),
        "trunk_lean": (
            "Excessive forward trunk lean detected. This shifts load onto the lumbar spine and anterior "
            "knee. Strengthen your thoracic extensors and practice the movement with arms raised overhead."
        ),
        "asymmetry": (
            "Left-right asymmetry in knee angles suggests a dominant side compensating for the weaker side. "
            "Incorporate unilateral exercises to address the imbalance before it leads to overuse injury."
        ),
    },
}


def build_coaching_prompt(movement_type: str, fitness_level: str, age_group: str,
                          goal: str, scores: dict, supplementary: dict) -> str:
    return f"""You are an expert sports physiotherapist providing a detailed injury risk coaching report.

ATHLETE PROFILE:
- Movement: {movement_type}
- Fitness Level: {fitness_level}
- Age Group: {age_group}
- Goal: {goal}

BIOMECHANICAL ANALYSIS RESULTS:
- Left Knee Valgus Risk Score: {scores['knee_valgus_left']}/100 (% of frames with valgus)
- Right Knee Valgus Risk Score: {scores['knee_valgus_right']}/100
- Trunk Lean Risk Score: {scores['trunk_lean']}/100
- Movement Asymmetry Risk Score: {scores['asymmetry']}/100
- Overall Weighted Risk Score: {scores['overall']}/100

SUPPLEMENTARY DATA:
- Average Left Knee Angle: {supplementary['avg_left_knee_angle']}°
- Average Right Knee Angle: {supplementary['avg_right_knee_angle']}°
- Average Trunk Lean: {supplementary['avg_trunk_lean_angle']}°
- Total Frames Analyzed: {supplementary['total_frames_analyzed']}

Based on this data, provide a comprehensive physiotherapy coaching report. Return ONLY valid JSON with NO markdown fences, NO extra text. Use exactly this structure:

{{
  "overall_risk_level": "Low" | "Moderate" | "High",
  "overall_summary": "2-3 sentence plain-English summary of the athlete's movement quality and main concerns",
  "priority_issue": "The single most important thing to address, explained in 2 sentences with clinical reasoning",
  "coaching_cues": ["cue1", "cue2", "cue3"],
  "exercise_prescription": [
    {{"name": "Exercise Name", "sets_reps": "3 × 10 reps", "why": "Brief clinical reason"}},
    {{"name": "Exercise Name", "sets_reps": "3 × 12 reps", "why": "Brief clinical reason"}},
    {{"name": "Exercise Name", "sets_reps": "2 × 15 reps", "why": "Brief clinical reason"}}
  ],
  "positive_observation": "What the athlete is doing well — specific and encouraging",
  "follow_up_timeline": "Specific timeline for re-assessment and expected progress",
  "individual_feedback": {{
    "knee_valgus_left": "Specific feedback for left knee valgus finding",
    "knee_valgus_right": "Specific feedback for right knee finding",
    "trunk_lean": "Specific feedback for trunk lean finding",
    "asymmetry": "Specific feedback for asymmetry finding"
  }}
}}"""


def get_ai_coaching(movement_type: str, fitness_level: str, age_group: str,
                    goal: str, scores: dict, supplementary: dict) -> dict:
    """Call Gemini 2.0 Flash for coaching. Falls back to static if unavailable."""
    if not GEMINI_API_KEY:
        logger.info("No Gemini key — using static fallback coaching")
        return _personalize_fallback(scores, movement_type)

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                max_output_tokens=2048,
            ),
        )
        prompt = build_coaching_prompt(movement_type, fitness_level, age_group, goal, scores, supplementary)
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        if raw.endswith("```"):
            raw = raw[:-3].strip()

        coaching = json.loads(raw)

        # Validate required keys — fill missing from fallback
        required_keys = [
            "overall_risk_level", "overall_summary", "priority_issue",
            "coaching_cues", "exercise_prescription", "positive_observation",
            "follow_up_timeline", "individual_feedback",
        ]
        fallback = _personalize_fallback(scores, movement_type)
        for key in required_keys:
            if key not in coaching or not coaching[key]:
                logger.warning(f"Gemini response missing key '{key}' — using fallback")
                coaching[key] = fallback[key]

        return coaching

    except Exception as exc:
        logger.error(f"Gemini API error: {exc} — using static fallback coaching")
        return _personalize_fallback(scores, movement_type)


def _personalize_fallback(scores: dict, movement_type: str) -> dict:
    """Return a copy of STATIC_FALLBACK with risk level adjusted to actual scores."""
    import copy
    coaching = copy.deepcopy(STATIC_FALLBACK)
    overall = scores["overall"]
    if overall <= 30:
        coaching["overall_risk_level"] = "Low"
        coaching["overall_summary"] = (
            f"Your {movement_type} analysis shows excellent movement quality with low injury risk. "
            "Your biomechanical patterns are well-controlled. Keep up the great work and focus on "
            "maintaining this quality as you increase load or intensity."
        )
        coaching["positive_observation"] = (
            "Exceptional movement quality across all measured parameters. Your joint alignment, "
            "trunk control, and bilateral symmetry are all within optimal ranges — a testament "
            "to your training discipline."
        )
    elif overall <= 60:
        coaching["overall_risk_level"] = "Moderate"
    else:
        coaching["overall_risk_level"] = "High"
        coaching["overall_summary"] = (
            f"Your {movement_type} shows significant biomechanical risk factors that require "
            "immediate attention. Multiple parameters are outside safe ranges. We strongly "
            "recommend working with a physiotherapist before increasing training volume."
        )
    return coaching


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/health")
async def health_check():
    uptime_seconds = int(time.time() - START_TIME)
    return {
        "status": "healthy",
        "model": "gemini-2.0-flash",
        "mediapipe_version": mp.__version__,
        "uptime_seconds": uptime_seconds,
        "gemini_configured": bool(GEMINI_API_KEY),
    }


@app.post("/analyze")
async def analyze_video(
    file: UploadFile = File(...),
    movement_type: str = Form(default="Squat"),
    fitness_level: str = Form(default="Intermediate"),
    age_group: str = Form(default="25–34"),
    goal: str = Form(default="Injury Prevention"),
):
    request_start = time.time()
    logger.info(f"Analysis request — movement: {movement_type}, fitness: {fitness_level}")

    # Validate file type
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type '{file_ext}'. Please upload an MP4, MOV, or AVI video.",
        )

    content_type = file.content_type or ""
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        logger.warning(f"Unexpected content-type: {content_type} — proceeding by extension")

    # Read and validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File size {len(content) / 1024 / 1024:.1f}MB exceeds the 100MB limit.",
        )

    tmp_path = None
    try:
        # Write to temp file
        suffix = f"_{uuid.uuid4().hex}{file_ext}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        logger.info(f"Saved temp video: {tmp_path} ({len(content) / 1024:.0f} KB)")

        # Extract pose data
        try:
            frame_data = extract_pose_data(tmp_path)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

        logger.info(f"Pose extracted: {len(frame_data)} valid frames")

        # Compute risk scores
        risk = compute_risk_scores(frame_data)
        scores = risk["scores"]
        supplementary = risk["supplementary"]

        # Annotate worst frame
        annotated_b64 = annotate_frame(
            frame_data, supplementary["worst_frame_index"], scores
        )

        # Get AI coaching
        ai_coaching = get_ai_coaching(
            movement_type, fitness_level, age_group, goal, scores, supplementary
        )

        elapsed = round(time.time() - request_start, 2)
        logger.info(f"Analysis complete in {elapsed}s — overall risk: {scores['overall']}")

        return JSONResponse({
            "movement_type": movement_type,
            "scores": scores,
            "supplementary": supplementary,
            "ai_coaching": ai_coaching,
            "annotated_frame": annotated_b64,
        })

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Unexpected error during analysis: {exc}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during video analysis. Please try again.",
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError as e:
                logger.warning(f"Failed to delete temp file {tmp_path}: {e}")
