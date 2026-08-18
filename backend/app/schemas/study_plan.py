from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime

class PlanGenerateRequest(BaseModel):
    start_date: Optional[date] = None
    days: int = Field(default=7, ge=1, le=60)
    focus_subject_ids: Optional[List[int]] = None
    override_daily_hours: Optional[float] = Field(None, ge=0.5, le=16.0)

class PlanRebuildRequest(BaseModel):
    missed_days: int = Field(default=1, ge=1, le=30)
    reason: Optional[str] = None

class StudySessionUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern=r"^(scheduled|in_progress|completed|skipped|missed)$")
    actual_duration_minutes: Optional[int] = Field(None, ge=0, le=720)
    notes: Optional[str] = None

class StudySessionComplete(BaseModel):
    actual_duration_minutes: int = Field(..., ge=1, le=720)
    notes: Optional[str] = None
    update_topic_proficiency: Optional[int] = Field(None, ge=1, le=5)

class StudySessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject_id: int
    topic_id: int
    plan_id: Optional[int] = None
    scheduled_date: date
    start_time: str
    end_time: str
    duration_minutes: int
    actual_duration_minutes: int
    status: str
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    topic_name: Optional[str] = None
    topic_difficulty: Optional[int] = None
    topic_proficiency: Optional[int] = None

class StudyPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    generated_at: datetime
    plan_start_date: date
    plan_end_date: date
    status: str
    total_sessions: int
    total_hours: float
    sessions: List[StudySessionOut] = []
