from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.quiz import QuizResult
from app.schemas.ai_tutor import TutorQueryRequest, TutorQueryResponse
from app.services.auth_service import get_current_user
from app.services.ai_service import ask_ai_tutor

router = APIRouter(prefix="/ai-tutor", tags=["AI Tutor"])

@router.post("/chat", response_model=TutorQueryResponse)
def tutor_chat(
    req: TutorQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Asks the AI Tutor a question with student's current proficiency and weakness context.
    Gracefully degrades to structured offline explanations if no LLM API key is present.
    """
    subject_name = None
    topic_name = None
    proficiency = 3
    weak_areas = []

    if req.subject_id:
        sub = db.query(Subject).filter(Subject.id == req.subject_id, Subject.user_id == current_user.id).first()
        if sub:
            subject_name = sub.name

    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()
        if topic:
            topic_name = topic.name
            proficiency = topic.proficiency
            if topic.proficiency <= 2:
                weak_areas.append(f"Self-rated beginner ({topic.name})")

            # Check recent quiz performance
            recent_quiz = db.query(QuizResult).filter(
                QuizResult.topic_id == topic.id,
                QuizResult.user_id == current_user.id
            ).order_by(QuizResult.created_at.desc()).first()
            if recent_quiz and recent_quiz.percentage < 60:
                weak_areas.append(f"Scored {round(recent_quiz.percentage)}% on recent quiz")

    response_data = ask_ai_tutor(
        query=req.query,
        subject_name=subject_name,
        topic_name=topic_name,
        proficiency=proficiency,
        weak_areas=weak_areas,
        action_type=req.action_type or "explain"
    )

    return response_data
