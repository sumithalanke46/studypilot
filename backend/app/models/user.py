from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Study preferences & availability settings
    daily_hours = Column(Float, default=3.0)  # e.g. 3 hours/day
    preferred_start_time = Column(String(10), default="18:00")  # "18:00"
    preferred_end_time = Column(String(10), default="22:00")    # "22:00"
    max_session_mins = Column(Integer, default=50)              # 50 mins max focus
    break_duration_mins = Column(Integer, default=10)           # 10 mins break
    available_days = Column(JSON, default=lambda: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"])
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    quiz_results = relationship("QuizResult", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
