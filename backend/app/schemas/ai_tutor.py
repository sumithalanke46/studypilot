from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TutorQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=2000)
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    action_type: Optional[str] = Field(default="explain", pattern=r"^(explain|example|simplify|quiz_me|custom)$")

class TutorQueryResponse(BaseModel):
    response: str
    action_type: str
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None
    proficiency_context: Optional[str] = None
    is_fallback: bool = False
    source: str = "ai_engine"

class AIQuizItem(BaseModel):
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str

class AIQuizGenerateRequest(BaseModel):
    subject_id: int
    topic_id: int
    topic_name: str
    count: int = Field(default=5, ge=1, le=10)
    difficulty: int = Field(default=3, ge=1, le=5)
