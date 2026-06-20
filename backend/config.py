import pathlib
import secrets
import logging
from pydantic_settings import BaseSettings
from pydantic import field_validator

_INSECURE_DEFAULT_KEY = "change-me-in-production-use-a-long-random-string"
_logger = logging.getLogger(__name__)


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

    # ── Database — set DB_TYPE="mongodb" + MONGODB_URL to switch backends ───
    DB_TYPE: str = "sqlite"                          # "sqlite" | "mongodb"
    DATABASE_URL: str = "sqlite:///./injurylens.db"
    MONGODB_URL: str = ""                            # e.g. mongodb://localhost:27017
    MONGODB_DB_NAME: str = "injurylens"

    # ── Auth / JWT ───────────────────────────────────────────────────────────
    SECRET_KEY: str = _INSECURE_DEFAULT_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Email / SMTP (optional — set to enable password-reset emails) ─────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""       # defaults to SMTP_USER when blank
    APP_URL: str = "http://localhost:5173"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v != _INSECURE_DEFAULT_KEY:
            return v
        random_key = secrets.token_hex(32)
        # Persist the generated key to .env so it survives server restarts.
        env_path = pathlib.Path(__file__).parent / ".env"
        try:
            existing = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
            if "SECRET_KEY" not in existing:
                with env_path.open("a", encoding="utf-8") as f:
                    f.write(f"\nSECRET_KEY={random_key}\n")
                _logger.info(
                    "Generated a stable SECRET_KEY and saved it to %s. "
                    "User sessions will now survive server restarts.",
                    env_path,
                )
        except OSError as exc:
            _logger.warning("Could not write SECRET_KEY to .env: %s", exc)
        _logger.warning(
            "SECRET_KEY was not configured — a new key has been generated. "
            "If this is the first run, existing sessions (if any) were just invalidated."
        )
        return random_key

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
