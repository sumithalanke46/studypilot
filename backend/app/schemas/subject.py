from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class TopicBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    difficulty: int = Field(default=3, ge=1, le=5)
    proficiency: int = Field(default=2, ge=1, le=5)
    estimated_hours: float = Field(default=2.0, ge=0.25, le=100.0)

class TopicCreate(TopicBase):
    subject_id: int

class TopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    proficiency: Optional[int] = Field(None, ge=1, le=5)
    estimated_hours: Optional[float] = Field(None, ge=0.25, le=100.0)
    completed: Optional[bool] = None

class TopicOut(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    completed_hours: float
    completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    difficulty: int = Field(default=3, ge=1, le=5)
    proficiency: int = Field(default=3, ge=1, le=5)
    color: str = Field(default="#4F46E5")

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    proficiency: Optional[int] = Field(None, ge=1, le=5)
    color: Optional[str] = None

class SubjectOut(SubjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    topics: List[TopicOut] = []
    topics_count: Optional[int] = 0
    completed_topics_count: Optional[int] = 0
    readiness_percentage: Optional[float] = 0.0
