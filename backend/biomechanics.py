import math
import logging

logger = logging.getLogger("injurylens.biomechanics")

# MediaPipe Pose landmark indices
_LEFT_SHOULDER  = 11
_RIGHT_SHOULDER = 12
_LEFT_HIP       = 23
_RIGHT_HIP      = 24
_LEFT_KNEE      = 25
_RIGHT_KNEE     = 26
_LEFT_ANKLE     = 27
_RIGHT_ANKLE    = 28
_LEFT_ELBOW     = 13
_RIGHT_ELBOW    = 14
_LEFT_WRIST     = 15
_RIGHT_WRIST    = 16

# Per-movement thresholds: (valgus_angle, trunk_lean_deg, knee_asym_deg)
_MOVEMENT_PROFILES: dict[str, dict] = {
    "Squat":          {"valgus": 165.0, "trunk": 30.0, "asym": 10.0},
    "Deadlift":       {"valgus": 168.0, "trunk": 45.0, "asym": 12.0},
    "Lunge":          {"valgus": 163.0, "trunk": 15.0, "asym": 15.0},
    "Running":        {"valgus": 168.0, "trunk": 15.0, "asym": 8.0},
    "Jump Landing":   {"valgus": 160.0, "trunk": 30.0, "asym": 12.0},
    "Push-up":        {"valgus": 170.0, "trunk": 10.0, "asym": 15.0},
    "Plank":          {"valgus": 170.0, "trunk": 10.0, "asym": 15.0},
    "Hip Hinge":      {"valgus": 167.0, "trunk": 50.0, "asym": 10.0},
    "Overhead Press": {"valgus": 170.0, "trunk": 15.0, "asym": 10.0},
    "Lateral Lunge":  {"valgus": 160.0, "trunk": 20.0, "asym": 18.0},
    "Split Squat":    {"valgus": 162.0, "trunk": 15.0, "asym": 20.0},
    "Bench Press":    {"valgus": 170.0, "trunk": 10.0, "asym": 12.0},
}
_DEFAULT_PROFILE = {"valgus": 165.0, "trunk": 25.0, "asym": 10.0}

_SHOULDER_ASYM_THRESHOLD = 0.05  # normalized coordinate units
_HIP_DROP_THRESHOLD      = 0.04


class BiomechanicsEngine:
    """Frame-level biomechanical analysis using 2D+3D landmark coordinates."""

    @staticmethod
    def calculate_angle(a: tuple, b: tuple, c: tuple) -> float:
        radians = math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(
            a[1] - b[1], a[0] - b[0]
        )
        angle = abs(math.degrees(radians))
        if angle > 180.0:
            angle = 360.0 - angle
        return max(0.0, min(180.0, angle))

    @staticmethod
    def get_point(landmarks: list[dict], idx: int) -> tuple:
        lm = landmarks[idx]
        return (lm["x"], lm["y"])

    @staticmethod
    def get_point_3d(landmarks: list[dict], idx: int) -> tuple:
        lm = landmarks[idx]
        return (lm["x"], lm["y"], lm.get("z", 0.0))

    def analyze(
        self, all_frames: list[list[dict]], movement_type: str = "Squat"
    ) -> tuple[list[dict], dict]:
        profile = _MOVEMENT_PROFILES.get(movement_type, _DEFAULT_PROFILE)
        valgus_thresh = profile["valgus"]
        trunk_thresh  = profile["trunk"]
        asym_thresh   = profile["asym"]

        frame_flags: list[dict] = []

        for lms in all_frames:
            lhip      = self.get_point(lms, _LEFT_HIP)
            lknee     = self.get_point(lms, _LEFT_KNEE)
            lankle    = self.get_point(lms, _LEFT_ANKLE)
            rhip      = self.get_point(lms, _RIGHT_HIP)
            rknee     = self.get_point(lms, _RIGHT_KNEE)
            rankle    = self.get_point(lms, _RIGHT_ANKLE)
            lshoulder = self.get_point(lms, _LEFT_SHOULDER)
            rshoulder = self.get_point(lms, _RIGHT_SHOULDER)

            # 3D points for depth-aware analysis (Feature 11)
            lshoulder_3d = self.get_point_3d(lms, _LEFT_SHOULDER)
            rshoulder_3d = self.get_point_3d(lms, _RIGHT_SHOULDER)
            lhip_3d      = self.get_point_3d(lms, _LEFT_HIP)
            rhip_3d      = self.get_point_3d(lms, _RIGHT_HIP)
            lknee_3d     = self.get_point_3d(lms, _LEFT_KNEE)
            rknee_3d     = self.get_point_3d(lms, _RIGHT_KNEE)

            left_knee_angle  = self.calculate_angle(lhip, lknee, lankle)
            right_knee_angle = self.calculate_angle(rhip, rknee, rankle)

            # Trunk lean: angle between torso vector and vertical axis
            mid_hip      = ((lhip[0] + rhip[0]) / 2, (lhip[1] + rhip[1]) / 2)
            mid_shoulder = ((lshoulder[0] + rshoulder[0]) / 2, (lshoulder[1] + rshoulder[1]) / 2)
            torso_x = mid_shoulder[0] - mid_hip[0]
            torso_y = mid_shoulder[1] - mid_hip[1]
            torso_len = math.sqrt(torso_x ** 2 + torso_y ** 2)
            if torso_len > 1e-6:
                cos_a = (torso_x * 0 + torso_y * -1) / torso_len
                trunk_lean_angle = math.degrees(math.acos(max(-1.0, min(1.0, cos_a))))
            else:
                trunk_lean_angle = 0.0

            # Shoulder height asymmetry (y increases downward)
            shoulder_height_diff = abs(lshoulder[1] - rshoulder[1])
            shoulder_asym_flag   = shoulder_height_diff > _SHOULDER_ASYM_THRESHOLD

            # Hip drop (lateral pelvic tilt)
            hip_height_diff = abs(lhip[1] - rhip[1])
            hip_drop_flag   = hip_height_diff > _HIP_DROP_THRESHOLD

            # 3D trunk rotation: difference in z-depth between shoulders
            # indicates how much the torso is rotated toward/away camera
            trunk_rotation_3d = abs(lshoulder_3d[2] - rshoulder_3d[2]) * 100.0
            hip_rotation_3d   = abs(lhip_3d[2]      - rhip_3d[2])      * 100.0

            # 3D knee depth asymmetry: clinically relevant for ACL risk
            knee_depth_asym_3d = abs(lknee_3d[2] - rknee_3d[2]) * 100.0

            # Composite frame-level risk 0–100
            frame_risk = (
                (30 if left_knee_angle  < valgus_thresh else 0)
                + (30 if right_knee_angle < valgus_thresh else 0)
                + (25 if trunk_lean_angle > trunk_thresh  else 0)
                + (10 if abs(left_knee_angle - right_knee_angle) > asym_thresh else 0)
                + (3  if shoulder_asym_flag else 0)
                + (2  if hip_drop_flag      else 0)
            )

            frame_flags.append({
                "knee_valgus_left":     left_knee_angle  < valgus_thresh,
                "knee_valgus_right":    right_knee_angle < valgus_thresh,
                "trunk_lean":           trunk_lean_angle > trunk_thresh,
                "asymmetry":            abs(left_knee_angle - right_knee_angle) > asym_thresh,
                "shoulder_asymmetry":   shoulder_asym_flag,
                "hip_drop":             hip_drop_flag,
                "left_knee_angle":      left_knee_angle,
                "right_knee_angle":     right_knee_angle,
                "trunk_lean_angle":     trunk_lean_angle,
                "shoulder_height_diff": shoulder_height_diff,
                "hip_height_diff":      hip_height_diff,
                "frame_risk":           frame_risk,
                # 3D metrics (Feature 11)
                "trunk_rotation_3d":    round(trunk_rotation_3d, 3),
                "hip_rotation_3d":      round(hip_rotation_3d, 3),
                "knee_depth_asym_3d":   round(knee_depth_asym_3d, 3),
                # Velocity/acceleration filled in below
                "left_knee_velocity":   0.0,
                "right_knee_velocity":  0.0,
                "trunk_lean_velocity":  0.0,
                "left_knee_acceleration":  0.0,
                "right_knee_acceleration": 0.0,
            })

        n = len(frame_flags)

        # Post-loop: compute joint velocity (Δangle/Δframe) and acceleration (Feature 4)
        for i in range(1, n):
            lv = frame_flags[i]["left_knee_angle"]  - frame_flags[i - 1]["left_knee_angle"]
            rv = frame_flags[i]["right_knee_angle"] - frame_flags[i - 1]["right_knee_angle"]
            tv = frame_flags[i]["trunk_lean_angle"] - frame_flags[i - 1]["trunk_lean_angle"]
            frame_flags[i]["left_knee_velocity"]  = round(lv, 2)
            frame_flags[i]["right_knee_velocity"] = round(rv, 2)
            frame_flags[i]["trunk_lean_velocity"] = round(tv, 2)
            if i >= 2:
                frame_flags[i]["left_knee_acceleration"]  = round(lv - frame_flags[i - 1]["left_knee_velocity"],  2)
                frame_flags[i]["right_knee_acceleration"] = round(rv - frame_flags[i - 1]["right_knee_velocity"], 2)

        avg_left  = round(sum(f["left_knee_angle"]      for f in frame_flags) / n, 2)
        avg_right = round(sum(f["right_knee_angle"]     for f in frame_flags) / n, 2)
        avg_trunk = round(sum(f["trunk_lean_angle"]     for f in frame_flags) / n, 2)
        avg_sh    = round(sum(f["shoulder_height_diff"] for f in frame_flags) / n * 100, 2)

        # 3D averages (Feature 11)
        avg_trunk_rotation_3d = round(sum(f["trunk_rotation_3d"] for f in frame_flags) / n, 3)
        avg_hip_rotation_3d   = round(sum(f["hip_rotation_3d"]   for f in frame_flags) / n, 3)
        avg_knee_depth_asym   = round(sum(f["knee_depth_asym_3d"] for f in frame_flags) / n, 3)

        # Peak velocity (clinically useful — fast deceleration = ACL risk)
        peak_left_vel  = round(max(abs(f["left_knee_velocity"])  for f in frame_flags), 2)
        peak_right_vel = round(max(abs(f["right_knee_velocity"]) for f in frame_flags), 2)

        worst_idx  = max(range(n), key=lambda i: frame_flags[i]["frame_risk"])
        best_idx   = min(range(n), key=lambda i: frame_flags[i]["frame_risk"])
        middle_idx = n // 2

        rep_count     = self._count_reps(frame_flags)
        fatigue_score = self._calculate_fatigue(frame_flags)

        avg_stats = {
            "avg_left_knee_angle":    avg_left,
            "avg_right_knee_angle":   avg_right,
            "avg_trunk_lean_angle":   avg_trunk,
            "avg_shoulder_asymmetry": avg_sh,
            "worst_frame_index":      worst_idx,
            "best_frame_index":       best_idx,
            "middle_frame_index":     middle_idx,
            "rep_count":              rep_count,
            "fatigue_score":          fatigue_score,
            # 3D metrics
            "avg_trunk_rotation_3d":  avg_trunk_rotation_3d,
            "avg_hip_rotation_3d":    avg_hip_rotation_3d,
            "avg_knee_depth_asym_3d": avg_knee_depth_asym,
            # Peak velocity
            "peak_left_knee_velocity":  peak_left_vel,
            "peak_right_knee_velocity": peak_right_vel,
        }

        logger.debug(
            f"Biomechanics: avg L={avg_left}° R={avg_right}° trunk={avg_trunk}° "
            f"worst={worst_idx} reps={rep_count} fatigue={fatigue_score}% "
            f"trunk_rot_3d={avg_trunk_rotation_3d} hip_rot_3d={avg_hip_rotation_3d}"
        )
        return frame_flags, avg_stats

    def _count_reps(self, frame_flags: list[dict]) -> int:
        """Count repetitions by detecting valleys in mean knee angle."""
        if len(frame_flags) < 10:
            return 0

        angles = [(f["left_knee_angle"] + f["right_knee_angle"]) / 2 for f in frame_flags]

        window = max(3, len(angles) // 20)
        smoothed = []
        for i in range(len(angles)):
            s = max(0, i - window // 2)
            e = min(len(angles), i + window // 2 + 1)
            smoothed.append(sum(angles[s:e]) / (e - s))

        min_a = min(smoothed)
        max_a = max(smoothed)
        if (max_a - min_a) < 15:
            return 0

        valley_threshold = min_a + (max_a - min_a) * 0.35
        valleys   = 0
        in_valley = False
        for i in range(1, len(smoothed) - 1):
            if smoothed[i] < valley_threshold:
                if not in_valley:
                    in_valley = True
                    valleys  += 1
            else:
                in_valley = False
        return valleys

    def _calculate_fatigue(self, frame_flags: list[dict]) -> int:
        """Compare form quality first-half vs second-half. Returns 0–100."""
        n = len(frame_flags)
        if n < 20:
            return 0
        mid         = n // 2
        first_risk  = sum(f["frame_risk"] for f in frame_flags[:mid])  / mid
        second_risk = sum(f["frame_risk"] for f in frame_flags[mid:]) / (n - mid)
        if first_risk <= 0:
            return 0
        degradation = (second_risk - first_risk) / max(first_risk, 1) * 100
        return max(0, min(100, int(degradation)))
