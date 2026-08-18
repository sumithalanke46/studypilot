from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectOut
from app.services.auth_service import get_current_user
from app.services.subject_service import (
    get_user_subjects, get_subject_by_id, create_subject, update_subject, delete_subject
)
from app.algorithms.readiness import calculate_subject_readiness
from app.models.quiz import QuizResult
from app.models.study_plan import StudySession

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectOut])
def list_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all subjects owned by the current user with live readiness percentages."""
    subjects = get_user_subjects(db, current_user.id)
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).all()
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()

    result = []
    for s in subjects:
        r_data = calculate_subject_readiness(
            subject=s,
            topics=s.topics,
            quiz_results=quiz_results,
            completed_sessions=sessions
        )
        s_out = {
            "id": s.id,
            "user_id": s.user_id,
            "name": s.name,
            "description": s.description,
            "difficulty": s.difficulty,
            "proficiency": s.proficiency,
            "color": s.color,
            "created_at": s.created_at,
            "topics": s.topics,
            "topics_count": r_data["topics_count"],
            "completed_topics_count": r_data["completed_topics_count"],
            "readiness_percentage": r_data["readiness_percentage"]
        }
        result.append(s_out)
    return result

@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def add_subject(
    subject_in: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new subject."""
    subject = create_subject(db, subject_in, current_user.id)
    return subject

@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a single subject by ID."""
    subject = get_subject_by_id(db, subject_id, current_user.id)
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).all()
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()
    r_data = calculate_subject_readiness(
        subject=subject,
        topics=subject.topics,
        quiz_results=quiz_results,
        completed_sessions=sessions
    )
    return {
        "id": subject.id,
        "user_id": subject.user_id,
        "name": subject.name,
        "description": subject.description,
        "difficulty": subject.difficulty,
        "proficiency": subject.proficiency,
        "color": subject.color,
        "created_at": subject.created_at,
        "topics": subject.topics,
        "topics_count": r_data["topics_count"],
        "completed_topics_count": r_data["completed_topics_count"],
        "readiness_percentage": r_data["readiness_percentage"]
    }

@router.put("/{subject_id}", response_model=SubjectOut)
def edit_subject(
    subject_id: int,
    subject_in: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an existing subject."""
    return update_subject(db, subject_id, subject_in, current_user.id)

@router.delete("/{subject_id}")
def remove_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a subject."""
    delete_subject(db, subject_id, current_user.id)
    return {"success": True, "message": "Subject deleted successfully."}
