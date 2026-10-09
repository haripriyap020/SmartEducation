import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(100), nullable=False)
    section = Column(String(20), nullable=False)
    academic_year = Column(String(50), nullable=False)

    users = relationship("User", back_populates="classroom")
    announcements = relationship("Announcement", back_populates="classroom")
    tasks = relationship("Task", back_populates="classroom")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="student")  # student, cr, faculty
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship("Class", back_populates="users")
    announcements_created = relationship("Announcement", back_populates="creator")
    tasks_created = relationship("Task", back_populates="creator")
    quiz_attempts = relationship("QuizAttempt", back_populates="student")
    learning_plans = relationship("LearningPlan", back_populates="student")
    practice_attempts = relationship("PracticeAttempt", back_populates="student")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    task_completions = relationship("TaskCompletion", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    task_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    original_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    deadline = Column(String(100), nullable=True)
    resource_links = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    classroom = relationship("Class", back_populates="announcements")
    creator = relationship("User", back_populates="announcements_created")
    notifications = relationship("Notification", back_populates="announcement")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String(20), default="medium")  # high, medium, low
    status = Column(String(30), default="pending")  # pending, completed, overdue
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    classroom = relationship("Class", back_populates="tasks")
    creator = relationship("User", back_populates="tasks_created")
    completions = relationship("TaskCompletion", back_populates="task", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="task", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="task", cascade="all, delete-orphan")


class TaskCompletion(Base):
    __tablename__ = "task_completions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("Task", back_populates="completions")
    user = relationship("User", back_populates="task_completions")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    reminder_type = Column(String(50), nullable=False)  # 3_days_before, 1_day_before, due_today, overdue
    status = Column(String(30), default="scheduled")  # scheduled, sent, cancelled

    task = relationship("Task", back_populates="reminders")
    user = relationship("User", back_populates="reminders")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="announcement")  # announcement, assignment, deadline, reminder, roadmap, quiz
    related_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    related_announcement_id = Column(Integer, ForeignKey("announcements.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    task = relationship("Task", back_populates="notifications")
    announcement = relationship("Announcement", back_populates="notifications")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    question_text = Column(Text, nullable=False)
    choices = Column(Text, nullable=False)  # JSON array string
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty = Column(String(30), default="intermediate")  # beginner, intermediate, advanced

    answers = relationship("Answer", back_populates="question")
    practice_attempts = relationship("PracticeAttempt", back_populates="question")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("User", back_populates="quiz_attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class LearningPlan(Base):
    __tablename__ = "learning_plans"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    objective = Column(Text, nullable=False)
    recommended_activity = Column(Text, nullable=False)
    resource_url = Column(String(255), nullable=True)
    difficulty_level = Column(String(50), default="beginner")
    estimated_minutes = Column(Integer, default=30)
    status = Column(String(30), default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("User", back_populates="learning_plans")


class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    attempted_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("User", back_populates="practice_attempts")
    question = relationship("Question", back_populates="practice_attempts")
