import logging
import cv2
import mediapipe as mp

from config import settings

logger = logging.getLogger("injurylens.pose")


class PoseExtractor:
    """Extracts MediaPipe Pose landmarks from every valid frame in a video."""

    def __init__(self) -> None:
        self._mp_pose = mp.solutions.pose
        self._detection_conf = settings.POSE_DETECTION_CONFIDENCE
        self._tracking_conf = settings.POSE_TRACKING_CONFIDENCE
        self._min_visibility = settings.MIN_LANDMARK_VISIBILITY
        self._min_frames = settings.MIN_VALID_FRAMES

    def extract(self, video_path: str) -> tuple[list[list[dict]], dict]:
        """
        Run MediaPipe Pose on every frame of the video.

        Returns
        -------
        (valid_frames, metadata)
            valid_frames: list of frames, each is a list of 33 landmark dicts
                          with keys: id, x, y, z, visibility
            metadata: dict with total_frames, fps, width, height,
                      duration_seconds, valid_frame_indices
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(
                "Unable to open video file. It may be corrupted or in an unsupported codec. "
                "Please re-export as a standard MP4 (H.264) and try again."
            )

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration_seconds = total_frames / fps if fps > 0 else 0.0

        valid_frames: list[list[dict]] = []
        valid_frame_indices: list[int] = []
        frame_num = 0

        try:
            with self._mp_pose.Pose(
                static_image_mode=False,
                model_complexity=1,
                min_detection_confidence=self._detection_conf,
                min_tracking_confidence=self._tracking_conf,
            ) as pose:
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break

                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    result = pose.process(rgb)

                    if result.pose_landmarks:
                        raw = result.pose_landmarks.landmark
                        mean_vis = sum(lm.visibility for lm in raw) / len(raw)

                        if mean_vis > self._min_visibility:
                            landmarks = [
                                {
                                    "id": i,
                                    "x": lm.x,
                                    "y": lm.y,
                                    "z": lm.z,
                                    "visibility": lm.visibility,
                                }
                                for i, lm in enumerate(raw)
                            ]
                            valid_frames.append(landmarks)
                            valid_frame_indices.append(frame_num)

                    frame_num += 1
        finally:
            cap.release()

        logger.info(
            f"Pose extraction: {frame_num} total frames, {len(valid_frames)} valid "
            f"(visibility > {self._min_visibility})"
        )

        if len(valid_frames) < self._min_frames:
            raise ValueError(
                f"Only {len(valid_frames)} valid pose frames detected "
                f"(minimum {self._min_frames} required). "
                "Please re-record with better lighting, ensure your full body is "
                "visible from head to toe, and keep the camera steady."
            )

        metadata = {
            "total_frames": total_frames,
            "fps": round(fps, 2),
            "width": width,
            "height": height,
            "duration_seconds": round(duration_seconds, 2),
            "valid_frame_indices": valid_frame_indices,
        }
        return valid_frames, metadata
