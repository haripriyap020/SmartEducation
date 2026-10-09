import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Class, Question, QuizAttempt, Announcement
from ..schemas import QuestionCreate, QuestionFullView, UserResponse
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Faculty & Admin Portal"])


@router.get("/stats")
def get_faculty_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar() or 0
    total_crs = db.query(func.count(User.id)).filter(User.role == "cr").scalar() or 0
    total_classes = db.query(func.count(Class.id)).scalar() or 0
    total_questions = db.query(func.count(Question.id)).scalar() or 0
    total_quizzes_taken = db.query(func.count(QuizAttempt.id)).scalar() or 0
    avg_score = db.query(func.avg(QuizAttempt.percentage)).scalar() or 0.0
    pending_announcements = db.query(func.count(Announcement.id)).filter(Announcement.status == "pending").scalar() or 0

    return {
        "total_students": total_students,
        "total_crs": total_crs,
        "total_classes": total_classes,
        "total_questions": total_questions,
        "total_quizzes_taken": total_quizzes_taken,
        "avg_quiz_percentage": round(avg_score, 1),
        "pending_announcements_count": pending_announcements
    }


@router.get("/questions", response_model=List[QuestionFullView])
def get_all_questions_admin(
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    query = db.query(Question)
    if subject:
        query = query.filter(Question.subject == subject)
    if topic:
        query = query.filter(Question.topic == topic)

    questions = query.order_by(Question.id.asc()).all()
    res = []
    for q in questions:
        choices_list = json.loads(q.choices) if isinstance(q.choices, str) else q.choices
        res.append(
            QuestionFullView(
                id=q.id,
                subject=q.subject,
                topic=q.topic,
                question_text=q.question_text,
                choices=choices_list,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                difficulty=q.difficulty
            )
        )
    return res


@router.post("/questions", response_model=QuestionFullView)
def create_question(
    q_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    new_q = Question(
        subject=q_in.subject,
        topic=q_in.topic,
        question_text=q_in.question_text,
        choices=json.dumps(q_in.choices),
        correct_answer=q_in.correct_answer,
        explanation=q_in.explanation,
        difficulty=q_in.difficulty
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    choices_list = json.loads(new_q.choices) if isinstance(new_q.choices, str) else new_q.choices
    return QuestionFullView(
        id=new_q.id,
        subject=new_q.subject,
        topic=new_q.topic,
        question_text=new_q.question_text,
        choices=choices_list,
        correct_answer=new_q.correct_answer,
        explanation=new_q.explanation,
        difficulty=new_q.difficulty
    )


@router.delete("/questions/{id}")
def delete_question(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    q = db.query(Question).filter(Question.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": f"Question {id} deleted successfully"}


@router.get("/students", response_model=List[UserResponse])
def get_class_students(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["faculty"]))
):
    query = db.query(User).filter(User.role == "student")
    if class_id:
        query = query.filter(User.class_id == class_id)
    return query.all()
