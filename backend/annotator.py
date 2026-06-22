import base64
import logging
import math

import cv2
import mediapipe as mp

from config import settings

logger = logging.getLogger("injurylens.annotator")

_INDIGO_BGR = (241, 102, 99)
_WHITE_BGR  = (255, 255, 255)
_GREEN_BGR  = (94, 197, 34)
_AMBER_BGR  = (11, 158, 245)
_RED_BGR    = (68, 68, 239)
_DARK_BGR   = (10, 10, 20)


def _score_color(score: int) -> tuple:
    if score < 30:
        return _GREEN_BGR
    if score < 60:
        return _AMBER_BGR
    return _RED_BGR


class FrameAnnotator:
    """Draws MediaPipe skeleton + overlays on video frames."""

    def __init__(self) -> None:
        self._mp_pose    = mp.solutions.pose
        self._mp_drawing = mp.solutions.drawing_utils

    def annotate(
        self,
        video_path: str,
        frame_index: int,
        scores: dict,
        risk_level: str,
        label: str = "",
    ) -> str:
        """Seek to frame_index, annotate, return base64 PNG (no data-URI prefix)."""
        cap   = cv2.VideoCapture(video_path)
        frame = None
        try:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ret, frame = cap.read()
            if not ret:
                logger.warning(f"Could not seek to frame {frame_index}, falling back to 0")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = cap.read()
                if not ret:
                    raise ValueError("Could not read any frame from the video.")

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            with self._mp_pose.Pose(
                static_image_mode=True,
                model_complexity=1,
                min_detection_confidence=settings.POSE_DETECTION_CONFIDENCE,
            ) as pose:
                result = pose.process(rgb)

            if result.pose_landmarks:
                lm_spec   = self._mp_drawing.DrawingSpec(color=_INDIGO_BGR, thickness=2, circle_radius=4)
                conn_spec = self._mp_drawing.DrawingSpec(color=_WHITE_BGR,  thickness=2, circle_radius=2)
                self._mp_drawing.draw_landmarks(
                    frame, result.pose_landmarks,
                    self._mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=lm_spec,
                    connection_drawing_spec=conn_spec,
                )
                self._draw_angle_labels(frame, result.pose_landmarks, frame.shape)
            else:
                logger.warning("No pose detected on annotated frame")

            # Resize to max 800 px width
            h, w = frame.shape[:2]
            if w > 800:
                scale = 800 / w
                frame = cv2.resize(frame, (800, int(h * scale)))
                h, w  = frame.shape[:2]

            frame = self._draw_score_overlay(frame, scores, w, h)
            frame = self._draw_risk_badge(frame, scores["overall"], risk_level, w)
            if label:
                self._draw_frame_label(frame, label, w, h)
            frame = self._draw_watermark(frame, w, h)

        finally:
            cap.release()

        success, buf = cv2.imencode(".png", frame, [cv2.IMWRITE_PNG_COMPRESSION, 1])
        if not success:
            raise RuntimeError("Failed to encode annotated frame as PNG.")
        return base64.b64encode(buf.tobytes()).decode("utf-8")

    def annotate_multiple(
        self,
        video_path: str,
        worst_idx: int,
        best_idx: int,
        middle_idx: int,
        scores: dict,
        risk_level: str,
    ) -> dict:
        """Annotate three frames opening the video and running MediaPipe only once."""
        targets = [
            ("worst",  worst_idx,  "Worst Frame"),
            ("best",   best_idx,   "Best Frame"),
            ("middle", middle_idx, "Middle Frame"),
        ]

        # Single video open — seek to each target frame
        cap = cv2.VideoCapture(video_path)
        raw: dict[str, object] = {}
        try:
            for key, idx, _ in targets:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret:
                    logger.warning(f"Could not seek to frame {idx}, falling back to frame 0")
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = cap.read()
                    if not ret:
                        raise ValueError("Could not read any frame from the video.")
                raw[key] = frame
        finally:
            cap.release()

        # Single MediaPipe session for all three frames
        result: dict[str, str] = {}
        with self._mp_pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            min_detection_confidence=settings.POSE_DETECTION_CONFIDENCE,
        ) as pose:
            for key, _, label in targets:
                frame = raw[key].copy()
                rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pr    = pose.process(rgb)

                if pr.pose_landmarks:
                    self._mp_drawing.draw_landmarks(
                        frame, pr.pose_landmarks,
                        self._mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=self._mp_drawing.DrawingSpec(
                            color=_INDIGO_BGR, thickness=2, circle_radius=4),
                        connection_drawing_spec=self._mp_drawing.DrawingSpec(
                            color=_WHITE_BGR, thickness=2, circle_radius=2),
                    )
                    self._draw_angle_labels(frame, pr.pose_landmarks, frame.shape)
                else:
                    logger.warning(f"No pose detected on '{key}' frame")

                h, w = frame.shape[:2]
                if w > 800:
                    scale = 800 / w
                    frame = cv2.resize(frame, (800, int(h * scale)))
                    h, w  = frame.shape[:2]

                frame = self._draw_score_overlay(frame, scores, w, h)
                frame = self._draw_risk_badge(frame, scores["overall"], risk_level, w)
                self._draw_frame_label(frame, label, w, h)
                frame = self._draw_watermark(frame, w, h)

                success, buf = cv2.imencode(".png", frame, [cv2.IMWRITE_PNG_COMPRESSION, 1])
                if not success:
                    raise RuntimeError(f"Failed to encode '{key}' frame as PNG.")
                result[key] = base64.b64encode(buf.tobytes()).decode("utf-8")

        return result

    def _draw_angle_labels(self, frame, pose_landmarks, shape) -> None:
        h, w = shape[:2]
        lms  = pose_landmarks.landmark

        def px(idx):
            lm = lms[idx]
            return (int(lm.x * w), int(lm.y * h))

        def _angle_2d(a, b, c):
            ax, ay = a[0] - b[0], a[1] - b[1]
            cx, cy = c[0] - b[0], c[1] - b[1]
            dot    = ax * cx + ay * cy
            mag_a  = math.sqrt(ax**2 + ay**2)
            mag_c  = math.sqrt(cx**2 + cy**2)
            if mag_a * mag_c == 0:
                return 0.0
            cos_a = max(-1.0, min(1.0, dot / (mag_a * mag_c)))
            return math.degrees(math.acos(cos_a))

        joint_triplets = [
            (23, 25, 27),  # left knee
            (24, 26, 28),  # right knee
        ]

        for a_idx, b_idx, c_idx in joint_triplets:
            try:
                a  = px(a_idx)
                b  = px(b_idx)
                c  = px(c_idx)
                angle = _angle_2d(a, b, c)
                color = _score_color(int(max(0, min(100, (180 - angle) / 90 * 100))))
                cv2.putText(
                    frame, f"{angle:.0f}°", (b[0] + 8, b[1] - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA,
                )
            except Exception:
                pass

    def _draw_score_overlay(self, frame, scores: dict, w: int, h: int):
        items = [
            ("L.Knee",    scores["knee_valgus_left"]),
            ("R.Knee",    scores["knee_valgus_right"]),
            ("Trunk",     scores["trunk_lean"]),
            ("Symmetry",  scores["asymmetry"]),
            ("Shoulder",  scores.get("shoulder_asymmetry", 0)),
            ("Hip",       scores.get("hip_drop", 0)),
        ]
        panel_w = 190
        panel_h = len(items) * 26 + 18
        overlay = frame.copy()
        cv2.rectangle(overlay, (8, 8), (8 + panel_w, 8 + panel_h), _DARK_BGR, -1)
        cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)

        for i, (label, score) in enumerate(items):
            y = 30 + i * 26
            color = _score_color(score)
            cv2.putText(frame, f"{label}: {score}%", (15, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.50, color, 1, cv2.LINE_AA)
        return frame

    def _draw_risk_badge(self, frame, overall: int, risk_level: str, w: int):
        badge_text = f"Risk: {risk_level}"
        color = _score_color(overall)
        font  = cv2.FONT_HERSHEY_SIMPLEX
        scale, thickness = 0.6, 2
        (tw, th), _ = cv2.getTextSize(badge_text, font, scale, thickness)
        pad = 10
        x1 = w - tw - pad * 2 - 10
        y1 = 8
        x2 = w - 10
        y2 = y1 + th + pad * 2
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, -1)
        cv2.putText(frame, badge_text, (x1 + pad, y2 - pad),
                    font, scale, _WHITE_BGR, thickness, cv2.LINE_AA)
        return frame

    def _draw_frame_label(self, frame, label: str, w: int, h: int):
        font  = cv2.FONT_HERSHEY_SIMPLEX
        scale = 0.55
        (tw, _), _ = cv2.getTextSize(label, font, scale, 1)
        x = w - tw - 14
        y = h - 44
        cv2.putText(frame, label, (x, y), font, scale, (180, 180, 220), 1, cv2.LINE_AA)

    def _draw_watermark(self, frame, w: int, h: int):
        bar_h   = 30
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, h - bar_h), (w, h), _DARK_BGR, -1)
        cv2.addWeighted(overlay, 0.72, frame, 0.28, 0, frame)
        cv2.putText(
            frame,
            "InjuryLens  |  AI Movement Analysis",
            (10, h - 9),
            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 180, 180), 1, cv2.LINE_AA,
        )
        return frame
