from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Date, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_name = Column(String(200), nullable=False)
    exam_date = Column(Date, nullable=False, index=True)
    priority = Column(String(20), default="high")  # "low", "medium", "high", "urgent"
    target_score = Column(Float, default=90.0)      # Target percentage
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")
