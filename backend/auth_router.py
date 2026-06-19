import secrets
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_db
from auth_models import User
from auth_schemas import (
    UserCreate, UserLogin, ForgotPasswordRequest,
    ResetPasswordRequest, TokenResponse, UserOut, MessageResponse,
)
from config import settings

logger   = logging.getLogger(__name__)
router   = APIRouter(prefix="/auth", tags=["auth"])
pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _hash(password: str) -> str:
    return pwd_ctx.hash(password)

def _verify(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def _create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: UserCreate, db: Session = Depends(get_db)):
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
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not _verify(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated.")
    token = _create_token({"sub": user.email, "uid": user.id})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token         = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        # TODO: send actual email in production
        logger.info("Password reset token for %s: %s", user.email, token)
    # Always return success — do not reveal whether email exists
    return MessageResponse(message="If that email is registered, a reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == body.token).first()
    if not user or not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    if datetime.now(timezone.utc) > user.reset_token_expires.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired.")
    user.hashed_password    = _hash(body.new_password)
    user.reset_token         = None
    user.reset_token_expires = None
    db.commit()
    return MessageResponse(message="Password updated successfully.")


@router.get("/me", response_model=UserOut)
def get_me(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email   = payload.get("sub")
        user    = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return UserOut.model_validate(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token.")
