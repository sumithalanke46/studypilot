from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta, timezone
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.study_plan import StudyPlan, StudySession
from app.models.quiz import QuizResult
from app.schemas.study_plan import PlanGenerateRequest, StudySessionUpdate, StudySessionComplete
from app.algorithms.study_scheduler import build_adaptive_schedule
from app.algorithms.adaptive_engine import recover_schedule_after_missed_days

def generate_user_study_plan(db: Session, user: User, plan_req: PlanGenerateRequest) -> StudyPlan:
    """Generates a personalized adaptive study plan based on user's database records."""
    start_date = plan_req.start_date or date.today()
    days = plan_req.days or 7

    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    if not subjects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please add at least one subject before generating a study plan."
        )

    topics = db.query(Topic).join(Subject).filter(Subject.user_id == user.id).all()
    if not topics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please add topics under your subjects before generating a study plan."
        )

    exams = db.query(Exam).filter(Exam.user_id == user.id).all()
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == user.id).all()
    past_sessions = db.query(StudySession).filter(StudySession.user_id == user.id).all()

    # Clear existing future scheduled sessions
    future_scheduled = db.query(StudySession).filter(
        StudySession.user_id == user.id,
        StudySession.scheduled_date >= start_date,
        StudySession.status == "scheduled"
    ).all()
    for fs in future_scheduled:
        db.delete(fs)

    session_dicts = build_adaptive_schedule(
        user=user,
        subjects=subjects,
        topics=topics,
        exams=exams,
        quiz_results=quiz_results,
        past_sessions=past_sessions,
        start_date=start_date,
        days=days,
        focus_subject_ids=plan_req.focus_subject_ids,
        override_daily_hours=plan_req.override_daily_hours
    )

    if not session_dicts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No study sessions could be generated. Please check your available days and study time settings."
        )

    total_hours = sum(s["duration_minutes"] for s in session_dicts) / 60.0
    end_date = start_date + timedelta(days=days - 1)

    # Deactivate previous active plans
    db.query(StudyPlan).filter(StudyPlan.user_id == user.id, StudyPlan.status == "active").update({"status": "archived"})

    study_plan = StudyPlan(
        user_id=user.id,
        plan_start_date=start_date,
        plan_end_date=end_date,
        status="active",
        total_sessions=len(session_dicts),
        total_hours=round(total_hours, 1)
    )
    db.add(study_plan)
    db.flush()

    for s_data in session_dicts:
        session_obj = StudySession(
            user_id=user.id,
            subject_id=s_data["subject_id"],
            topic_id=s_data["topic_id"],
            plan_id=study_plan.id,
            scheduled_date=s_data["scheduled_date"],
            start_time=s_data["start_time"],
            end_time=s_data["end_time"],
            duration_minutes=s_data["duration_minutes"],
            actual_duration_minutes=0,
            status="scheduled",
            notes=None
        )
        db.add(session_obj)

    db.commit()
    db.refresh(study_plan)
    return study_plan

def get_user_study_sessions(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status_filter: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieves study sessions for the user enriched with subject and topic names."""
    query = db.query(StudySession).filter(StudySession.user_id == user_id)
    if start_date:
        query = query.filter(StudySession.scheduled_date >= start_date)
    if end_date:
        query = query.filter(StudySession.scheduled_date <= end_date)
    if status_filter:
        query = query.filter(StudySession.status == status_filter)

    sessions = query.order_by(StudySession.scheduled_date.asc(), StudySession.start_time.asc()).all()
    
    result = []
    for s in sessions:
        sub = s.subject
        top = s.topic
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "subject_id": s.subject_id,
            "topic_id": s.topic_id,
            "plan_id": s.plan_id,
            "scheduled_date": s.scheduled_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_minutes": s.duration_minutes,
            "actual_duration_minutes": s.actual_duration_minutes,
            "status": s.status,
            "notes": s.notes,
            "completed_at": s.completed_at,
            "created_at": s.created_at,
            "subject_name": sub.name if sub else "Unknown Subject",
            "subject_color": sub.color if sub else "#4F46E5",
            "topic_name": top.name if top else "Unknown Topic",
            "topic_difficulty": top.difficulty if top else 3,
            "topic_proficiency": top.proficiency if top else 3
        })
    return result

def complete_session(db: Session, session_id: int, user_id: int, complete_in: StudySessionComplete) -> Dict[str, Any]:
    """Marks a session as completed, logs actual duration, and updates topic progress."""
    session_obj = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == user_id
    ).first()
    if not session_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    session_obj.status = "completed"
    session_obj.actual_duration_minutes = complete_in.actual_duration_minutes
    session_obj.notes = complete_in.notes
    session_obj.completed_at = datetime.now(timezone.utc)

    # Update completed hours on the topic
    topic = db.query(Topic).filter(Topic.id == session_obj.topic_id).first()
    if topic:
        studied_hours = complete_in.actual_duration_minutes / 60.0
        topic.completed_hours += studied_hours
        if complete_in.update_topic_proficiency:
            topic.proficiency = complete_in.update_topic_proficiency
        if topic.completed_hours >= topic.estimated_hours:
            topic.completed = True
            topic.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session_obj)

    return {
        "success": True,
        "message": "Study session logged successfully!",
        "session_id": session_obj.id,
        "topic_id": topic.id if topic else None,
        "actual_duration_minutes": session_obj.actual_duration_minutes
    }

def skip_session(db: Session, session_id: int, user_id: int, reason: Optional[str] = None) -> Dict[str, Any]:
    """Marks a session as skipped."""
    session_obj = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == user_id
    ).first()
    if not session_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    session_obj.status = "skipped"
    if reason:
        session_obj.notes = f"Skipped: {reason}"
    db.commit()
    return {"success": True, "message": "Session marked as skipped."}

def rebuild_user_schedule(db: Session, user: User, missed_days: int) -> Dict[str, Any]:
    """Triggers the adaptive recovery engine for rebuilding schedule."""
    return recover_schedule_after_missed_days(db=db, user=user, missed_days_count=missed_days)
