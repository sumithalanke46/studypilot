from datetime import date
from typing import List, Dict, Any, Optional
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.quiz import QuizResult
from app.models.study_plan import StudySession

def calculate_subject_readiness(
    subject: Subject,
    topics: List[Topic],
    quiz_results: List[QuizResult],
    completed_sessions: List[StudySession]
) -> Dict[str, Any]:
    """
    Calculates quantitative readiness metrics for a subject.
    
    Formula:
    Readiness = (0.40 * CompletionRate) + (0.35 * NormalizedProficiency) + (0.25 * AvgQuizScore)
    """
    subject_topics = [t for t in topics if t.subject_id == subject.id]
    if not subject_topics:
        return {
            "subject_id": subject.id,
            "subject_name": subject.name,
            "color": subject.color,
            "readiness_percentage": 0.0,
            "topics_count": 0,
            "completed_topics_count": 0,
            "average_proficiency": 0.0,
            "average_quiz_score": None,
            "estimated_hours_remaining": 0.0
        }

    total_topics = len(subject_topics)
    completed_topics = sum(1 for t in subject_topics if t.completed)
    completion_rate = (completed_topics / total_topics) * 100.0

    # Normalized proficiency (1-5 scale -> 0-100 scale)
    avg_proficiency = sum(t.proficiency for t in subject_topics) / total_topics
    proficiency_score = ((avg_proficiency - 1.0) / 4.0) * 100.0 if avg_proficiency >= 1 else 0.0

    # Quiz performance
    subject_quizzes = [q for q in quiz_results if q.subject_id == subject.id]
    if subject_quizzes:
        avg_quiz_score = sum(q.percentage for q in subject_quizzes) / len(subject_quizzes)
        quiz_weight = avg_quiz_score
    else:
        avg_quiz_score = None
        # If no quiz yet, use proficiency as proxy for the quiz component
        quiz_weight = proficiency_score

    # Weighted calculation
    readiness = (0.40 * completion_rate) + (0.35 * proficiency_score) + (0.25 * quiz_weight)
    readiness = max(0.0, min(100.0, round(readiness, 1)))

    total_est_hours = sum(t.estimated_hours for t in subject_topics)
    total_done_hours = sum(t.completed_hours for t in subject_topics)
    rem_hours = max(0.0, round(total_est_hours - total_done_hours, 1))

    return {
        "subject_id": subject.id,
        "subject_name": subject.name,
        "color": subject.color,
        "readiness_percentage": readiness,
        "topics_count": total_topics,
        "completed_topics_count": completed_topics,
        "average_proficiency": round(avg_proficiency, 1),
        "average_quiz_score": round(avg_quiz_score, 1) if avg_quiz_score is not None else None,
        "estimated_hours_remaining": rem_hours
    }


def calculate_exam_readiness(
    exam: Exam,
    subject: Subject,
    subject_readiness: Dict[str, Any],
    daily_available_hours: float,
    reference_date: date
) -> Dict[str, Any]:
    """
    Projects overall exam readiness based on subject readiness,
    remaining hours required, and study time remaining until exam date.
    """
    days_left = max(0, (exam.exam_date - reference_date).days)
    hours_needed = subject_readiness["estimated_hours_remaining"]
    total_available_hours_left = days_left * daily_available_hours

    # Capacity coverage ratio
    if hours_needed <= 0:
        capacity_ratio = 1.0
    else:
        capacity_ratio = min(1.0, total_available_hours_left / max(1.0, hours_needed))

    projected_readiness = subject_readiness["readiness_percentage"] * (0.6 + 0.4 * capacity_ratio)
    projected_readiness = max(0.0, min(100.0, round(projected_readiness, 1)))

    if days_left <= 3 and projected_readiness < 60:
        status = "CRITICAL"
    elif projected_readiness < 70 or capacity_ratio < 0.7:
        status = "AT_RISK"
    else:
        status = "ON_TRACK"

    return {
        "exam_id": exam.id,
        "exam_name": exam.exam_name,
        "subject_name": subject.name,
        "subject_color": subject.color,
        "exam_date": exam.exam_date,
        "days_remaining": days_left,
        "priority": exam.priority,
        "target_score": exam.target_score,
        "projected_readiness": projected_readiness,
        "study_hours_allocated": round(total_available_hours_left, 1),
        "study_hours_needed": round(hours_needed, 1),
        "status": status
    }


def detect_weak_topics(
    topics: List[Topic],
    subjects: List[Subject],
    quiz_results: List[QuizResult],
    past_sessions: List[StudySession]
) -> List[Dict[str, Any]]:
    """
    Evaluates every topic and identifies risk levels: HIGH, MEDIUM, LOW.
    """
    subject_map = {s.id: s for s in subjects}
    weak_topics_list = []

    missed_count_by_topic: Dict[int, int] = {}
    total_sessions_by_topic: Dict[int, int] = {}
    for sess in past_sessions:
        total_sessions_by_topic[sess.topic_id] = total_sessions_by_topic.get(sess.topic_id, 0) + 1
        if sess.status == "missed":
            missed_count_by_topic[sess.topic_id] = missed_count_by_topic.get(sess.topic_id, 0) + 1

    for topic in topics:
        if topic.completed:
            continue

        sub = subject_map.get(topic.subject_id)
        if not sub:
            continue

        # 1. Proficiency Deficit (1-5 scale -> 0 to 100)
        prof_deficit = (5 - topic.proficiency) * 25.0

        # 2. Quiz Deficit
        topic_quizzes = [q for q in quiz_results if q.topic_id == topic.id]
        if topic_quizzes:
            recent_quiz = max(topic_quizzes, key=lambda q: q.created_at)
            quiz_score = recent_quiz.percentage
            quiz_deficit = max(0.0, 100.0 - quiz_score)
        else:
            quiz_score = None
            quiz_deficit = prof_deficit  # Fallback if no quiz taken

        # 3. Missed Sessions Ratio
        total_sess = total_sessions_by_topic.get(topic.id, 0)
        missed_sess = missed_count_by_topic.get(topic.id, 0)
        missed_ratio = (missed_sess / total_sess) if total_sess > 0 else 0.0

        # 4. Difficulty Factor
        difficulty_factor = (topic.difficulty / 5.0) * 100.0

        # Composite Risk Calculation (0 to 100)
        risk_score = (0.35 * prof_deficit) + (0.35 * quiz_deficit) + (0.20 * missed_ratio * 100.0) + (0.10 * difficulty_factor)
        risk_score = max(0.0, min(100.0, round(risk_score, 1)))

        # Determine Primary Reason
        reasons = []
        if quiz_score is not None and quiz_score < 60:
            reasons.append(f"Low quiz performance ({round(quiz_score)}%)")
        if topic.proficiency <= 2:
            reasons.append("Low self-rated proficiency")
        if missed_sess >= 2:
            reasons.append(f"{missed_sess} missed study sessions")
        if topic.difficulty >= 4:
            reasons.append("High conceptual difficulty")

        primary_reason = ", ".join(reasons) if reasons else "Incomplete study requirement"

        # Classification
        if risk_score >= 60:
            risk_level = "HIGH"
        elif risk_score >= 35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        weak_topics_list.append({
            "topic_id": topic.id,
            "topic_name": topic.name,
            "subject_id": sub.id,
            "subject_name": sub.name,
            "subject_color": sub.color,
            "difficulty": topic.difficulty,
            "proficiency": topic.proficiency,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "primary_reason": primary_reason,
            "recent_quiz_score": round(quiz_score, 1) if quiz_score is not None else None,
            "missed_sessions_count": missed_sess
        })

    # Sort descending by risk score
    weak_topics_list.sort(key=lambda x: x["risk_score"], reverse=True)
    return weak_topics_list
