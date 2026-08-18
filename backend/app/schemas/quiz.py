from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class QuizQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    topic_id: int
    question_text: str
    options: List[str]
    difficulty: int

class QuizQuestionAdminOut(QuizQuestionOut):
    correct_option_index: int
    explanation: Optional[str] = None

class SingleAnswerSubmission(BaseModel):
    question_id: int
    selected_option_index: int = Field(..., ge=0, le=3)

class QuizSubmissionRequest(BaseModel):
    subject_id: int
    topic_id: int
    answers: List[SingleAnswerSubmission]

class AnswerFeedback(BaseModel):
    question_id: int
    question_text: str
    options: List[str]
    selected_option_index: int
    correct_option_index: int
    is_correct: bool
    explanation: Optional[str] = None

class QuizResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject_id: int
    topic_id: int
    score: int
    total_questions: int
    percentage: float
    answers_breakdown: Optional[List[AnswerFeedback]] = None
    created_at: datetime
    
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    subject_id: int
    topic_id: int
    count: int = Field(default=5, ge=1, le=10)
    difficulty: Optional[int] = Field(default=3, ge=1, le=5)
