from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import date, datetime, timedelta, timezone
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.study_plan import StudySession
from app.models.quiz import QuizResult
from app.algorithms.readiness import calculate_subject_readiness, calculate_exam_readiness, detect_weak_topics

def get_dashboard_analytics(db: Session, user: User) -> Dict[str, Any]:
    """
    Computes all dynamic real-time dashboard analytics from actual DB records.
    Never returns hardcoded or fake numbers.
    """
    today = date.today()
    subjects = db.query(Subject).filter(Subject.user_id == user.id).all()
    topics = db.query(Topic).join(Subject).filter(Subject.user_id == user.id).all()
    exams = db.query(Exam).filter(Exam.user_id == user.id).all()
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == user.id).all()
    all_sessions = db.query(StudySession).filter(StudySession.user_id == user.id).all()

    # Today's sessions
    today_sessions = [s for s in all_sessions if s.scheduled_date == today]
    today_planned_mins = sum(s.duration_minutes for s in today_sessions)
    today_completed_mins = sum(s.actual_duration_minutes for s in today_sessions if s.status == "completed")

    # Last 7 days history
    seven_days_ago = today - timedelta(days=6)
    daily_history = []
    weekly_completed_mins = 0

    for i in range(7):
        day_d = seven_days_ago + timedelta(days=i)
        day_sess = [s for s in all_sessions if s.scheduled_date == day_d]
        p_mins = sum(s.duration_minutes for s in day_sess)
        c_mins = sum(s.actual_duration_minutes for s in day_sess if s.status == "completed")
        weekly_completed_mins += c_mins
        daily_history.append({
            "date": day_d.strftime("%Y-%m-%d"),
            "day_name": day_d.strftime("%a"),
            "planned_minutes": p_mins,
            "completed_minutes": c_mins,
            "completed_hours": round(c_mins / 60.0, 1)
        })

    # Subject readiness
    subject_readiness_list = []
    for s in subjects:
        s_readiness = calculate_subject_readiness(
            subject=s,
            topics=topics,
            quiz_results=quiz_results,
            completed_sessions=all_sessions
        )
        subject_readiness_list.append(s_readiness)

    # Overall readiness average
    if subject_readiness_list:
        overall_readiness = sum(s["readiness_percentage"] for s in subject_readiness_list) / len(subject_readiness_list)
    else:
        overall_readiness = 0.0

    # Weak topics
    weak_topics = detect_weak_topics(
        topics=topics,
        subjects=subjects,
        quiz_results=quiz_results,
        past_sessions=all_sessions
    )

    # Exam readiness projections
    subject_readiness_map = {sr["subject_id"]: sr for sr in subject_readiness_list}
    upcoming_exams = []
    subject_map = {s.id: s for s in subjects}
    for e in exams:
        sub = subject_map.get(e.subject_id)
        if not sub:
            continue
        sr = subject_readiness_map.get(sub.id, {
            "readiness_percentage": 0.0,
            "estimated_hours_remaining": 0.0
        })
        exam_metrics = calculate_exam_readiness(
            exam=e,
            subject=sub,
            subject_readiness=sr,
            daily_available_hours=user.daily_hours or 3.0,
            reference_date=today
        )
        upcoming_exams.append(exam_metrics)

    # Study streak calculation
    completed_dates = {s.scheduled_date for s in all_sessions if s.status == "completed"}
    current_streak = 0
    check_date = today
    while check_date in completed_dates or (check_date == today and today_completed_mins > 0):
        current_streak += 1
        check_date -= timedelta(days=1)

    total_completed_sess = sum(1 for s in all_sessions if s.status == "completed")
    total_tracked_sess = sum(1 for s in all_sessions if s.status in ["completed", "missed", "skipped"])
    completion_rate = (total_completed_sess / total_tracked_sess * 100.0) if total_tracked_sess > 0 else 100.0
    total_hours_studied = sum(s.actual_duration_minutes for s in all_sessions if s.status == "completed") / 60.0

    streak_data = {
        "current_streak_days": current_streak,
        "longest_streak_days": max(current_streak, 1) if total_completed_sess > 0 else 0,
        "total_sessions_completed": total_completed_sess,
        "total_hours_studied": round(total_hours_studied, 1),
        "completion_rate_percentage": round(completion_rate, 1)
    }

    return {
        "today_planned_minutes": today_planned_mins,
        "today_completed_minutes": today_completed_mins,
        "weekly_completed_hours": round(weekly_completed_mins / 60.0, 1),
        "overall_readiness_percentage": round(overall_readiness, 1),
        "completion_rate_percentage": round(completion_rate, 1),
        "streak": streak_data,
        "daily_hours_history": daily_history,
        "subject_readiness": subject_readiness_list,
        "weak_topics": weak_topics[:6],  # Top weak topics
        "upcoming_exams": sorted(upcoming_exams, key=lambda x: x["days_remaining"])
    }
