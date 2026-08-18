from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPreferencesUpdate(BaseModel):
    daily_hours: Optional[float] = Field(None, ge=0.5, le=16.0)
    preferred_start_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    preferred_end_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    max_session_mins: Optional[int] = Field(None, ge=15, le=180)
    break_duration_mins: Optional[int] = Field(None, ge=0, le=60)
    available_days: Optional[List[str]] = None

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    preferences: Optional[UserPreferencesUpdate] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    daily_hours: float
    preferred_start_time: str
    preferred_end_time: str
    max_session_mins: int
    break_duration_mins: int
    available_days: List[str]
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
