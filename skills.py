import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    User, Question, QuizAttempt, Answer, LearningPlan, PracticeAttempt
)
from ..schemas import (
    TopicAccuracy, LearningPlanResponse, LearningPlanGenerateRequest,
    PracticeSubmitRequest, PracticeSubmitResponse, QuestionStudentView,
    SkillProgressResponse, AssessmentHistoryItem
)
from ..ai_service import AIService, DBMS_RESOURCES
from ..auth import get_current_user, require_role

router = APIRouter(prefix="", tags=["Personalized Learning & Skill Progress"])


@router.get("/skills/me", response_model=List[TopicAccuracy])
def get_my_skills(
    subject: str = "DBMS",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve all student answers joined with questions
    answers = (
        db.query(Answer, Question)
        .join(Question, Answer.question_id == Question.id)
        .join(QuizAttempt, Answer.attempt_id == QuizAttempt.id)
        .filter(QuizAttempt.student_id == current_user.id)
        .filter(Question.subject == subject)
        .all()
    )

    topic_stats = {t: {"total": 0, "correct": 0} for t in DBMS_RESOURCES.keys()}

    for ans, q in answers:
        if q.topic not in topic_stats:
            topic_stats[q.topic] = {"total": 0, "correct": 0}
        topic_stats[q.topic]["total"] += 1
        if ans.is_correct:
            topic_stats[q.topic]["correct"] += 1

    result = []
    for topic, data in topic_stats.items():
        tot = data["total"]
        corr = data["correct"]
        pct = round((corr / tot) * 100, 1) if tot > 0 else 0.0

        if tot == 0:
            status_label = "Needs Practice"
        elif pct >= 70.0:
            status_label = "Strong"
        elif pct >= 50.0:
            status_label = "Moderate"
        else:
            status_label = "Needs Practice"

        result.append(
            TopicAccuracy(
                topic=topic,
                total=tot,
                correct=corr,
                percentage=pct,
                status=status_label
            )
        )
    return result


@router.get("/learning-plan/me", response_model=List[LearningPlanResponse])
def get_my_learning_plan(
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LearningPlan).filter(LearningPlan.student_id == current_user.id)
    if subject:
        query = query.filter(LearningPlan.subject == subject)

    plans = query.order_by(LearningPlan.created_at.desc(), LearningPlan.id.asc()).all()
    return plans


@router.post("/learning-plan/generate", response_model=List[LearningPlanResponse])
def generate_learning_plan(
    req: LearningPlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student", "cr", "faculty"]))
):
    # Find latest quiz attempt or specified attempt
    attempt = None
    if req.attempt_id:
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.id == req.attempt_id,
            QuizAttempt.student_id == current_user.id
        ).first()
    else:
        attempt = db.query(QuizAttempt).filter(
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.subject == req.subject
        ).order_by(QuizAttempt.created_at.desc()).first()

    weak_topics = []
    if attempt:
        # Calculate topic performance for this attempt
        answers = (
            db.query(Answer, Question)
            .join(Question, Answer.question_id == Question.id)
            .filter(Answer.attempt_id == attempt.id)
            .all()
        )
        t_counts = {}
        for ans, q in answers:
            if q.topic not in t_counts:
                t_counts[q.topic] = {"total": 0, "correct": 0}
            t_counts[q.topic]["total"] += 1
            if ans.is_correct:
                t_counts[q.topic]["correct"] += 1

        for topic, counts in t_counts.items():
            pct = (counts["correct"] / counts["total"]) * 100 if counts["total"] > 0 else 0
            if pct < 70.0:
                weak_topics.append(topic)

    if not weak_topics:
        weak_topics = ["SQL Joins", "Normalization"]

    # Generate roadmap items using AI service
    items_data = AIService.generate_learning_roadmap(
        subject=req.subject,
        weak_topics=weak_topics,
        student_name=current_user.name
    )

    created_plans = []
    for item in items_data:
        # Check if already exists in pending
        existing = db.query(LearningPlan).filter(
            LearningPlan.student_id == current_user.id,
            LearningPlan.subject == item["subject"],
            LearningPlan.topic == item["topic"],
            LearningPlan.objective == item["objective"]
        ).first()
        if not existing:
            new_plan = LearningPlan(
                student_id=current_user.id,
                subject=item["subject"],
                topic=item["topic"],
                objective=item["objective"],
                recommended_activity=item["recommended_activity"],
                resource_url=item.get("resource_url"),
                difficulty_level=item.get("difficulty_level", "beginner"),
                estimated_minutes=item.get("estimated_minutes", 30),
                status="pending"
            )
            db.add(new_plan)
            created_plans.append(new_plan)

    db.commit()

    # Return all student's plans for this subject
    all_plans = db.query(LearningPlan).filter(
        LearningPlan.student_id == current_user.id,
        LearningPlan.subject == req.subject
    ).order_by(LearningPlan.created_at.desc()).all()
    return all_plans


@router.post("/learning-tasks/{id}/complete", response_model=LearningPlanResponse)
def complete_learning_task(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(LearningPlan).filter(
        LearningPlan.id == id,
        LearningPlan.student_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Learning task not found")

    plan.status = "completed" if plan.status != "completed" else "pending"
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/practice/{topic}", response_model=List[QuestionStudentView])
def get_practice_questions(
    topic: str,
    subject: str = "DBMS",
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Question).filter(
        Question.subject == subject,
        Question.topic.ilike(f"%{topic}%")
    )
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    questions = query.limit(10).all()
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


@router.post("/practice/submit", response_model=PracticeSubmitResponse)
def submit_practice_answer(
    sub: PracticeSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Question).filter(Question.id == sub.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = (sub.selected_answer.strip().lower() == q.correct_answer.strip().lower())

    # Record practice attempt
    attempt = PracticeAttempt(
        student_id=current_user.id,
        question_id=q.id,
        selected_answer=sub.selected_answer,
        is_correct=is_correct
    )
    db.add(attempt)
    db.commit()

    explanation = q.explanation or f"In {q.topic}, the correct answer is {q.correct_answer}."
    hint = f"Focus on core definitions in {q.topic} to choose accurately."

    return PracticeSubmitResponse(
        question_id=q.id,
        is_correct=is_correct,
        correct_answer=q.correct_answer,
        explanation=explanation,
        hint=hint
    )


@router.get("/progress/me", response_model=SkillProgressResponse)
def get_my_progress(
    subject: str = "DBMS",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch quiz attempts in chronological order
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id == current_user.id, QuizAttempt.subject == subject)
        .order_by(QuizAttempt.created_at.asc())
        .all()
    )

    total_quizzes = len(attempts)
    first_score_pct = attempts[0].percentage if total_quizzes > 0 else None
    latest_score_pct = attempts[-1].percentage if total_quizzes > 0 else None

    # Calculate actual percentage point improvement delta (e.g. 40% -> 70% = +30.0%)
    score_change_delta = None
    if total_quizzes >= 2:
        score_change_delta = round(latest_score_pct - first_score_pct, 1)

    # Topic Mastery from all attempts
    topic_skills = get_my_skills(subject=subject, db=db, current_user=current_user)

    # Assessment history in reverse chronological order
    history_items = [
        AssessmentHistoryItem(
            attempt_id=a.id,
            subject=a.subject,
            score=a.score,
            total_questions=a.total_questions,
            percentage=a.percentage,
            created_at=a.created_at
        )
        for a in reversed(attempts)
    ]

    # Practice counts
    practice_count = (
        db.query(func.count(PracticeAttempt.id))
        .filter(PracticeAttempt.student_id == current_user.id)
        .scalar() or 0
    )

    # Learning plan counts
    active_tasks = (
        db.query(func.count(LearningPlan.id))
        .filter(LearningPlan.student_id == current_user.id, LearningPlan.status != "completed")
        .scalar() or 0
    )
    completed_tasks = (
        db.query(func.count(LearningPlan.id))
        .filter(LearningPlan.student_id == current_user.id, LearningPlan.status == "completed")
        .scalar() or 0
    )

    # Next step recommendations based on real progress
    recommendations = []
    weak_found = [t.topic for t in topic_skills if t.status == "Needs Practice"]
    if weak_found:
        recommendations.append(f"Focus interactive practice on weak topics: {', '.join(weak_found[:2])}.")
    if active_tasks > 0:
        recommendations.append(f"Complete {active_tasks} pending personalized roadmap tasks.")
    if total_quizzes == 1:
        recommendations.append("Take a diagnostic reassessment to measure your improvement delta.")
    elif score_change_delta is not None and score_change_delta > 0:
        recommendations.append(f"Great progress! You achieved a +{score_change_delta}% score improvement since your first quiz.")
    else:
        recommendations.append("Continue regular practice to build mastery across all DBMS topics.")

    return SkillProgressResponse(
        total_quizzes_completed=total_quizzes,
        latest_score_percentage=latest_score_pct,
        first_score_percentage=first_score_pct,
        score_change_delta=score_change_delta,
        topic_mastery=topic_skills,
        assessment_history=history_items,
        practice_activities_completed=practice_count,
        active_learning_tasks_count=active_tasks,
        completed_learning_tasks_count=completed_tasks,
        recommended_next_steps=recommendations
    )
