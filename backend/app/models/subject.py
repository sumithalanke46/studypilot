from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(Integer, default=3)      # 1 (Easy) to 5 (Hard)
    proficiency = Column(Integer, default=3)     # 1 (Novice) to 5 (Mastered)
    color = Column(String(20), default="#4F46E5") # Tailwind hex color
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="subject", cascade="all, delete-orphan")
    quiz_results = relationship("QuizResult", back_populates="subject", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(Integer, default=3)          # 1 to 5
    proficiency = Column(Integer, default=2)         # 1 to 5
    estimated_hours = Column(Float, default=2.0)     # Total estimated hours required
    completed_hours = Column(Float, default=0.0)     # Total tracked hours
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    subject = relationship("Subject", back_populates="topics")
    study_sessions = relationship("StudySession", back_populates="topic", cascade="all, delete-orphan")
    quiz_results = relationship("QuizResult", back_populates="topic", cascade="all, delete-orphan")
