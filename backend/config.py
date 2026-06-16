from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}

    GEMINI_API_KEY: str = ""
    APP_NAME: str = "InjuryLens"
    VERSION: str = "1.0.0"
    MAX_VIDEO_SIZE_MB: int = 100
    MIN_VALID_FRAMES: int = 10
    POSE_DETECTION_CONFIDENCE: float = 0.6
    POSE_TRACKING_CONFIDENCE: float = 0.6
    MIN_LANDMARK_VISIBILITY: float = 0.5

    @field_validator("MAX_VIDEO_SIZE_MB", "MIN_VALID_FRAMES")
    @classmethod
    def must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("must be a positive integer")
        return v

    @field_validator(
        "POSE_DETECTION_CONFIDENCE",
        "POSE_TRACKING_CONFIDENCE",
        "MIN_LANDMARK_VISIBILITY",
    )
    @classmethod
    def must_be_probability(cls, v: float) -> float:
        if not 0.0 < v <= 1.0:
            raise ValueError("must be in range (0, 1]")
        return v


settings = Settings()
