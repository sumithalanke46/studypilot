from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import DashboardAnalyticsOut, WeakTopicOut, SubjectReadinessOut
from app.services.auth_service import get_current_user
from app.services.analytics_service import get_dashboard_analytics
from app.algorithms.readiness import detect_weak_topics, calculate_subject_readiness
from app.models.subject import Subject, Topic
from app.models.quiz import QuizResult
from app.models.study_plan import StudySession

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardAnalyticsOut)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all aggregated real-time dashboard stats and charts data."""
    return get_dashboard_analytics(db, current_user)

@router.get("/weak-topics", response_model=List[WeakTopicOut])
def get_weak_topics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all identified weak topics ranked by composite risk score."""
    topics = db.query(Topic).join(Subject).filter(Subject.user_id == current_user.id).all()
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).all()
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()

    return detect_weak_topics(
        topics=topics,
        subjects=subjects,
        quiz_results=quiz_results,
        past_sessions=sessions
    )

@router.get("/readiness", response_model=List[SubjectReadinessOut])
def get_readiness_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves detailed readiness scores across all subjects."""
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    topics = db.query(Topic).join(Subject).filter(Subject.user_id == current_user.id).all()
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).all()
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()

    return [
        calculate_subject_readiness(
            subject=s,
            topics=topics,
            quiz_results=quiz_results,
            completed_sessions=sessions
        )
        for s in subjects
    ]
