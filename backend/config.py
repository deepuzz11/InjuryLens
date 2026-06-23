import pathlib
import secrets
import logging
from typing import List
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
    MAX_ANALYSIS_FRAMES: int = 300   # cap frames sent to MediaPipe (prevents OOM on long videos)
    MIN_VALID_FRAMES: int = 10
    POSE_DETECTION_CONFIDENCE: float = 0.6
    POSE_TRACKING_CONFIDENCE: float = 0.6
    MIN_LANDMARK_VISIBILITY: float = 0.5

    # CORS — override in production: ALLOWED_ORIGINS='["https://yourapp.com"]'
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Rate limiting ────────────────────────────────────────────────────────
    # Set REDIS_URL to share rate-limit state across multiple workers.
    # Install limits[redis] first: pip install "limits[redis]"
    REDIS_URL: str = ""
    # Comma-separated trusted reverse-proxy IPs/CIDRs (e.g. "10.0.0.1,172.16.0.0/12").
    # Only connections from these addresses may use X-Forwarded-For for rate-limit keying.
    TRUSTED_PROXY_IPS: List[str] = []

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
        import re as _re
        random_key = secrets.token_hex(32)
        env_path = pathlib.Path(__file__).parent / ".env"
        try:
            existing = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
            if "SECRET_KEY" not in existing:
                # Key absent — append the generated value so it survives restarts.
                with env_path.open("a", encoding="utf-8") as f:
                    f.write(f"\nSECRET_KEY={random_key}\n")
                _logger.info(
                    "Generated a stable SECRET_KEY and saved it to %s. "
                    "User sessions will now survive server restarts.",
                    env_path,
                )
            else:
                # Insecure placeholder is present — replace the line in-place so
                # the next restart loads the stable key and sessions stay valid.
                updated = _re.sub(
                    r"(?m)^SECRET_KEY=.*$",
                    f"SECRET_KEY={random_key}",
                    existing,
                )
                env_path.write_text(updated, encoding="utf-8")
                _logger.info(
                    "Replaced insecure SECRET_KEY placeholder in %s — "
                    "sessions will be stable from the next restart.",
                    env_path,
                )
        except OSError as exc:
            _logger.warning("Could not write SECRET_KEY to .env: %s", exc)
        _logger.warning(
            "SECRET_KEY was not configured — a new key has been generated. "
            "If this is the first run, existing sessions (if any) were just invalidated."
        )
        return random_key

    @field_validator("MAX_VIDEO_SIZE_MB", "MIN_VALID_FRAMES", "MAX_ANALYSIS_FRAMES")
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
