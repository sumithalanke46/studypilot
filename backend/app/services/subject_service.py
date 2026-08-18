from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from app.models.subject import Subject, Topic
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectUpdate, TopicCreate, TopicUpdate
from app.algorithms.readiness import calculate_subject_readiness

def get_user_subjects(db: Session, user_id: int) -> List[Subject]:
    """Retrieves all subjects owned by the user with their topics."""
    return db.query(Subject).filter(Subject.user_id == user_id).order_by(Subject.created_at.desc()).all()

def get_subject_by_id(db: Session, subject_id: int, user_id: int) -> Subject:
    """Retrieves a single subject ensuring user ownership."""
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or you do not have permission to access it."
        )
    return subject

def create_subject(db: Session, subject_in: SubjectCreate, user_id: int) -> Subject:
    """Creates a new subject."""
    subject = Subject(
        user_id=user_id,
        name=subject_in.name,
        description=subject_in.description,
        difficulty=subject_in.difficulty,
        proficiency=subject_in.proficiency,
        color=subject_in.color
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

def update_subject(db: Session, subject_id: int, subject_in: SubjectUpdate, user_id: int) -> Subject:
    """Updates an existing subject."""
    subject = get_subject_by_id(db, subject_id, user_id)
    if subject_in.name is not None:
        subject.name = subject_in.name
    if subject_in.description is not None:
        subject.description = subject_in.description
    if subject_in.difficulty is not None:
        subject.difficulty = subject_in.difficulty
    if subject_in.proficiency is not None:
        subject.proficiency = subject_in.proficiency
    if subject_in.color is not None:
        subject.color = subject_in.color

    db.commit()
    db.refresh(subject)
    return subject

def delete_subject(db: Session, subject_id: int, user_id: int) -> bool:
    """Deletes a subject and all associated topics/sessions."""
    subject = get_subject_by_id(db, subject_id, user_id)
    db.delete(subject)
    db.commit()
    return True

# --- TOPIC MANAGEMENT ---

def get_topic_by_id(db: Session, topic_id: int, user_id: int) -> Topic:
    """Retrieves a single topic ensuring user owns the parent subject."""
    topic = db.query(Topic).join(Subject).filter(
        Topic.id == topic_id,
        Subject.user_id == user_id
    ).first()
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found or you do not have permission to access it."
        )
    return topic

def create_topic(db: Session, topic_in: TopicCreate, user_id: int) -> Topic:
    """Creates a topic under a subject."""
    # Verify subject ownership
    get_subject_by_id(db, topic_in.subject_id, user_id)
    
    topic = Topic(
        subject_id=topic_in.subject_id,
        name=topic_in.name,
        description=topic_in.description,
        difficulty=topic_in.difficulty,
        proficiency=topic_in.proficiency,
        estimated_hours=topic_in.estimated_hours
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

def update_topic(db: Session, topic_id: int, topic_in: TopicUpdate, user_id: int) -> Topic:
    """Updates a topic's properties."""
    topic = get_topic_by_id(db, topic_id, user_id)
    if topic_in.name is not None:
        topic.name = topic_in.name
    if topic_in.description is not None:
        topic.description = topic_in.description
    if topic_in.difficulty is not None:
        topic.difficulty = topic_in.difficulty
    if topic_in.proficiency is not None:
        topic.proficiency = topic_in.proficiency
    if topic_in.estimated_hours is not None:
        topic.estimated_hours = topic_in.estimated_hours
    if topic_in.completed is not None:
        topic.completed = topic_in.completed
        topic.completed_at = datetime.now(timezone.utc) if topic_in.completed else None

    db.commit()
    db.refresh(topic)
    return topic

def toggle_topic_complete(db: Session, topic_id: int, user_id: int) -> Topic:
    """Toggles topic completion state."""
    topic = get_topic_by_id(db, topic_id, user_id)
    topic.completed = not topic.completed
    topic.completed_at = datetime.now(timezone.utc) if topic.completed else None
    if topic.completed:
        topic.completed_hours = max(topic.completed_hours, topic.estimated_hours)
    
    db.commit()
    db.refresh(topic)
    return topic

def delete_topic(db: Session, topic_id: int, user_id: int) -> bool:
    """Deletes a topic."""
    topic = get_topic_by_id(db, topic_id, user_id)
    db.delete(topic)
    db.commit()
    return True
