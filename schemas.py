import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr


# Class Schemas
class ClassBase(BaseModel):
    class_name: str
    section: str
    academic_year: str


class ClassCreate(ClassBase):
    pass


class ClassResponse(ClassBase):
    id: int

    class Config:
        from_attributes = True


# User & Auth Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"  # student, cr, faculty
    class_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    class_id: Optional[int] = None
    classroom: Optional[ClassResponse] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


# Announcement Schemas
class AnnouncementCreate(BaseModel):
    class_id: int
    subject: str
    task_title: str
    description: Optional[str] = None
    original_text: Optional[str] = None
    translated_text: Optional[str] = None
    deadline: Optional[str] = None
    resource_links: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    subject: Optional[str] = None
    task_title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    resource_links: Optional[str] = None
    translated_text: Optional[str] = None


class AnnouncementResponse(BaseModel):
    id: int
    class_id: int
    created_by: int
    subject: str
    task_title: str
    description: Optional[str] = None
    original_text: Optional[str] = None
    translated_text: Optional[str] = None
    deadline: Optional[str] = None
    resource_links: Optional[str] = None
    status: str
    created_at: datetime.datetime
    approved_at: Optional[datetime.datetime] = None
    creator_name: Optional[str] = None
    class_name: Optional[str] = None

    class Config:
        from_attributes = True


# AI Processing Schemas
class AIExtractRequest(BaseModel):
    raw_text: str
    source_type: Optional[str] = "text"  # text, telugu, pdf_ocr, image_ocr


class AIExtractResponse(BaseModel):
    subject: str
    task_title: str
    description: str
    deadline: Optional[str] = None
    resource_links: List[str] = []
    detected_language: str
    english_translation: Optional[str] = None
    needs_confirmation: bool = False
    confirmation_message: Optional[str] = None


class AITranslateRequest(BaseModel):
    text: str
    target_language: str = "English"


class AITranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    detected_language: str


class AIExplainAnswerRequest(BaseModel):
    question_id: int
    selected_answer: str


class AIExplainAnswerResponse(BaseModel):
    question_id: int
    is_correct: bool
    correct_answer: str
    explanation: str
    hint: str
    concept_summary: str


# Question & Quiz Schemas
class QuestionBase(BaseModel):
    subject: str
    topic: str
    question_text: str
    choices: List[str]
    difficulty: str = "intermediate"


class QuestionCreate(QuestionBase):
    correct_answer: str
    explanation: Optional[str] = None


class QuestionStudentView(BaseModel):
    id: int
    subject: str
    topic: str
    question_text: str
    choices: List[str]
    difficulty: str

    class Config:
        from_attributes = True


class QuestionFullView(QuestionBase):
    id: int
    correct_answer: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True


class AnswerSubmission(BaseModel):
    question_id: int
    selected_answer: str


class QuizSubmission(BaseModel):
    subject: str
    answers: List[AnswerSubmission]


class TopicAccuracy(BaseModel):
    topic: str
    total: int
    correct: int
    percentage: float
    status: str  # Strong (>=70%), Moderate (50-69%), Needs Practice (<50%)


class QuestionReviewItem(BaseModel):
    question_id: int
    topic: str
    question_text: str
    choices: List[str]
    selected_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None


class QuizResultResponse(BaseModel):
    attempt_id: int
    subject: str
    score: int
    total_questions: int
    percentage: float
    topic_breakdown: List[TopicAccuracy]
    weak_topics: List[str]
    strong_topics: List[str]
    reviews: List[QuestionReviewItem]
    created_at: datetime.datetime


# Learning Plan Schemas
class LearningPlanItemCreate(BaseModel):
    subject: str
    topic: str
    objective: str
    recommended_activity: str
    resource_url: Optional[str] = None
    difficulty_level: str = "beginner"
    estimated_minutes: int = 30


class LearningPlanResponse(BaseModel):
    id: int
    student_id: int
    subject: str
    topic: str
    objective: str
    recommended_activity: str
    resource_url: Optional[str] = None
    difficulty_level: str
    estimated_minutes: int
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class LearningPlanGenerateRequest(BaseModel):
    subject: str
    attempt_id: Optional[int] = None


# Practice Schemas
class PracticeSubmitRequest(BaseModel):
    question_id: int
    selected_answer: str


class PracticeSubmitResponse(BaseModel):
    question_id: int
    is_correct: bool
    correct_answer: str
    explanation: str
    hint: Optional[str] = None


# Progress & Analytics Schemas
class AssessmentHistoryItem(BaseModel):
    attempt_id: int
    subject: str
    score: int
    total_questions: int
    percentage: float
    created_at: datetime.datetime


class SkillProgressResponse(BaseModel):
    total_quizzes_completed: int
    latest_score_percentage: Optional[float] = None
    first_score_percentage: Optional[float] = None
    score_change_delta: Optional[float] = None  # e.g., +30.0%
    topic_mastery: List[TopicAccuracy]
    assessment_history: List[AssessmentHistoryItem]
    practice_activities_completed: int
    active_learning_tasks_count: int
    completed_learning_tasks_count: int
    recommended_next_steps: List[str]
