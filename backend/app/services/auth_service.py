from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserUpdate, UserPreferencesUpdate

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def register_user(db: Session, user_in: UserRegister) -> User:
    """Registers a new user after validating email uniqueness."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=hashed_pwd
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, login_in: UserLogin) -> User:
    """Authenticates credentials and returns the User object."""
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Validates the JWT bearer token and extracts the current user."""
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload["sub"]
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload."
        )

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
    return user

def update_user_preferences(db: Session, user: User, prefs: UserPreferencesUpdate) -> User:
    """Updates user daily study preferences."""
    if prefs.daily_hours is not None:
        user.daily_hours = prefs.daily_hours
    if prefs.preferred_start_time is not None:
        user.preferred_start_time = prefs.preferred_start_time
    if prefs.preferred_end_time is not None:
        user.preferred_end_time = prefs.preferred_end_time
    if prefs.max_session_mins is not None:
        user.max_session_mins = prefs.max_session_mins
    if prefs.break_duration_mins is not None:
        user.break_duration_mins = prefs.break_duration_mins
    if prefs.available_days is not None:
        user.available_days = prefs.available_days

    db.commit()
    db.refresh(user)
    return user
