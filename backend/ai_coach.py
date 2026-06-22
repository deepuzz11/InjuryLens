import asyncio
import json
import logging
import re
import traceback

import google.generativeai as genai

from config import settings

logger = logging.getLogger("injurylens.ai_coach")

_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


def _extract_json(raw: str) -> str:
    """Return the JSON string from a response that may be wrapped in a markdown fence."""
    m = _FENCE_RE.search(raw)
    if m:
        return m.group(1).strip()
    return raw.strip()


class AICoach:
    """Generates personalised physiotherapy coaching via Gemini 2.0 Flash."""

    def __init__(self) -> None:
        self.available = bool(settings.GEMINI_API_KEY)
        if self.available:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config=genai.types.GenerationConfig(
                    temperature=0.4,
                    max_output_tokens=3072,
                ),
            )
            logger.info("AICoach: Gemini 2.0 Flash ready")
        else:
            self._model = None
            logger.warning("AICoach: GEMINI_API_KEY not set — fallback coaching active")

    async def generate(
        self,
        scores: dict,
        avg_stats: dict,
        movement_type: str,
        athlete_context: dict,
    ) -> dict:
        if not self.available:
            return self._fallback(scores, movement_type, athlete_context)

        try:
            prompt = self._build_prompt(scores, avg_stats, movement_type, athlete_context)
            response = await asyncio.to_thread(self._model.generate_content, prompt)
            raw      = response.text.strip()
            coaching = json.loads(_extract_json(raw))

            fallback = self._fallback(scores, movement_type, athlete_context)
            required_keys = [
                "overall_risk_level", "overall_summary", "priority_issue",
                "coaching_cues", "exercise_prescription", "warmup_routine",
                "weekly_plan", "positive_observation", "follow_up_timeline",
                "individual_feedback",
            ]
            for key in required_keys:
                if not coaching.get(key):
                    logger.warning(f"Gemini response missing '{key}' — using fallback value")
                    coaching[key] = fallback[key]

            if isinstance(coaching.get("coaching_cues"), list):
                coaching["coaching_cues"] = (coaching["coaching_cues"] + fallback["coaching_cues"])[:5]
            if isinstance(coaching.get("exercise_prescription"), list):
                coaching["exercise_prescription"] = (
                    coaching["exercise_prescription"] + fallback["exercise_prescription"]
                )[:5]
            if isinstance(coaching.get("warmup_routine"), list):
                coaching["warmup_routine"] = (coaching["warmup_routine"] + fallback["warmup_routine"])[:4]
            if isinstance(coaching.get("weekly_plan"), list):
                coaching["weekly_plan"] = (coaching["weekly_plan"] + fallback["weekly_plan"])[:5]

            return coaching

        except Exception:
            logger.error(f"Gemini API error:\n{traceback.format_exc()}")
            return self._fallback(scores, movement_type, athlete_context)

    def _build_prompt(
        self,
        scores: dict,
        avg_stats: dict,
        movement_type: str,
        athlete_context: dict,
    ) -> str:
        fitness_level = athlete_context.get("fitness_level", "Intermediate")
        age_group     = athlete_context.get("age_group", "25–34")
        goal          = athlete_context.get("goal", "Injury Prevention")
        sport         = athlete_context.get("sport", "")

        rep_info     = avg_stats.get("rep_count", 0)
        fatigue      = avg_stats.get("fatigue_score", 0)
        shoulder_sc  = scores.get("shoulder_asymmetry", 0)
        hip_drop_sc  = scores.get("hip_drop", 0)

        sport_line = f"- Sport/Activity Context: {sport}" if sport else ""

        return f"""You are an expert sports physiotherapist with 20 years of clinical experience.

ATHLETE PROFILE:
- Movement analyzed: {movement_type}
- Fitness Level: {fitness_level}
- Age Group: {age_group}
- Primary Goal: {goal}
{sport_line}

BIOMECHANICAL ANALYSIS (scores = % of frames where condition was flagged):
- Left Knee Valgus Risk:        {scores['knee_valgus_left']}%
- Right Knee Valgus Risk:       {scores['knee_valgus_right']}%
- Trunk Forward Lean Risk:      {scores['trunk_lean']}%
- Left-Right Asymmetry Risk:    {scores['asymmetry']}%
- Shoulder Height Asymmetry:    {shoulder_sc}%
- Hip Drop / Lateral Tilt:      {hip_drop_sc}%
- Overall Weighted Risk Score:  {scores['overall']}%

SUPPLEMENTARY DATA:
- Avg Left Knee Angle:  {avg_stats['avg_left_knee_angle']}°
- Avg Right Knee Angle: {avg_stats['avg_right_knee_angle']}°
- Avg Trunk Lean:       {avg_stats['avg_trunk_lean_angle']}°
- Repetitions counted:  {rep_info}
- Fatigue score:        {fatigue}% (form degradation first half vs second half)

Generate a comprehensive physiotherapy coaching report. Return ONLY valid JSON with NO markdown fences.

{{
  "overall_risk_level": "Low" | "Moderate" | "High",
  "overall_summary": "2–3 sentence clinical summary mentioning specific values",
  "priority_issue": "Single most important corrective focus with clinical reasoning and mechanism of injury",
  "coaching_cues": ["cue 1", "cue 2", "cue 3", "cue 4", "cue 5"],
  "exercise_prescription": [
    {{"name": "...", "sets_reps": "3 × 12", "why": "clinical reason"}},
    {{"name": "...", "sets_reps": "...", "why": "..."}},
    {{"name": "...", "sets_reps": "...", "why": "..."}},
    {{"name": "...", "sets_reps": "...", "why": "..."}},
    {{"name": "...", "sets_reps": "...", "why": "..."}}
  ],
  "warmup_routine": [
    {{"name": "Exercise", "duration": "60 seconds", "focus": "area it targets"}},
    {{"name": "Exercise", "duration": "45 seconds", "focus": "..."}},
    {{"name": "Exercise", "duration": "30 seconds", "focus": "..."}},
    {{"name": "Exercise", "duration": "60 seconds", "focus": "..."}}
  ],
  "weekly_plan": [
    {{"day": "Day 1", "focus": "Corrective Strength", "exercises": ["Ex 1 — 3×12", "Ex 2 — 2×15"]}},
    {{"day": "Day 2", "focus": "Mobility & Recovery", "exercises": ["Ex 1 — 5 min", "Ex 2 — 3×10"]}},
    {{"day": "Day 3", "focus": "Movement Practice", "exercises": ["Ex 1 — 3×8", "Ex 2 — 2×12"]}},
    {{"day": "Day 4", "focus": "Active Rest", "exercises": ["Light walk — 20 min", "Foam rolling — 10 min"]}},
    {{"day": "Day 5", "focus": "Progressive Load", "exercises": ["Ex 1 — 4×10", "Ex 2 — 3×8"]}}
  ],
  "positive_observation": "Specific encouragement referencing what is working well",
  "follow_up_timeline": "Concrete re-assessment timeline with expected milestones",
  "sport_specific_note": "Brief sport-specific coaching note if sport context was provided, else empty string",
  "individual_feedback": {{
    "knee_valgus_left":    "clinical feedback for {scores['knee_valgus_left']}% score",
    "knee_valgus_right":   "clinical feedback for {scores['knee_valgus_right']}% score",
    "trunk_lean":          "clinical feedback for {scores['trunk_lean']}% score",
    "asymmetry":           "clinical feedback for {scores['asymmetry']}% score",
    "shoulder_asymmetry":  "clinical feedback for {shoulder_sc}% shoulder asymmetry score",
    "hip_drop":            "clinical feedback for {hip_drop_sc}% hip drop score"
  }}
}}"""

    def _fallback(self, scores: dict, movement_type: str = "movement", athlete_context: dict = None) -> dict:
        """Fully-written adaptive fallback coaching report."""
        if athlete_context is None:
            athlete_context = {}

        overall = scores.get("overall", 0)
        lk      = scores.get("knee_valgus_left", 0)
        rk      = scores.get("knee_valgus_right", 0)
        tl      = scores.get("trunk_lean", 0)
        asym    = scores.get("asymmetry", 0)
        sh_asym = scores.get("shoulder_asymmetry", 0)
        hip_d   = scores.get("hip_drop", 0)

        if overall < 30:
            level   = "Low"
            summary = (
                f"Your {movement_type} demonstrates excellent biomechanical control with an overall risk "
                f"score of {overall}%. All measured parameters are within safe ranges, indicating well-developed "
                "motor control and joint stability. Focus on maintaining this quality as you increase load."
            )
            priority = (
                "Continue reinforcing movement quality through progressive overload. Great patterns can "
                "degrade under fatigue — practice at the end of training sessions to build resilience."
            )
            positive = (
                "Exceptional technique across all biomechanical metrics. Your bilateral symmetry, "
                "knee alignment, and trunk control are within optimal parameters — a result of disciplined training."
            )
            timeline = (
                "Re-assess in 6–8 weeks after increasing training load or complexity. "
                "No corrective intervention required at this time."
            )
        elif overall < 60:
            level   = "Moderate"
            summary = (
                f"Your {movement_type} shows moderate biomechanical risk with an overall score of {overall}%. "
                "Some joint alignment and symmetry patterns require attention. With targeted corrective "
                "exercises, significant improvement is achievable within 3–4 weeks."
            )
            priority = (
                "Address knee alignment as the primary concern — even moderate valgus patterns "
                "significantly increase ACL, MCL, and patellar tendon stress over repeated loading. "
                "Prioritize glute medius activation before progressing volume."
            )
            positive = (
                "Your movement shows good overall rhythm and timing. The corrections needed are "
                "refinements, not fundamentals — a strong foundation to build from."
            )
            timeline = (
                "Re-assess in 3–4 weeks after implementing prescribed exercises. "
                "Most athletes see 15–25% score improvement with 2–3 weeks of consistent corrective work."
            )
        else:
            level   = "High"
            summary = (
                f"Your {movement_type} reveals significant biomechanical risk with an overall score of {overall}%. "
                "Multiple parameters are outside safe thresholds, creating elevated injury risk under load. "
                "Reduce volume and address these patterns before increasing intensity."
            )
            priority = (
                "Immediately reduce load and focus on technique correction. The combination of high risk "
                "scores indicates compensation patterns that substantially increase injury probability — "
                "particularly for the knee, hip, and lumbar spine."
            )
            positive = (
                "Your commitment to self-assessment is a critical first step. Identifying these patterns "
                "now, before injury occurs, gives you the opportunity to correct them proactively."
            )
            timeline = (
                "Begin corrective exercises immediately and re-assess in 2–3 weeks. "
                "Consider a physiotherapy assessment for in-person guidance."
            )

        def _knee_fb(score, side):
            if score < 30:
                return (
                    f"{side} knee alignment is within safe parameters ({score}% of frames). "
                    "Continue reinforcing proper tracking over the second toe."
                )
            if score < 60:
                return (
                    f"Moderate {side.lower()} knee valgus in {score}% of frames increases ACL/MCL stress. "
                    f"Activate the {side.lower()} glute medius and push your knee outward during loading."
                )
            return (
                f"Significant {side.lower()} knee valgus in {score}% of frames — a primary injury risk. "
                "Use a resistance band above knees during practice and reduce load until alignment improves."
            )

        def _trunk_fb(score):
            if score < 30:
                return f"Trunk alignment well-controlled ({score}% of frames). Good thoracic extension and core stability."
            if score < 60:
                return (
                    f"Moderate forward lean in {score}% of frames shifts load onto lumbar spine and anterior knee. "
                    "Strengthen thoracic extensors and practice with arms raised as a proprioceptive drill."
                )
            return (
                f"Significant forward lean in {score}% of frames indicates a mobility or strength deficit. "
                "Prioritize thoracic mobility, ankle flexibility, and core anti-flexion exercises."
            )

        def _asym_fb(score):
            if score < 30:
                return f"Excellent symmetry ({score}% asymmetric frames). Well-developed bilateral neuromuscular control."
            if score < 60:
                return (
                    f"Moderate asymmetry in {score}% of frames — one side compensating for relative weakness. "
                    "Incorporate Bulgarian split squats and single-leg RDLs."
                )
            return (
                f"Marked asymmetry in {score}% of frames — significant dominant-side compensation. "
                "Dedicate 2–3 sessions per week to unilateral work, leading with the weaker side."
            )

        def _shoulder_fb(score):
            if score < 30:
                return f"Shoulder alignment is well-balanced ({score}% of frames). Good upper-body stability."
            if score < 60:
                return (
                    f"Moderate shoulder height asymmetry in {score}% of frames. "
                    "Include face pulls, band pull-aparts, and thoracic rotation exercises."
                )
            return (
                f"Notable shoulder asymmetry in {score}% of frames suggests upper trapezius or "
                "thoracic rotation imbalance. Seek targeted shoulder stability work."
            )

        def _hip_fb(score):
            if score < 30:
                return f"Lateral pelvic stability is good ({score}% flagged frames). Hip abductors are functioning well."
            if score < 60:
                return (
                    f"Moderate hip drop in {score}% of frames indicates glute medius weakness. "
                    "Prioritize side-lying hip abduction and clamshell exercises."
                )
            return (
                f"Significant hip drop in {score}% of frames — common precursor to IT band syndrome and "
                "knee pain. Address glute med strength urgently before returning to high-volume training."
            )

        return {
            "overall_risk_level": level,
            "overall_summary":    summary,
            "priority_issue":     priority,
            "coaching_cues": [
                "Drive your knees outward, tracking over your second and third toes throughout the movement.",
                "Brace your core — fill your belly with air before initiating, maintain tension throughout.",
                "Keep your chest tall and imagine a string pulling the crown of your head toward the ceiling.",
                "Control the eccentric (lowering) phase — aim for a 2–3 second descent.",
                "Keep your weight distributed evenly through your full foot, especially the heel.",
            ],
            "exercise_prescription": [
                {"name": "Banded Squat with Knee Tracking",    "sets_reps": "3 × 15 reps",        "why": "Resistance band proprioceptive feedback trains the nervous system to resist valgus collapse."},
                {"name": "Single-Leg Glute Bridge",            "sets_reps": "3 × 12 each side",    "why": "Isolates glute medius — the primary stabilizer preventing knee valgus under load."},
                {"name": "Tempo Romanian Deadlift",            "sets_reps": "3 × 8 reps (3-1-2)",  "why": "Builds posterior chain strength and reinforces neutral spinal alignment under eccentric load."},
                {"name": "Copenhagen Adductor Plank",          "sets_reps": "3 × 20 s each side",  "why": "Strengthens hip adductors to balance the valgus-reducing glute med work."},
                {"name": "Wall Ankle Dorsiflexion Mobilisation","sets_reps": "2 × 10 each side",   "why": "Improves ankle range of motion — restricted ankle dorsiflexion is a common driver of knee valgus."},
            ],
            "warmup_routine": [
                {"name": "World's Greatest Stretch",       "duration": "60 seconds", "focus": "Hip flexors, thoracic spine, hamstrings"},
                {"name": "Banded Lateral Walk",            "duration": "45 seconds", "focus": "Glute medius activation"},
                {"name": "Deep Squat Hold with Pry",       "duration": "60 seconds", "focus": "Hip and ankle mobility"},
                {"name": "Cat-Cow Thoracic Rotation",      "duration": "30 seconds", "focus": "Thoracic spine mobility"},
            ],
            "weekly_plan": [
                {"day": "Day 1", "focus": "Corrective Strength",   "exercises": ["Banded squat — 3×15", "Single-leg glute bridge — 3×12", "Copenhagen plank — 3×20 s"]},
                {"day": "Day 2", "focus": "Mobility & Recovery",   "exercises": ["Foam rolling — 10 min", "Hip flexor stretch — 2×60 s", "Ankle dorsiflexion — 2×10"]},
                {"day": "Day 3", "focus": "Movement Practice",     "exercises": ["Tempo RDL — 3×8", "Goblet squat (light) — 3×10", "Side-lying hip abduction — 3×15"]},
                {"day": "Day 4", "focus": "Active Rest",           "exercises": ["Light walk — 20 min", "Foam rolling — 10 min"]},
                {"day": "Day 5", "focus": "Progressive Load",      "exercises": ["Primary movement at 70% load — 3×8", "Accessory correctives — 2×12", "Core stability work — 2×30 s"]},
            ],
            "positive_observation":  positive,
            "follow_up_timeline":    timeline,
            "sport_specific_note":   "",
            "individual_feedback": {
                "knee_valgus_left":   _knee_fb(lk, "Left"),
                "knee_valgus_right":  _knee_fb(rk, "Right"),
                "trunk_lean":         _trunk_fb(tl),
                "asymmetry":          _asym_fb(asym),
                "shoulder_asymmetry": _shoulder_fb(sh_asym),
                "hip_drop":           _hip_fb(hip_d),
            },
        }
