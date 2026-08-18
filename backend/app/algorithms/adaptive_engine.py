from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.study_plan import StudyPlan, StudySession
from app.models.quiz import QuizResult
from app.models.notification import Notification
from app.algorithms.study_scheduler import build_adaptive_schedule

def recover_schedule_after_missed_days(
    db: Session,
    user: User,
    missed_days_count: int,
    start_from_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Recalculates and rebuilds the student's study plan after missed study days.
    Instead of naively sliding days forward, it analyzes remaining deadlines,
    marks overdue past sessions as missed, and dynamically generates a new
    optimized plan starting from today.
    """
    today = start_from_date or date.today()

    # 1. Find all scheduled sessions on or before yesterday that were never completed and mark as 'missed'
    overdue_sessions = db.query(StudySession).filter(
        StudySession.user_id == user.id,
        StudySession.scheduled_date < today,
        StudySession.status == "scheduled"
    ).all()

    for s in overdue_sessions:
        s.status = "missed"

    # Also archive or delete future scheduled (uncompleted) sessions to regenerate fresh plan
    future_uncompleted_sessions = db.query(StudySession).filter(
        StudySession.user_id == user.id,
        StudySession.scheduled_date >= today,
        StudySession.status == "scheduled"
    ).all()
    for s in future_uncompleted_sessions:
        db.delete(s)

    db.commit()

    # 2. Fetch fresh user context from DB
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    topics = db.query(Topic).join(Subject).filter(Subject.user_id == user.id).all()
    exams = db.query(Exam).filter(Exam.user_id == user.id).all()
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == user.id).all()
    past_sessions = db.query(StudySession).filter(StudySession.user_id == user.id).all()

    # 3. Calculate remaining work requirements & urgency velocity
    total_est_hours = sum(t.estimated_hours for t in topics if not t.completed)
    total_done_hours = sum(t.completed_hours for t in topics if not t.completed)
    remaining_needed_hours = max(0.0, total_est_hours - total_done_hours)

    # 4. Generate new adaptive schedule starting today for 14 days
    planning_horizon_days = 14
    new_session_dicts = build_adaptive_schedule(
        user=user,
        subjects=subjects,
        topics=topics,
        exams=exams,
        quiz_results=quiz_results,
        past_sessions=past_sessions,
        start_date=today,
        days=planning_horizon_days
    )

    # 5. Create new active StudyPlan
    total_plan_hours = sum(s["duration_minutes"] for s in new_session_dicts) / 60.0
    new_plan = StudyPlan(
        user_id=user.id,
        plan_start_date=today,
        plan_end_date=today + timedelta(days=planning_horizon_days - 1),
        status="active",
        total_sessions=len(new_session_dicts),
        total_hours=round(total_plan_hours, 1)
    )
    db.add(new_plan)
    db.flush()

    # Add study session records
    created_sessions = []
    for s_data in new_session_dicts:
        session_obj = StudySession(
            user_id=user.id,
            subject_id=s_data["subject_id"],
            topic_id=s_data["topic_id"],
            plan_id=new_plan.id,
            scheduled_date=s_data["scheduled_date"],
            start_time=s_data["start_time"],
            end_time=s_data["end_time"],
            duration_minutes=s_data["duration_minutes"],
            actual_duration_minutes=0,
            status="scheduled",
            notes=None
        )
        db.add(session_obj)
        created_sessions.append(session_obj)

    # 6. Create recovery in-app notification
    notification = Notification(
        user_id=user.id,
        title="Schedule Successfully Rebuilt",
        message=f"Your study plan has been recalculated based on {missed_days_count} missed day(s). {len(created_sessions)} optimal sessions scheduled.",
        type="system",
        link="/study-plan"
    )
    db.add(notification)
    db.commit()
    db.refresh(new_plan)

    return {
        "success": True,
        "message": f"Plan successfully recalculated after {missed_days_count} missed day(s).",
        "missed_days": missed_days_count,
        "overdue_sessions_marked_missed": len(overdue_sessions),
        "new_sessions_scheduled": len(created_sessions),
        "plan_id": new_plan.id,
        "remaining_hours_needed": round(remaining_needed_hours, 1),
        "total_planned_hours": new_plan.total_hours
    }
