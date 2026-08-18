from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.models.user import User
from app.models.exam import Exam
from app.models.subject import Subject
from app.schemas.exam import ExamCreate, ExamUpdate, ExamOut
from app.services.auth_service import get_current_user
from app.services.subject_service import get_subject_by_id
from app.algorithms.readiness import calculate_subject_readiness, calculate_exam_readiness
from app.models.quiz import QuizResult
from app.models.study_plan import StudySession

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.get("", response_model=List[ExamOut])
def list_exams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all upcoming exams with countdown days and calculated readiness projections."""
    exams = db.query(Exam).filter(Exam.user_id == current_user.id).order_by(Exam.exam_date.asc()).all()
    today = date.today()
    
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).all()
    sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()

    result = []
    for e in exams:
        sub = e.subject
        if not sub:
            continue
        days_left = max(0, (e.exam_date - today).days)
        s_readiness = calculate_subject_readiness(
            subject=sub,
            topics=sub.topics,
            quiz_results=quiz_results,
            completed_sessions=sessions
        )
        exam_metrics = calculate_exam_readiness(
            exam=e,
            subject=sub,
            subject_readiness=s_readiness,
            daily_available_hours=current_user.daily_hours or 3.0,
            reference_date=today
        )
        result.append({
            "id": e.id,
            "user_id": e.user_id,
            "subject_id": e.subject_id,
            "exam_name": e.exam_name,
            "exam_date": e.exam_date,
            "priority": e.priority,
            "target_score": e.target_score,
            "created_at": e.created_at,
            "subject_name": sub.name,
            "subject_color": sub.color,
            "days_remaining": days_left,
            "readiness_percentage": exam_metrics["projected_readiness"]
        })
    return result

@router.post("", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def add_exam(
    exam_in: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a new exam."""
    sub = get_subject_by_id(db, exam_in.subject_id, current_user.id)
    exam = Exam(
        user_id=current_user.id,
        subject_id=exam_in.subject_id,
        exam_name=exam_in.exam_name,
        exam_date=exam_in.exam_date,
        priority=exam_in.priority,
        target_score=exam_in.target_score
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    
    days_left = max(0, (exam.exam_date - date.today()).days)
    return {
        "id": exam.id,
        "user_id": exam.user_id,
        "subject_id": exam.subject_id,
        "exam_name": exam.exam_name,
        "exam_date": exam.exam_date,
        "priority": exam.priority,
        "target_score": exam.target_score,
        "created_at": exam.created_at,
        "subject_name": sub.name,
        "subject_color": sub.color,
        "days_remaining": days_left,
        "readiness_percentage": 0.0
    }

@router.put("/{exam_id}", response_model=ExamOut)
def edit_exam(
    exam_id: int,
    exam_in: ExamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")
    
    if exam_in.subject_id is not None:
        get_subject_by_id(db, exam_in.subject_id, current_user.id)
        exam.subject_id = exam_in.subject_id
    if exam_in.exam_name is not None:
        exam.exam_name = exam_in.exam_name
    if exam_in.exam_date is not None:
        exam.exam_date = exam_in.exam_date
    if exam_in.priority is not None:
        exam.priority = exam_in.priority
    if exam_in.target_score is not None:
        exam.target_score = exam_in.target_score

    db.commit()
    db.refresh(exam)
    days_left = max(0, (exam.exam_date - date.today()).days)
    return {
        "id": exam.id,
        "user_id": exam.user_id,
        "subject_id": exam.subject_id,
        "exam_name": exam.exam_name,
        "exam_date": exam.exam_date,
        "priority": exam.priority,
        "target_score": exam.target_score,
        "created_at": exam.created_at,
        "subject_name": exam.subject.name if exam.subject else "",
        "subject_color": exam.subject.color if exam.subject else "#4F46E5",
        "days_remaining": days_left,
        "readiness_percentage": 0.0
    }

@router.delete("/{exam_id}")
def remove_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")
    db.delete(exam)
    db.commit()
    return {"success": True, "message": "Exam deleted successfully."}
