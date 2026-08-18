from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Date, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    plan_start_date = Column(Date, nullable=False)
    plan_end_date = Column(Date, nullable=False)
    status = Column(String(30), default="active")  # "active", "completed", "rebuilt", "archived"
    total_sessions = Column(Integer, default=0)
    total_hours = Column(Float, default=0.0)

    # Relationships
    user = relationship("User", back_populates="study_plans")
    sessions = relationship("StudySession", back_populates="plan", cascade="all, delete-orphan")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="SET NULL"), nullable=True, index=True)
    
    scheduled_date = Column(Date, nullable=False, index=True)
    start_time = Column(String(10), nullable=False)  # "18:00"
    end_time = Column(String(10), nullable=False)    # "18:50"
    duration_minutes = Column(Integer, default=50)
    actual_duration_minutes = Column(Integer, default=0)
    
    status = Column(String(30), default="scheduled", index=True)  # "scheduled", "in_progress", "completed", "skipped", "missed"
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="study_sessions")
    subject = relationship("Subject", back_populates="study_sessions")
    topic = relationship("Topic", back_populates="study_sessions")
    plan = relationship("StudyPlan", back_populates="sessions")
