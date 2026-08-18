from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date

class DailyStudyHour(BaseModel):
    date: str
    day_name: str
    planned_minutes: int
    completed_minutes: int
    completed_hours: float

class SubjectReadinessOut(BaseModel):
    subject_id: int
    subject_name: str
    color: str
    readiness_percentage: float
    topics_count: int
    completed_topics_count: int
    average_proficiency: float
    average_quiz_score: Optional[float] = None
    estimated_hours_remaining: float

class WeakTopicOut(BaseModel):
    topic_id: int
    topic_name: str
    subject_id: int
    subject_name: str
    subject_color: str
    difficulty: int
    proficiency: int
    risk_level: str  # "HIGH", "MEDIUM", "LOW"
    risk_score: float
    primary_reason: str
    recent_quiz_score: Optional[float] = None
    missed_sessions_count: int = 0

class ExamReadinessOut(BaseModel):
    exam_id: int
    exam_name: str
    subject_name: str
    subject_color: str
    exam_date: date
    days_remaining: int
    priority: str
    target_score: float
    projected_readiness: float
    study_hours_allocated: float
    study_hours_needed: float
    status: str # "ON_TRACK", "AT_RISK", "CRITICAL"

class StudyStreakOut(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    total_sessions_completed: int
    total_hours_studied: float
    completion_rate_percentage: float

class DashboardAnalyticsOut(BaseModel):
    today_planned_minutes: int
    today_completed_minutes: int
    weekly_completed_hours: float
    overall_readiness_percentage: float
    completion_rate_percentage: float
    streak: StudyStreakOut
    daily_hours_history: List[DailyStudyHour]
    subject_readiness: List[SubjectReadinessOut]
    weak_topics: List[WeakTopicOut]
    upcoming_exams: List[ExamReadinessOut]
