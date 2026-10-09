import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Question, QuizAttempt, Answer, User
from ..schemas import (
    QuestionStudentView, QuizSubmission, QuizResultResponse,
    TopicAccuracy, QuestionReviewItem, AssessmentHistoryItem
)
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/quiz", tags=["Diagnostic Quizzes & Skill Gap Analyzer"])


@router.get("/questions", response_model=List[QuestionStudentView])
def get_diagnostic_questions(
    subject: str = "DBMS",
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(Question).filter(Question.subject == subject).limit(limit).all()

    result = []
    for q in questions:
        choices_list = json.loads(q.choices) if isinstance(q.choices, str) else q.choices
        result.append(
            QuestionStudentView(
                id=q.id,
                subject=q.subject,
                topic=q.topic,
                question_text=q.question_text,
                choices=choices_list,
                difficulty=q.difficulty
            )
        )
    return result


@router.post("/submit", response_model=QuizResultResponse)
def submit_quiz(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student", "cr", "faculty"]))
):
    if not submission.answers:
        raise HTTPException(status_code=400, detail="Submission cannot be empty")

    question_ids = [a.question_id for a in submission.answers]
    questions_map = {
        q.id: q for q in db.query(Question).filter(Question.id.in_(question_ids)).all()
    }

    score = 0
    total_questions = len(submission.answers)
    topic_stats = {}  # topic: {"total": 0, "correct": 0}
    review_items = []

    for item in submission.answers:
        q = questions_map.get(item.question_id)
        if not q:
            continue

        topic = q.topic
        if topic not in topic_stats:
            topic_stats[topic] = {"total": 0, "correct": 0}
        topic_stats[topic]["total"] += 1

        is_correct = (item.selected_answer.strip().lower() == q.correct_answer.strip().lower())
        if is_correct:
            score += 1
            topic_stats[topic]["correct"] += 1

        choices_list = json.loads(q.choices) if isinstance(q.choices, str) else q.choices
        review_items.append(
            QuestionReviewItem(
                question_id=q.id,
                topic=q.topic,
                question_text=q.question_text,
                choices=choices_list,
                selected_answer=item.selected_answer,
                correct_answer=q.correct_answer,
                is_correct=is_correct,
                explanation=q.explanation
            )
        )

    percentage = round((score / total_questions) * 100, 2) if total_questions > 0 else 0.0

    # Save QuizAttempt
    attempt = QuizAttempt(
        student_id=current_user.id,
        subject=submission.subject,
        score=score,
        total_questions=total_questions,
        percentage=percentage
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Save Answers
    for rev in review_items:
        ans = Answer(
            attempt_id=attempt.id,
            question_id=rev.question_id,
            selected_answer=rev.selected_answer,
            is_correct=rev.is_correct
        )
        db.add(ans)
    db.commit()

    # Topic breakdown analysis
    topic_breakdown = []
    weak_topics = []
    strong_topics = []

    for topic, data in topic_stats.items():
        tot = data["total"]
        corr = data["correct"]
        pct = round((corr / tot) * 100, 1) if tot > 0 else 0.0

        if pct >= 70.0:
            status_label = "Strong"
            strong_topics.append(topic)
        elif pct >= 50.0:
            status_label = "Moderate"
        else:
            status_label = "Needs Practice"
            weak_topics.append(topic)

        topic_breakdown.append(
            TopicAccuracy(
                topic=topic,
                total=tot,
                correct=corr,
                percentage=pct,
                status=status_label
            )
        )

    # If all above 70%, weak_topics might be empty; moderate topics become secondary focus
    if not weak_topics and not strong_topics:
        weak_topics = list(topic_stats.keys())

    return QuizResultResponse(
        attempt_id=attempt.id,
        subject=submission.subject,
        score=score,
        total_questions=total_questions,
        percentage=percentage,
        topic_breakdown=topic_breakdown,
        weak_topics=weak_topics,
        strong_topics=strong_topics,
        reviews=review_items,
        created_at=attempt.created_at
    )


@router.get("/history", response_model=List[AssessmentHistoryItem])
def get_quiz_history(
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(QuizAttempt).filter(QuizAttempt.student_id == current_user.id)
    if subject:
        query = query.filter(QuizAttempt.subject == subject)

    attempts = query.order_by(QuizAttempt.created_at.desc()).all()
    return [
        AssessmentHistoryItem(
            attempt_id=a.id,
            subject=a.subject,
            score=a.score,
            total_questions=a.total_questions,
            percentage=a.percentage,
            created_at=a.created_at
        )
        for a in attempts
    ]
