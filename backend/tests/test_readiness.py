from datetime import date, timedelta
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.quiz import QuizResult
from app.algorithms.readiness import calculate_subject_readiness, calculate_exam_readiness, detect_weak_topics

def test_subject_readiness_calculation():
    subject = Subject(id=1, user_id=1, name="Operating Systems", color="#4F46E5")
    t1 = Topic(id=1, subject_id=1, name="Processes", proficiency=4, completed=True, estimated_hours=2.0, completed_hours=2.0)
    t2 = Topic(id=2, subject_id=1, name="Deadlocks", proficiency=2, completed=False, estimated_hours=2.0, completed_hours=0.0)

    # 1 of 2 topics completed = 50% completion
    # avg proficiency = (4+2)/2 = 3.0 -> normalized (3-1)/4*100 = 50.0
    # quiz score = 80%
    quiz = QuizResult(id=1, user_id=1, subject_id=1, topic_id=1, score=4, total_questions=5, percentage=80.0)

    metrics = calculate_subject_readiness(
        subject=subject,
        topics=[t1, t2],
        quiz_results=[quiz],
        completed_sessions=[]
    )

    # Expected: (0.40 * 50) + (0.35 * 50) + (0.25 * 80) = 20 + 17.5 + 20 = 57.5%
    assert metrics["readiness_percentage"] == 57.5
    assert metrics["topics_count"] == 2
    assert metrics["completed_topics_count"] == 1
    assert metrics["estimated_hours_remaining"] == 2.0

def test_weak_topic_detection():
    subject = Subject(id=1, user_id=1, name="Networks", color="#EA580C")
    t_hard_weak = Topic(id=1, subject_id=1, name="BGP Routing", difficulty=5, proficiency=1, estimated_hours=3.0, completed=False)
    t_easy_good = Topic(id=2, subject_id=1, name="HTTP Headers", difficulty=2, proficiency=5, estimated_hours=1.0, completed=False)

    quiz_failed = QuizResult(id=1, user_id=1, subject_id=1, topic_id=1, score=1, total_questions=5, percentage=20.0)

    weak_list = detect_weak_topics(
        topics=[t_hard_weak, t_easy_good],
        subjects=[subject],
        quiz_results=[quiz_failed],
        past_sessions=[]
    )

    assert len(weak_list) == 2
    assert weak_list[0]["topic_name"] == "BGP Routing"
    assert weak_list[0]["risk_level"] == "HIGH"
    assert weak_list[1]["topic_name"] == "HTTP Headers"
    assert weak_list[1]["risk_level"] in ["LOW", "MEDIUM"]
