from datetime import date, timedelta
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.study_plan import StudyPlan, StudySession
from app.algorithms.adaptive_engine import recover_schedule_after_missed_days

def test_recover_missed_days(db_session, test_user):
    today = date.today()
    yesterday = today - timedelta(days=1)

    sub = Subject(user_id=test_user.id, name="Computer Architecture", difficulty=4, proficiency=2)
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)

    top = Topic(subject_id=sub.id, name="Pipelining Hazards", difficulty=4, proficiency=2, estimated_hours=3.0)
    db_session.add(top)
    db_session.commit()
    db_session.refresh(top)

    exam = Exam(user_id=test_user.id, subject_id=sub.id, exam_name="Midterm", exam_date=today + timedelta(days=5), priority="urgent")
    db_session.add(exam)

    # Add a past scheduled session that was missed
    old_session = StudySession(
        user_id=test_user.id,
        subject_id=sub.id,
        topic_id=top.id,
        scheduled_date=yesterday,
        start_time="18:00",
        end_time="18:50",
        duration_minutes=50,
        status="scheduled"
    )
    db_session.add(old_session)
    db_session.commit()

    # Run recovery
    result = recover_schedule_after_missed_days(
        db=db_session,
        user=test_user,
        missed_days_count=1,
        start_from_date=today
    )

    assert result["success"] is True
    assert result["overdue_sessions_marked_missed"] == 1
    assert result["new_sessions_scheduled"] > 0

    # Verify old session was marked as missed
    db_session.refresh(old_session)
    assert old_session.status == "missed"
