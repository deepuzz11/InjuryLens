import math
import logging

logger = logging.getLogger("injurylens.scoring")


class RiskScorer:
    """Converts per-frame boolean flags into 0–100 risk scores."""

    def score(self, frame_flags: list[dict], movement_type: str = "Squat") -> dict:
        n = len(frame_flags)
        if n == 0:
            return {
                "knee_valgus_left": 0, "knee_valgus_right": 0,
                "trunk_lean": 0, "asymmetry": 0,
                "shoulder_asymmetry": 0, "hip_drop": 0, "overall": 0,
            }

        def _pct(key: str) -> int:
            return round(sum(1 for f in frame_flags if f.get(key, False)) / n * 100)

        knee_valgus_left   = _pct("knee_valgus_left")
        knee_valgus_right  = _pct("knee_valgus_right")
        trunk_lean         = _pct("trunk_lean")
        asymmetry          = _pct("asymmetry")
        shoulder_asymmetry = _pct("shoulder_asymmetry")
        hip_drop           = _pct("hip_drop")

        overall = round(
            knee_valgus_left   * 0.27
            + knee_valgus_right  * 0.27
            + trunk_lean         * 0.22
            + asymmetry          * 0.12
            + shoulder_asymmetry * 0.07
            + hip_drop           * 0.05
        )

        scores = {
            "knee_valgus_left":   knee_valgus_left,
            "knee_valgus_right":  knee_valgus_right,
            "trunk_lean":         trunk_lean,
            "asymmetry":          asymmetry,
            "shoulder_asymmetry": shoulder_asymmetry,
            "hip_drop":           hip_drop,
            "overall":            overall,
        }

        logger.info(
            f"Risk scores — L-knee: {knee_valgus_left}%, R-knee: {knee_valgus_right}%, "
            f"trunk: {trunk_lean}%, asym: {asymmetry}%, "
            f"shoulder: {shoulder_asymmetry}%, hip: {hip_drop}%, overall: {overall}%"
        )
        return scores

    def calculate_mqs(self, scores: dict) -> dict:
        """
        Movement Quality Score (Feature 12): composite 0–100 quality score,
        letter grade, and population percentile estimate.
        Higher MQS = better movement quality (inverse of risk).
        """
        knee_quality    = 100 - (scores["knee_valgus_left"] + scores["knee_valgus_right"]) / 2
        trunk_quality   = 100 - scores["trunk_lean"]
        sym_quality     = 100 - scores["asymmetry"]
        shoulder_quality = 100 - scores.get("shoulder_asymmetry", 0)
        hip_quality     = 100 - scores.get("hip_drop", 0)

        mqs = round(
            knee_quality     * 0.35
            + trunk_quality  * 0.25
            + sym_quality    * 0.20
            + shoulder_quality * 0.10
            + hip_quality    * 0.10,
            1,
        )
        mqs = max(0.0, min(100.0, mqs))

        if mqs >= 90:
            grade = "A"
        elif mqs >= 80:
            grade = "B"
        elif mqs >= 70:
            grade = "C"
        elif mqs >= 60:
            grade = "D"
        else:
            grade = "F"

        # Logistic percentile model calibrated to population distribution
        # MQS 60 → ~50th percentile, MQS 80 → ~80th percentile
        percentile = int(100 / (1 + math.exp(-(mqs - 62) / 12)))
        percentile = max(1, min(99, percentile))

        logger.info(f"MQS: {mqs} grade={grade} percentile={percentile}")
        return {"mqs_score": mqs, "mqs_grade": grade, "mqs_percentile": percentile}

    def calculate_injury_probability(self, scores: dict, avg_stats: dict) -> float:
        """
        Estimate 4-week injury probability (Feature 5) using a rule-based model
        informed by biomechanical literature thresholds.
        Returns a percentage 0–85.
        """
        overall  = scores["overall"]
        fatigue  = avg_stats.get("fatigue_score", 0)
        knee_max = max(scores["knee_valgus_left"], scores["knee_valgus_right"])
        trunk    = scores["trunk_lean"]

        # Base probability from overall risk score (0–100 → 0–40%)
        base = overall * 0.40

        # Additive knee valgus modifier (major ACL risk factor)
        if knee_max > 70:
            base += 18.0
        elif knee_max > 50:
            base += 9.0
        elif knee_max > 30:
            base += 4.0

        # Trunk lean modifier (lumbar/disc risk)
        if trunk > 70:
            base += 12.0
        elif trunk > 50:
            base += 6.0

        # Fatigue modifier (fatigue dramatically increases injury risk)
        if fatigue > 60:
            base += 12.0
        elif fatigue > 30:
            base += 6.0

        # 3D rotation modifier
        trunk_rot = avg_stats.get("avg_trunk_rotation_3d", 0)
        if trunk_rot > 5.0:
            base += 5.0

        probability = max(2.0, min(85.0, round(base, 1)))
        logger.info(f"Injury probability: {probability}%")
        return probability
