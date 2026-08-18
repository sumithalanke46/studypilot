from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import date
from app.core.database import get_db
from app.models.user import User
from app.models.study_plan import StudyPlan, StudySession
from app.schemas.study_plan import PlanGenerateRequest, PlanRebuildRequest, StudyPlanOut
from app.services.auth_service import get_current_user
from app.services.plan_service import generate_user_study_plan, rebuild_user_schedule, get_user_study_sessions

router = APIRouter(prefix="/study-plan", tags=["Study Plan"])

@router.post("/generate", response_model=StudyPlanOut)
def generate_plan(
    plan_req: PlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a deterministic adaptive study plan based on user's actual database
    records (subjects, topics, urgency, proficiency, past quiz results).
    """
    plan = generate_user_study_plan(db, current_user, plan_req)
    sessions = get_user_study_sessions(db, current_user.id, start_date=plan.plan_start_date, end_date=plan.plan_end_date)
    return {
        "id": plan.id,
        "user_id": plan.user_id,
        "generated_at": plan.generated_at,
        "plan_start_date": plan.plan_start_date,
        "plan_end_date": plan.plan_end_date,
        "status": plan.status,
        "total_sessions": plan.total_sessions,
        "total_hours": plan.total_hours,
        "sessions": sessions
    }

@router.get("/current", response_model=Optional[StudyPlanOut])
def get_current_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves the active study plan and its scheduled sessions."""
    plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id,
        StudyPlan.status == "active"
    ).order_by(StudyPlan.generated_at.desc()).first()

    if not plan:
        return None

    sessions = get_user_study_sessions(db, current_user.id, start_date=plan.plan_start_date, end_date=plan.plan_end_date)
    return {
        "id": plan.id,
        "user_id": plan.user_id,
        "generated_at": plan.generated_at,
        "plan_start_date": plan.plan_start_date,
        "plan_end_date": plan.plan_end_date,
        "status": plan.status,
        "total_sessions": plan.total_sessions,
        "total_hours": plan.total_hours,
        "sessions": sessions
    }

@router.post("/rebuild")
def rebuild_schedule(
    rebuild_req: PlanRebuildRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Recalculates remaining workload and rebuilds schedule after missed study days.
    """
    return rebuild_user_schedule(db, current_user, rebuild_req.missed_days)
