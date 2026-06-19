from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, computed_field


class AnalysisRequest(BaseModel):
    movement_type: str = "Squat"
    fitness_level: str = "Intermediate"
    age_group: str = "25–34"
    goal: str = "Injury Prevention"
    sport: str = ""

    @field_validator("movement_type", "fitness_level", "age_group", "goal")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("field cannot be empty")
        return v.strip()


class RiskScores(BaseModel):
    knee_valgus_left: int = Field(ge=0, le=100)
    knee_valgus_right: int = Field(ge=0, le=100)
    trunk_lean: int = Field(ge=0, le=100)
    asymmetry: int = Field(ge=0, le=100)
    shoulder_asymmetry: int = Field(ge=0, le=100, default=0)
    hip_drop: int = Field(ge=0, le=100, default=0)
    overall: int = Field(ge=0, le=100)

    @computed_field
    @property
    def overall_risk_level(self) -> str:
        if self.overall < 30:
            return "Low"
        if self.overall < 60:
            return "Moderate"
        return "High"


class SupplementaryStats(BaseModel):
    avg_left_knee_angle: float
    avg_right_knee_angle: float
    avg_trunk_lean_angle: float
    avg_shoulder_asymmetry: float = 0.0
    total_frames_analyzed: int = Field(ge=0)
    worst_frame_index: int = Field(ge=0)
    rep_count: int = 0
    fatigue_score: int = Field(ge=0, le=100, default=0)
    video_duration_seconds: float = 0.0
    fps: float = 0.0
    # Feature 11: 3D depth-aware metrics
    avg_trunk_rotation_3d: float = 0.0
    avg_hip_rotation_3d: float = 0.0
    avg_knee_depth_asym_3d: float = 0.0
    # Feature 4: peak velocities
    peak_left_knee_velocity: float = 0.0
    peak_right_knee_velocity: float = 0.0
    # Feature 12: Movement Quality Score
    mqs_score: float = 0.0
    mqs_grade: str = "C"
    mqs_percentile: int = 50
    # Feature 5: Injury probability estimate
    injury_probability_4w: float = 0.0

    @field_validator(
        "avg_left_knee_angle", "avg_right_knee_angle",
        "avg_trunk_lean_angle", "avg_shoulder_asymmetry",
    )
    @classmethod
    def round_to_2dp(cls, v: float) -> float:
        return round(v, 2)


class FrameDataPoint(BaseModel):
    frame_index: int
    left_knee_angle: float
    right_knee_angle: float
    trunk_lean_angle: float
    shoulder_asymmetry: float = 0.0
    risk_score: int
    # Feature 4: velocity and acceleration
    left_knee_velocity: float = 0.0
    right_knee_velocity: float = 0.0
    trunk_lean_velocity: float = 0.0
    left_knee_acceleration: float = 0.0
    right_knee_acceleration: float = 0.0
    # Feature 11: 3D rotation
    trunk_rotation_3d: float = 0.0
    hip_rotation_3d: float = 0.0


class ExerciseItem(BaseModel):
    name: str
    sets_reps: str
    why: str


class WarmupItem(BaseModel):
    name: str
    duration: str
    focus: str


class WeeklyPlanDay(BaseModel):
    day: str
    focus: str
    exercises: List[str]


class IndividualFeedback(BaseModel):
    knee_valgus_left: str
    knee_valgus_right: str
    trunk_lean: str
    asymmetry: str
    shoulder_asymmetry: str = ""
    hip_drop: str = ""


class AICoaching(BaseModel):
    overall_risk_level: str
    overall_summary: str
    priority_issue: str
    coaching_cues: List[str] = Field(min_length=3, max_length=5)
    exercise_prescription: List[ExerciseItem] = Field(min_length=3, max_length=5)
    warmup_routine: List[WarmupItem] = Field(default_factory=list)
    weekly_plan: List[WeeklyPlanDay] = Field(default_factory=list)
    positive_observation: str
    follow_up_timeline: str
    individual_feedback: IndividualFeedback
    sport_specific_note: str = ""


class AnnotatedFrameSet(BaseModel):
    worst: str
    best: str
    middle: str


class AnalysisResponse(BaseModel):
    analysis_id: str = ""
    movement_type: str
    scores: RiskScores
    supplementary: SupplementaryStats
    ai_coaching: AICoaching
    annotated_frame: str
    annotated_frames: Optional[AnnotatedFrameSet] = None
    frame_timeline: List[FrameDataPoint] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    detail: str
    code: str
    suggestion: str


class MovementInfo(BaseModel):
    id: str
    label: str
    category: str
    description: str
    key_metrics: List[str]
    difficulty: str
