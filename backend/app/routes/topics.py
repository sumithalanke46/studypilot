from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.subject import TopicCreate, TopicUpdate, TopicOut
from app.services.auth_service import get_current_user
from app.services.subject_service import (
    get_topic_by_id, create_topic, update_topic, toggle_topic_complete, delete_topic
)

router = APIRouter(prefix="/topics", tags=["Topics"])

@router.post("", response_model=TopicOut, status_code=status.HTTP_201_CREATED)
def add_topic(
    topic_in: TopicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new topic under a subject."""
    return create_topic(db, topic_in, current_user.id)

@router.get("/{topic_id}", response_model=TopicOut)
def get_topic(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a single topic."""
    return get_topic_by_id(db, topic_id, current_user.id)

@router.put("/{topic_id}", response_model=TopicOut)
def edit_topic(
    topic_id: int,
    topic_in: TopicUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates topic parameters (difficulty, proficiency, estimated hours)."""
    return update_topic(db, topic_id, topic_in, current_user.id)

@router.post("/{topic_id}/toggle-complete", response_model=TopicOut)
def toggle_complete(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggles topic completion status."""
    return toggle_topic_complete(db, topic_id, current_user.id)

@router.delete("/{topic_id}")
def remove_topic(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a topic."""
    delete_topic(db, topic_id, current_user.id)
    return {"success": True, "message": "Topic deleted successfully."}
