import math
import logging

from biomechanics import _MOVEMENT_PROFILES, _DEFAULT_PROFILE

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

        probability = max(0.0, min(85.0, round(base, 1)))
        logger.info(f"Injury probability: {probability}%")
        return probability

    def calculate_confidence(self, n_frames: int, rep_count: int) -> int:
        """
        Estimate analysis confidence (0–100) based on data volume and signal quality.
        More frames and detected reps → higher confidence.
        """
        confidence = 45
        if n_frames >= 150:
            confidence += 28
        elif n_frames >= 90:
            confidence += 20
        elif n_frames >= 45:
            confidence += 10
        elif n_frames >= 20:
            confidence += 4

        if rep_count >= 4:
            confidence += 15
        elif rep_count >= 2:
            confidence += 8
        elif rep_count >= 1:
            confidence += 3

        # All 6 metrics always computed from our pipeline
        confidence += 12

        return max(30, min(99, confidence))

    def calculate_risk_breakdown(self, frame_flags: list[dict], movement_type: str = "Squat") -> dict:
        """
        Generate per-metric explainability: how many frames exceeded threshold
        and the worst measured deviation from safe range.
        """
        profile = _MOVEMENT_PROFILES.get(movement_type, _DEFAULT_PROFILE)
        n = len(frame_flags)
        if n == 0:
            return {}

        valgus_thresh = profile["valgus"]
        trunk_thresh  = profile["trunk"]
        asym_thresh   = profile["asym"]

        left_angles  = [f["left_knee_angle"]  for f in frame_flags]
        right_angles = [f["right_knee_angle"] for f in frame_flags]
        trunk_angles = [f["trunk_lean_angle"] for f in frame_flags]
        asym_vals    = [abs(f["left_knee_angle"] - f["right_knee_angle"]) for f in frame_flags]

        def _pct_exceeded(values, threshold, above=True):
            if above:
                count = sum(1 for v in values if v > threshold)
            else:
                count = sum(1 for v in values if v < threshold)
            return round(count / n * 100)

        left_exceeded  = _pct_exceeded(left_angles,  valgus_thresh, above=False)
        right_exceeded = _pct_exceeded(right_angles, valgus_thresh, above=False)
        trunk_exceeded = _pct_exceeded(trunk_angles, trunk_thresh,  above=True)
        asym_exceeded  = _pct_exceeded(asym_vals,    asym_thresh,   above=True)

        left_worst  = round(valgus_thresh - min(left_angles),  1) if left_exceeded  else 0.0
        right_worst = round(valgus_thresh - min(right_angles), 1) if right_exceeded else 0.0
        trunk_worst = round(max(trunk_angles) - trunk_thresh,  1) if trunk_exceeded else 0.0
        asym_worst  = round(max(asym_vals)    - asym_thresh,   1) if asym_exceeded  else 0.0

        return {
            "knee_valgus_left":  {"frames_exceeded_pct": left_exceeded,  "worst_deviation_deg": left_worst,  "threshold_deg": valgus_thresh},
            "knee_valgus_right": {"frames_exceeded_pct": right_exceeded, "worst_deviation_deg": right_worst, "threshold_deg": valgus_thresh},
            "trunk_lean":        {"frames_exceeded_pct": trunk_exceeded,  "worst_deviation_deg": trunk_worst,  "threshold_deg": trunk_thresh},
            "asymmetry":         {"frames_exceeded_pct": asym_exceeded,   "worst_deviation_deg": asym_worst,   "threshold_deg": asym_thresh},
        }

    def get_sport_injury_flags(self, scores: dict, sport: str, avg_stats: dict) -> list[dict]:
        """
        Map detected biomechanical risk patterns to named sport-specific injury risks.
        Returns a list of flags only for patterns with a score ≥ 15.
        """
        _MAP: dict[str, list[dict]] = {
            "Basketball": [
                {"metric": "knee_valgus", "injury": "ACL Tear Risk",           "description": "Valgus collapse on landing and cutting movements elevates anterior cruciate ligament stress."},
                {"metric": "asymmetry",   "injury": "Ankle Sprain Risk",        "description": "Bilateral asymmetry increases single-leg landing instability during drives and pivots."},
                {"metric": "hip_drop",    "injury": "IT Band Syndrome",          "description": "Lateral pelvic tilt alters knee tracking during sprints and directional changes."},
            ],
            "Running": [
                {"metric": "trunk_lean",  "injury": "IT Band Syndrome",          "description": "Excessive forward lean increases tibial stress and iliotibial band tension at heel strike."},
                {"metric": "hip_drop",    "injury": "Patellofemoral Stress",     "description": "Hip drop elevates Q-angle, disrupting patellar tracking across the femoral groove."},
                {"metric": "knee_valgus", "injury": "Runner's Knee (PFPS)",      "description": "Valgus loading pattern during heel strike elevates medial knee compartment stress."},
            ],
            "Football": [
                {"metric": "knee_valgus", "injury": "ACL / MCL Injury Risk",    "description": "Valgus loading during tackle landings is a primary ACL rupture mechanism in contact sport."},
                {"metric": "asymmetry",   "injury": "Dynamic Knee Instability", "description": "Bilateral asymmetry signals neuromuscular imbalance that worsens under match fatigue."},
                {"metric": "trunk_lean",  "injury": "Lower Back Strain",         "description": "Forward trunk lean under load amplifies lumbar disc compressive forces."},
            ],
            "Tennis": [
                {"metric": "shoulder_asymmetry", "injury": "Rotator Cuff Overload", "description": "Shoulder height asymmetry indicates dominant-side muscular imbalance from repetitive serving."},
                {"metric": "trunk_lean",         "injury": "Oblique / Core Strain", "description": "Lateral trunk lean during groundstrokes and serve motion strains the oblique chain."},
                {"metric": "asymmetry",          "injury": "Hip Flexor Imbalance",  "description": "Bilateral lower-limb asymmetry elevates hip flexor stress on the dominant side."},
            ],
            "Cricket": [
                {"metric": "trunk_lean",         "injury": "Lumbar Stress Fracture Risk", "description": "Excessive trunk lean during delivery stride is a documented lower back stress mechanism."},
                {"metric": "knee_valgus",         "injury": "Medial Knee Overload",        "description": "Valgus at front-foot landing increases medial compartment stress in pace bowling."},
                {"metric": "shoulder_asymmetry", "injury": "Shoulder Asymmetry",           "description": "Height imbalance between shoulders affects bowling release mechanics and loads the rotator cuff."},
            ],
            "Weightlifting": [
                {"metric": "knee_valgus", "injury": "Knee Joint Overload",        "description": "Valgus collapse under barbell load is the primary knee injury mechanism in strength sport."},
                {"metric": "trunk_lean",  "injury": "Lumbar Disc Stress",         "description": "Forward lean under load amplifies compressive forces across lumbar intervertebral discs."},
                {"metric": "asymmetry",   "injury": "Unilateral Overcompensation","description": "Asymmetric loading shifts force to one side, increasing unilateral injury probability."},
            ],
            "CrossFit": [
                {"metric": "knee_valgus", "injury": "Fatigue-Driven Valgus",      "description": "Knee collapse under high-rep conditioning amplifies ACL and patellar tendon stress."},
                {"metric": "asymmetry",   "injury": "Unilateral Compensation",     "description": "Bilateral asymmetry under fatigue creates single-limb overload in metcon workouts."},
                {"metric": "trunk_lean",  "injury": "Spinal Fatigue Pattern",      "description": "Trunk control breakdown in the second half of a session signals load should be reduced."},
            ],
            "Martial Arts": [
                {"metric": "knee_valgus", "injury": "Knee Stability Risk",         "description": "Valgus pattern during kicking and pivoting movements stresses the medial knee structures."},
                {"metric": "asymmetry",   "injury": "Stance Imbalance",             "description": "Asymmetric loading between dominant and non-dominant side creates injury compensation patterns."},
                {"metric": "hip_drop",    "injury": "Hip Joint Overload",           "description": "Lateral pelvic tilt during stances and throws increases hip joint stress."},
            ],
            "Swimming": [
                {"metric": "shoulder_asymmetry", "injury": "Swimmer's Shoulder",   "description": "Shoulder height asymmetry in dry-land training indicates rotator cuff imbalance risk."},
                {"metric": "trunk_lean",         "injury": "Core Fatigue Pattern",  "description": "Trunk control weakness on land typically transfers to stroke mechanics in water."},
            ],
            "Cycling": [
                {"metric": "knee_valgus", "injury": "Patellofemoral Syndrome",     "description": "Valgus tracking during pedal stroke creates lateral patellar pressure and IT band tension."},
                {"metric": "asymmetry",   "injury": "Leg Length Discrepancy Risk",  "description": "Bilateral asymmetry may indicate saddle height imbalance or true leg-length difference."},
            ],
        }

        sport_items = _MAP.get(sport, [
            {"metric": "knee_valgus", "injury": "Knee Valgus Pattern",  "description": "Inward knee collapse is a primary injury risk factor across all sports and activities."},
            {"metric": "trunk_lean",  "injury": "Trunk Control Risk",   "description": "Excessive forward lean increases spinal and lower-limb loading during dynamic movements."},
        ])

        knee_avg = (scores.get("knee_valgus_left", 0) + scores.get("knee_valgus_right", 0)) / 2
        metric_scores = {
            "knee_valgus":        knee_avg,
            "trunk_lean":         scores.get("trunk_lean", 0),
            "asymmetry":          scores.get("asymmetry", 0),
            "hip_drop":           scores.get("hip_drop", 0),
            "shoulder_asymmetry": scores.get("shoulder_asymmetry", 0),
        }

        flags = []
        for item in sport_items:
            s = metric_scores.get(item["metric"], 0)
            if s < 15:
                continue
            level = "elevated" if s >= 50 else "moderate" if s >= 25 else "watch"
            flags.append({
                "injury_name":     item["injury"],
                "risk_level":      level,
                "affected_metric": item["metric"].replace("_", " ").title(),
                "description":     item["description"],
                "score":           round(s),
            })

        logger.info(f"Sport injury flags for '{sport}': {len(flags)} raised")
        return flags
