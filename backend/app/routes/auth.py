from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, TokenResponse, UserPreferencesUpdate
from app.services.auth_service import register_user, authenticate_user, get_current_user, update_user_preferences

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user and returns JWT credentials."""
    user = register_user(db, user_in)
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user and returns JWT credentials."""
    user = authenticate_user(db, login_in)
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Gets currently authenticated user details."""
    return current_user

@router.put("/preferences", response_model=UserOut)
def update_preferences(
    prefs: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates daily study hours and time availability preferences."""
    updated = update_user_preferences(db, current_user, prefs)
    return updated
