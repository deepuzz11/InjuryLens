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
