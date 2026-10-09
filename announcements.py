import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Announcement, User, Class, Notification
from ..schemas import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/announcements", tags=["Classroom Announcements"])


def _format_announcement(announcement: Announcement) -> dict:
    return {
        "id": announcement.id,
        "class_id": announcement.class_id,
        "created_by": announcement.created_by,
        "subject": announcement.subject,
        "task_title": announcement.task_title,
        "description": announcement.description,
        "original_text": announcement.original_text,
        "translated_text": announcement.translated_text,
        "deadline": announcement.deadline,
        "resource_links": announcement.resource_links,
        "status": announcement.status,
        "created_at": announcement.created_at,
        "approved_at": announcement.approved_at,
        "creator_name": announcement.creator.name if announcement.creator else "Unknown",
        "class_name": f"{announcement.classroom.class_name} ({announcement.classroom.section})" if announcement.classroom else "Class"
    }


@router.post("", response_model=AnnouncementResponse)
def create_announcement(
    ann_in: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["cr", "faculty"]))
):
    # Verify class exists
    target_class = db.query(Class).filter(Class.id == ann_in.class_id).first()
    if not target_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target class not found"
        )

    # Initial status is pending for CR verification workflow
    new_ann = Announcement(
        class_id=ann_in.class_id,
        created_by=current_user.id,
        subject=ann_in.subject,
        task_title=ann_in.task_title,
        description=ann_in.description,
        original_text=ann_in.original_text,
        translated_text=ann_in.translated_text,
        deadline=ann_in.deadline,
        resource_links=ann_in.resource_links,
        status="pending"
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    return _format_announcement(new_ann)


@router.get("", response_model=List[AnnouncementResponse])
def get_announcements(
    class_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Announcement)

    # If student, only show approved announcements for student's class
    if current_user.role == "student":
        if not current_user.class_id:
            return []
        query = query.filter(
            Announcement.class_id == current_user.class_id,
            Announcement.status == "approved"
        )
    elif current_user.role == "cr":
        target_class_id = class_id or current_user.class_id
        if target_class_id:
            query = query.filter(Announcement.class_id == target_class_id)
        if status_filter:
            query = query.filter(Announcement.status == status_filter)
    else:  # Faculty
        if class_id:
            query = query.filter(Announcement.class_id == class_id)
        if status_filter:
            query = query.filter(Announcement.status == status_filter)

    announcements = query.order_by(Announcement.created_at.desc()).all()
    return [_format_announcement(a) for a in announcements]


@router.get("/pending", response_model=List[AnnouncementResponse])
def get_pending_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["cr", "faculty"]))
):
    query = db.query(Announcement).filter(Announcement.status == "pending")
    if current_user.role == "cr" and current_user.class_id:
        query = query.filter(Announcement.class_id == current_user.class_id)

    announcements = query.order_by(Announcement.created_at.desc()).all()
    return [_format_announcement(a) for a in announcements]


@router.get("/{id}", response_model=AnnouncementResponse)
def get_announcement_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # If student, ensure they belong to this class and it is approved
    if current_user.role == "student":
        if ann.class_id != current_user.class_id or ann.status != "approved":
            raise HTTPException(status_code=403, detail="Access denied")

    return _format_announcement(ann)


@router.put("/{id}", response_model=AnnouncementResponse)
def update_announcement(
    id: int,
    ann_update: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["cr", "faculty"]))
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if current_user.role == "cr" and current_user.class_id != ann.class_id:
        raise HTTPException(status_code=403, detail="You can only edit announcements for your class")

    if ann_update.subject is not None:
        ann.subject = ann_update.subject
    if ann_update.task_title is not None:
        ann.task_title = ann_update.task_title
    if ann_update.description is not None:
        ann.description = ann_update.description
    if ann_update.deadline is not None:
        ann.deadline = ann_update.deadline
    if ann_update.resource_links is not None:
        ann.resource_links = ann_update.resource_links
    if ann_update.translated_text is not None:
        ann.translated_text = ann_update.translated_text

    db.commit()
    db.refresh(ann)
    return _format_announcement(ann)


@router.post("/{id}/approve", response_model=AnnouncementResponse)
def approve_announcement(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["cr", "faculty"]))
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if current_user.role == "cr" and current_user.class_id != ann.class_id:
        raise HTTPException(status_code=403, detail="You can only approve announcements for your class")

    ann.status = "approved"
    ann.approved_at = datetime.datetime.utcnow()

    # Create notification for students in that class
    students = db.query(User).filter(User.class_id == ann.class_id, User.role == "student").all()
    for student in students:
        notif = Notification(
            student_id=student.id,
            announcement_id=ann.id,
            message=f"New Task published: {ann.subject} - {ann.task_title}"
        )
        db.add(notif)

    db.commit()
    db.refresh(ann)
    return _format_announcement(ann)


@router.post("/{id}/reject", response_model=AnnouncementResponse)
def reject_announcement(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["cr", "faculty"]))
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if current_user.role == "cr" and current_user.class_id != ann.class_id:
        raise HTTPException(status_code=403, detail="You can only reject announcements for your class")

    ann.status = "rejected"
    db.commit()
    db.refresh(ann)
    return _format_announcement(ann)
