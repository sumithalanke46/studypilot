from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime

class ExamBase(BaseModel):
    subject_id: int
    exam_name: str = Field(..., min_length=1, max_length=200)
    exam_date: date
    priority: str = Field(default="high", pattern=r"^(low|medium|high|urgent)$")
    target_score: float = Field(default=90.0, ge=0.0, le=100.0)

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    subject_id: Optional[int] = None
    exam_name: Optional[str] = None
    exam_date: Optional[date] = None
    priority: Optional[str] = Field(None, pattern=r"^(low|medium|high|urgent)$")
    target_score: Optional[float] = Field(None, ge=0.0, le=100.0)

class ExamOut(ExamBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    days_remaining: Optional[int] = 0
    readiness_percentage: Optional[float] = 0.0
