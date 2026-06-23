import hashlib
import secrets
import smtplib
import logging
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import bcrypt as _bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database import get_db
from auth_models import User
from auth_schemas import (
    UserCreate, UserLogin, ForgotPasswordRequest,
    ResetPasswordRequest, TokenResponse, UserOut, MessageResponse,
)
from config import settings
from limiter import limiter

logger   = logging.getLogger(__name__)
router   = APIRouter(prefix="/auth", tags=["auth"])
_bearer  = HTTPBearer()


def _hash_reset_token(token: str) -> str:
    """One-way hash for storing reset tokens — never store the raw token."""
    return hashlib.sha256(token.encode()).hexdigest()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _send_reset_email(to_email: str, token: str) -> None:
    """Send password-reset email via SMTP if configured; otherwise warn (no token logged)."""
    if not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD):
        logger.warning(
            "SMTP not configured — reset link for %s was NOT sent. "
            "Set SMTP_HOST/SMTP_USER/SMTP_PASSWORD in .env to enable email delivery.",
            to_email,
        )
        return

    # The token is shown as copyable text — NOT embedded in a URL query-string —
    # so it does not appear in server logs, browser history, or proxy caches.
    app_url    = settings.APP_URL
    from_addr  = settings.SMTP_FROM or settings.SMTP_USER
    subject    = f"{settings.APP_NAME} — Password Reset"
    body_text  = (
        f"A password reset was requested for your {settings.APP_NAME} account.\n\n"
        f"Your reset token (expires in 1 hour):\n\n    {token}\n\n"
        f"Open {app_url} and use the 'Forgot password → I have my reset token' "
        "flow to set a new password.\n\n"
        "If you did not request this, you can safely ignore this email."
    )
    body_html  = (
        f"<p>A password reset was requested for your <strong>{settings.APP_NAME}</strong> account.</p>"
        f"<p>Your reset token (expires in 1 hour):</p>"
        f"<pre style='background:#f4f4f4;padding:12px 16px;border-radius:8px;"
        f"font-size:15px;letter-spacing:1px;font-family:monospace'>{token}</pre>"
        f"<p><a href='{app_url}'>Open {settings.APP_NAME}</a> and click "
        f"<em>Forgot password? → I have my reset token</em> to complete the reset.</p>"
        "<p>If you did not request this, you can safely ignore this email.</p>"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = from_addr
    msg["To"]      = to_email
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()  # Re-advertise capabilities after TLS handshake (RFC 3207)
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.sendmail(from_addr, [to_email], msg.as_string())
        logger.info("Password reset email sent to %s", to_email)
    except Exception as exc:
        logger.error("Failed to send reset email to %s: %s", to_email, exc)


def _hash(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

def _verify(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

def _create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, body: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered.")
    user = User(
        name=body.name,
        email=body.email,
        hashed_password=_hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = _create_token({"sub": user.email, "uid": user.id})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
def login(request: Request, body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not _verify(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated.")
    token = _create_token({"sub": user.email, "uid": user.id})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token         = _hash_reset_token(token)  # store hash, not plaintext
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        _send_reset_email(user.email, token)
    # Always return success — do not reveal whether email exists
    return MessageResponse(message="If that email is registered, a reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def reset_password(request: Request, body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == _hash_reset_token(body.token)).first()
    if not user or not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    # Normalise to UTC regardless of whether the DB stored tz-aware or naive datetime
    expires = user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    else:
        expires = expires.astimezone(timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Reset token has expired.")
    user.hashed_password     = _hash(body.new_password)
    user.reset_token         = None
    user.reset_token_expires = None
    db.commit()
    return MessageResponse(message="Password updated successfully.")


@router.get("/me", response_model=UserOut)
def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email   = payload.get("sub")
        user    = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account deactivated.")
        return UserOut.model_validate(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token.")
