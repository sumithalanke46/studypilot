from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.study_plan import StudyPlan, StudySession
from app.models.quiz import QuizResult

PRIORITY_MULTIPLIERS = {
    "urgent": 1.6,
    "high": 1.3,
    "medium": 1.0,
    "low": 0.7
}

DAY_NAME_MAP = {
    0: "mon",
    1: "tue",
    2: "wed",
    3: "thu",
    4: "fri",
    5: "sat",
    6: "sun"
}

def calculate_topic_priority(
    topic: Topic,
    subject: Subject,
    exams: List[Exam],
    recent_quiz_scores: List[QuizResult],
    missed_sessions_count: int,
    last_studied_date: Optional[date],
    reference_date: date
) -> float:
    """
    Calculates a multi-factor priority score for a topic using deterministic Python scoring.
    Higher score = Higher urgency and priority to schedule.
    """
    score = 0.0

    # 1. Exam Urgency Factor
    # Find nearest upcoming exam for this subject
    subject_exams = [e for e in exams if e.subject_id == subject.id and e.exam_date >= reference_date]
    if subject_exams:
        nearest_exam = min(subject_exams, key=lambda e: e.exam_date)
        days_until_exam = max(0, (nearest_exam.exam_date - reference_date).days)
        mult = PRIORITY_MULTIPLIERS.get(nearest_exam.priority.lower(), 1.0)
        # Urgency decays inversely with days, bounded between 10 and 100 points
        urgency_weight = mult * min(100.0, 150.0 / (days_until_exam + 1))
        score += urgency_weight
    else:
        score += 15.0  # Base urgency for non-exam subjects

    # 2. Topic Proficiency / Weakness Factor (Proficiency 1-5, lower = weaker)
    # Range: (6 - 1) * 12 = 60 points max, (6 - 5) * 12 = 12 points min
    prof_weight = (6 - max(1, min(5, topic.proficiency))) * 12.0
    score += prof_weight

    # 3. Topic Difficulty Factor (Difficulty 1-5, higher = harder)
    # Range: 1 * 8 = 8 to 5 * 8 = 40 points
    diff_weight = max(1, min(5, topic.difficulty)) * 8.0
    score += diff_weight

    # 4. Incomplete Work & Remaining Estimated Hours Factor
    remaining_hours = max(0.25, topic.estimated_hours - topic.completed_hours)
    incomplete_ratio = remaining_hours / max(0.5, topic.estimated_hours)
    # Range: up to 30 points
    work_weight = min(30.0, incomplete_ratio * 20.0 + min(10.0, remaining_hours * 2.0))
    score += work_weight

    # 5. Quiz Performance Factor
    topic_quizzes = [q for q in recent_quiz_scores if q.topic_id == topic.id]
    if topic_quizzes:
        latest_quiz = max(topic_quizzes, key=lambda q: q.created_at)
        quiz_deficit = max(0.0, 100.0 - latest_quiz.percentage)
        # Range: up to 30 points for a 0% score
        quiz_weight = quiz_deficit * 0.30
        score += quiz_weight
    else:
        # Default quiz uncertainty penalty if not tested yet
        score += 12.0

    # 6. Spaced Repetition / Recency Deficit Factor
    if last_studied_date:
        days_since_study = max(0, (reference_date - last_studied_date).days)
        # Add points if not reviewed recently (spaced repetition trigger)
        recency_weight = min(25.0, days_since_study * 2.5)
        score += recency_weight
    else:
        score += 15.0  # Never studied yet

    # 7. Missed Sessions Penalty
    if missed_sessions_count > 0:
        score += min(30.0, missed_sessions_count * 8.0)

    # If topic is already marked completed, heavily de-prioritize (maintenance review only)
    if topic.completed:
        score = score * 0.20

    return round(score, 2)


def generate_time_slots_for_day(
    start_time_str: str,
    end_time_str: str,
    max_session_mins: int,
    break_mins: int,
    daily_hours_limit: float
) -> List[Tuple[str, str, int]]:
    """
    Splits the preferred daily study window into discrete time slot tuples:
    [(start_time, end_time, duration_minutes), ...]
    """
    try:
        sh, sm = map(int, start_time_str.split(":"))
        eh, em = map(int, end_time_str.split(":"))
    except Exception:
        sh, sm = 18, 0
        eh, em = 22, 0

    start_mins = sh * 60 + sm
    end_mins = eh * 60 + em
    if end_mins <= start_mins:
        end_mins = start_mins + int(daily_hours_limit * 60)

    max_allowed_mins = int(daily_hours_limit * 60)
    accumulated_study_mins = 0
    current_mins = start_mins
    slots = []

    while current_mins + max_session_mins <= end_mins and accumulated_study_mins + max_session_mins <= max_allowed_mins:
        slot_start_h = current_mins // 60
        slot_start_m = current_mins % 60
        slot_end_mins = current_mins + max_session_mins
        slot_end_h = slot_end_mins // 60
        slot_end_m = slot_end_mins % 60

        start_str = f"{slot_start_h:02d}:{slot_start_m:02d}"
        end_str = f"{slot_end_h:02d}:{slot_end_m:02d}"
        slots.append((start_str, end_str, max_session_mins))

        accumulated_study_mins += max_session_mins
        current_mins = slot_end_mins + break_mins

    # If no standard slot fit, create at least one slot within the remaining window
    if not slots and end_mins > start_mins:
        duration = min(max_session_mins, end_mins - start_mins, max_allowed_mins)
        if duration >= 15:
            slot_end_mins = start_mins + duration
            start_str = f"{start_mins // 60:02d}:{start_mins % 60:02d}"
            end_str = f"{slot_end_mins // 60:02d}:{slot_end_mins % 60:02d}"
            slots.append((start_str, end_str, duration))

    return slots


def build_adaptive_schedule(
    user: User,
    subjects: List[Subject],
    topics: List[Topic],
    exams: List[Exam],
    quiz_results: List[QuizResult],
    past_sessions: List[StudySession],
    start_date: date,
    days: int = 7,
    focus_subject_ids: Optional[List[int]] = None,
    override_daily_hours: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Main deterministic scheduling engine.
    Allocates high-priority topics into time slots across the requested days
    with cognitive interleaving to prevent subject fatigue.
    """
    if not subjects or not topics:
        return []

    daily_hours = override_daily_hours or user.daily_hours or 3.0
    start_time_str = user.preferred_start_time or "18:00"
    end_time_str = user.preferred_end_time or "22:00"
    max_session_mins = user.max_session_mins or 50
    break_mins = user.break_duration_mins or 10
    available_days = user.available_days or ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    # Filter by focused subjects if provided
    if focus_subject_ids:
        active_subjects = [s for s in subjects if s.id in focus_subject_ids]
        active_topics = [t for t in topics if t.subject_id in focus_subject_ids]
    else:
        active_subjects = subjects
        active_topics = topics

    if not active_topics:
        return []

    # Map missed sessions and last studied date per topic
    missed_counts_by_topic: Dict[int, int] = {}
    last_studied_by_topic: Dict[int, date] = {}

    for sess in past_sessions:
        if sess.status == "missed":
            missed_counts_by_topic[sess.topic_id] = missed_counts_by_topic.get(sess.topic_id, 0) + 1
        elif sess.status == "completed":
            prev_date = last_studied_by_topic.get(sess.topic_id)
            if not prev_date or sess.scheduled_date > prev_date:
                last_studied_by_topic[sess.topic_id] = sess.scheduled_date

    subject_map = {s.id: s for s in active_subjects}

    generated_sessions = []
    last_scheduled_subject_id: Optional[int] = None
    consecutive_subject_count = 0

    for day_idx in range(days):
        current_date = start_date + timedelta(days=day_idx)
        day_name = DAY_NAME_MAP.get(current_date.weekday(), "mon")

        # Check if user studies on this weekday
        if day_name not in available_days:
            continue

        day_slots = generate_time_slots_for_day(
            start_time_str=start_time_str,
            end_time_str=end_time_str,
            max_session_mins=max_session_mins,
            break_mins=break_mins,
            daily_hours_limit=daily_hours
        )

        for slot_start, slot_end, slot_duration in day_slots:
            # Recalculate priority scores dynamically for current day state
            scored_topics: List[Tuple[Topic, float]] = []
            for t in active_topics:
                sub = subject_map.get(t.subject_id)
                if not sub:
                    continue
                p_score = calculate_topic_priority(
                    topic=t,
                    subject=sub,
                    exams=exams,
                    recent_quiz_scores=quiz_results,
                    missed_sessions_count=missed_counts_by_topic.get(t.id, 0),
                    last_studied_date=last_studied_by_topic.get(t.id),
                    reference_date=current_date
                )
                scored_topics.append((t, p_score))

            # Sort descending by priority score
            scored_topics.sort(key=lambda x: x[1], reverse=True)

            # Cognitive interleaving: avoid picking same subject 3 times consecutively
            chosen_topic = None
            for candidate_topic, _ in scored_topics:
                if consecutive_subject_count >= 2 and candidate_topic.subject_id == last_scheduled_subject_id:
                    continue  # Try next subject candidate to interleave
                chosen_topic = candidate_topic
                break

            # Fallback to top candidate if all candidates belong to same subject
            if not chosen_topic and scored_topics:
                chosen_topic = scored_topics[0][0]

            if not chosen_topic:
                continue

            # Update consecutive subject counter
            if chosen_topic.subject_id == last_scheduled_subject_id:
                consecutive_subject_count += 1
            else:
                last_scheduled_subject_id = chosen_topic.subject_id
                consecutive_subject_count = 1

            # Update simulated state for subsequent slots in schedule
            last_studied_by_topic[chosen_topic.id] = current_date
            if chosen_topic.id in missed_counts_by_topic:
                missed_counts_by_topic[chosen_topic.id] = max(0, missed_counts_by_topic[chosen_topic.id] - 1)

            session_record = {
                "user_id": user.id,
                "subject_id": chosen_topic.subject_id,
                "topic_id": chosen_topic.id,
                "scheduled_date": current_date,
                "start_time": slot_start,
                "end_time": slot_end,
                "duration_minutes": slot_duration,
                "actual_duration_minutes": 0,
                "status": "scheduled",
                "notes": None
            }
            generated_sessions.append(session_record)

    return generated_sessions
