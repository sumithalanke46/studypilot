from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.user import User
from app.schemas.study_plan import StudySessionOut, StudySessionComplete, StudySessionUpdate
from app.services.auth_service import get_current_user
from app.services.plan_service import get_user_study_sessions, complete_session, skip_session

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("", response_model=List[StudySessionOut])
def list_sessions(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists study sessions with optional date and status filters."""
    return get_user_study_sessions(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        status_filter=status
    )

@router.post("/{session_id}/complete")
def mark_session_completed(
    session_id: int,
    complete_in: StudySessionComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logs completion of a study session, updates topic hours & optional proficiency."""
    return complete_session(db, session_id, current_user.id, complete_in)

@router.post("/{session_id}/skip")
def mark_session_skipped(
    session_id: int,
    reason: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a scheduled session as skipped."""
    return skip_session(db, session_id, current_user.id, reason)
