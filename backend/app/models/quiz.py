from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)        # List of string options e.g. ["A", "B", "C", "D"]
    correct_option_index = Column(Integer, nullable=False) # 0, 1, 2, 3
    explanation = Column(Text, nullable=True)
    difficulty = Column(Integer, default=3)      # 1 to 5
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    
    score = Column(Integer, nullable=False)               # e.g. 4
    total_questions = Column(Integer, nullable=False)     # e.g. 5
    percentage = Column(Float, nullable=False)            # e.g. 80.0
    answers_breakdown = Column(JSON, nullable=True)       # [{"question_id": 1, "selected": 0, "correct": 0, "is_correct": true}]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="quiz_results")
    subject = relationship("Subject", back_populates="quiz_results")
    topic = relationship("Topic", back_populates="quiz_results")
