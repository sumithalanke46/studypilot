from datetime import date, timedelta
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.quiz import QuizResult
from app.algorithms.study_scheduler import (
    calculate_topic_priority, generate_time_slots_for_day, build_adaptive_schedule
)

def test_priority_score_calculation():
    today = date.today()
    subject = Subject(id=1, user_id=1, name="Operating Systems", difficulty=4, proficiency=2)
    topic_weak = Topic(id=1, subject_id=1, name="Deadlocks", difficulty=5, proficiency=1, estimated_hours=3.0, completed_hours=0.0, completed=False)
    topic_strong = Topic(id=2, subject_id=1, name="Processes", difficulty=2, proficiency=5, estimated_hours=2.0, completed_hours=2.0, completed=True)

    exam = Exam(id=1, user_id=1, subject_id=1, exam_name="OS Midterm", exam_date=today + timedelta(days=3), priority="urgent")
    quiz = QuizResult(id=1, user_id=1, subject_id=1, topic_id=1, score=1, total_questions=5, percentage=20.0)

    score_weak = calculate_topic_priority(
        topic=topic_weak,
        subject=subject,
        exams=[exam],
        recent_quiz_scores=[quiz],
        missed_sessions_count=2,
        last_studied_date=today - timedelta(days=5),
        reference_date=today
    )

    score_strong = calculate_topic_priority(
        topic=topic_strong,
        subject=subject,
        exams=[exam],
        recent_quiz_scores=[],
        missed_sessions_count=0,
        last_studied_date=today,
        reference_date=today
    )

    # Weak, urgent, failed quiz topic MUST have significantly higher priority than completed mastered topic
    assert score_weak > score_strong
    assert score_weak >= 150.0  # High urgency composite score

def test_time_slot_generation():
    slots = generate_time_slots_for_day(
        start_time_str="18:00",
        end_time_str="21:00",
        max_session_mins=50,
        break_mins=10,
        daily_hours_limit=3.0
    )
    # Window: 18:00 to 21:00 (180 mins total)
    # Slot 1: 18:00 - 18:50 (50 min study, break till 19:00)
    # Slot 2: 19:00 - 19:50 (50 min study, break till 20:00)
    # Slot 3: 20:00 - 20:50 (50 min study)
    assert len(slots) == 3
    assert slots[0] == ("18:00", "18:50", 50)
    assert slots[1] == ("19:00", "19:50", 50)
    assert slots[2] == ("20:00", "20:50", 50)

def test_interleaving_and_schedule_generation():
    today = date.today()
    user = User(
        id=1,
        name="Test",
        email="test@test.com",
        password_hash="x",
        daily_hours=2.0,
        preferred_start_time="18:00",
        preferred_end_time="20:00",
        max_session_mins=50,
        break_duration_mins=10,
        available_days=["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    )

    s1 = Subject(id=1, user_id=1, name="OS", difficulty=4, proficiency=2)
    s2 = Subject(id=2, user_id=1, name="DBMS", difficulty=3, proficiency=3)

    t1 = Topic(id=1, subject_id=1, name="Deadlocks", difficulty=4, proficiency=1, estimated_hours=3.0, completed_hours=0.0)
    t2 = Topic(id=2, subject_id=2, name="Indexing", difficulty=3, proficiency=2, estimated_hours=3.0, completed_hours=0.0)

    e1 = Exam(id=1, user_id=1, subject_id=1, exam_name="OS Exam", exam_date=today + timedelta(days=4), priority="high")

    sessions = build_adaptive_schedule(
        user=user,
        subjects=[s1, s2],
        topics=[t1, t2],
        exams=[e1],
        quiz_results=[],
        past_sessions=[],
        start_date=today,
        days=3
    )

    assert len(sessions) > 0
    # Check that sessions have scheduled_date, start_time, duration_minutes
    for s in sessions:
        assert s["duration_minutes"] == 50
        assert s["status"] == "scheduled"
