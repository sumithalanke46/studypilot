from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.quiz import QuizResult, QuizQuestion
from app.models.subject import Topic
from app.schemas.quiz import QuizQuestionOut, QuizSubmissionRequest, QuizResultOut
from app.services.auth_service import get_current_user
from app.services.quiz_service import get_or_generate_quiz_questions, submit_quiz_answers

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.get("/topic/{topic_id}", response_model=List[QuizQuestionOut])
def get_topic_quiz(
    topic_id: int,
    subject_id: int = Query(...),
    count: int = Query(5, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves or creates 5 interactive multiple choice questions for the topic."""
    questions = get_or_generate_quiz_questions(db, topic_id, subject_id, count)
    return questions

@router.post("/submit", response_model=QuizResultOut)
def submit_quiz(
    sub_req: QuizSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits quiz answers, returns immediate score & feedback, and dynamically
    adapts topic proficiency level in the database.
    """
    result = submit_quiz_answers(db, current_user.id, sub_req)
    topic = db.query(Topic).filter(Topic.id == sub_req.topic_id).first()
    return {
        "id": result["id"],
        "user_id": result["user_id"],
        "subject_id": result["subject_id"],
        "topic_id": result["topic_id"],
        "score": result["score"],
        "total_questions": result["total_questions"],
        "percentage": result["percentage"],
        "answers_breakdown": result["answers_breakdown"],
        "created_at": result["created_at"],
        "subject_name": topic.subject.name if topic and topic.subject else "Subject",
        "topic_name": topic.name if topic else "Topic"
    }

@router.get("/history", response_model=List[QuizResultOut])
def get_quiz_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves student's past quiz results and score percentages."""
    results = db.query(QuizResult).filter(
        QuizResult.user_id == current_user.id
    ).order_by(QuizResult.created_at.desc()).limit(50).all()

    out = []
    for r in results:
        out.append({
            "id": r.id,
            "user_id": r.user_id,
            "subject_id": r.subject_id,
            "topic_id": r.topic_id,
            "score": r.score,
            "total_questions": r.total_questions,
            "percentage": r.percentage,
            "answers_breakdown": r.answers_breakdown,
            "created_at": r.created_at,
            "subject_name": r.subject.name if r.subject else "Subject",
            "topic_name": r.topic.name if r.topic else "Topic"
        })
    return out
