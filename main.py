import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .seed import seed_database
from .routers import auth, announcements, ai, quiz, skills, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed initial database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title="ClassConnectAI API",
    description="AI-Powered Smart Education and Student Skill Development Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(announcements.router)
app.include_router(ai.router)
app.include_router(quiz.router)
app.include_router(skills.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to ClassConnectAI API",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ClassConnectAI Backend"
    }
