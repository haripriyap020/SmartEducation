import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Question, User
from ..schemas import (
    AIExtractRequest, AIExtractResponse,
    AITranslateRequest, AITranslateResponse,
    AIExplainAnswerRequest, AIExplainAnswerResponse
)
from ..ai_service import AIService
from ..auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Processing Engine"])


@router.post("/extract-announcement", response_model=AIExtractResponse)
def extract_announcement(
    req: AIExtractRequest,
    current_user: User = Depends(get_current_user)
):
    if not req.raw_text or not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="Notice text cannot be empty")

    extracted = AIService.extract_announcement(req.raw_text, source_type=req.source_type or "text")
    return extracted


@router.post("/translate", response_model=AITranslateResponse)
def translate_text(
    req: AITranslateRequest,
    current_user: User = Depends(get_current_user)
):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    translated = AIService.translate_text(req.text, target_language=req.target_language)
    return translated


@router.post("/explain-answer", response_model=AIExplainAnswerResponse)
def explain_answer(
    req: AIExplainAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    choices = json.loads(question.choices) if isinstance(question.choices, str) else question.choices

    explanation_res = AIService.explain_answer(
        question_text=question.question_text,
        choices=choices,
        selected_answer=req.selected_answer,
        correct_answer=question.correct_answer,
        topic=question.topic
    )

    return {
        "question_id": question.id,
        "is_correct": explanation_res["is_correct"],
        "correct_answer": question.correct_answer,
        "explanation": explanation_res["explanation"],
        "hint": explanation_res["hint"],
        "concept_summary": explanation_res["concept_summary"]
    }
