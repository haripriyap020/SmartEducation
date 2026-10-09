"""
Comprehensive Automated Test Suite for ClassConnectAI Backend
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed import seed_database

client = TestClient(app)

def setup_module(module):
    # Ensure fresh test database
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_login_student():
    res = client.post("/auth/login", json={
        "email": "student@classconnect.ai",
        "password": "student123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"
    return data["access_token"]

def test_auth_login_cr():
    res = client.post("/auth/login", json={
        "email": "cr@classconnect.ai",
        "password": "cr123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "cr"
    return data["access_token"]

def test_auth_login_faculty():
    res = client.post("/auth/login", json={
        "email": "faculty@classconnect.ai",
        "password": "faculty123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "faculty"
    return data["access_token"]

def test_ai_announcement_extraction():
    student_token = test_auth_login_student()
    headers = {"Authorization": f"Bearer {student_token}"}
    
    notice_text = "అందరికీ నమస్కారం, రేపు డిబిఎంఎస్ అసైన్మెంట్ సాయంత్రం 5 గంటలలోపు గూగుల్ క్లాస్‌రూమ్‌లో అప్‌లోడ్ చేయండి. లింక్: https://classroom.google.com/dbms-assignment"
    res = client.post("/ai/extract-announcement", json={"raw_text": notice_text}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["detected_language"] == "Telugu"
    assert data["subject"] == "DBMS"
    assert data["needs_confirmation"] is True
    assert len(data["resource_links"]) > 0

def test_cr_announcement_workflow():
    cr_token = test_auth_login_cr()
    student_token = test_auth_login_student()
    cr_headers = {"Authorization": f"Bearer {cr_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 1. CR creates announcement (starts as pending)
    create_res = client.post("/announcements", json={
        "class_id": 1,
        "subject": "Computer Networks",
        "task_title": "Subnetting Practice Sheet",
        "description": "Solve problem sheet 2 on CIDR subnetting.",
        "deadline": "2026-10-15",
        "resource_links": "https://geeksforgeeks.org/subnetting"
    }, headers=cr_headers)
    assert create_res.status_code == 200
    ann_id = create_res.json()["id"]
    assert create_res.json()["status"] == "pending"

    # 2. Student should NOT see pending announcement
    student_feed = client.get("/announcements", headers=student_headers).json()
    assert not any(a["id"] == ann_id for a in student_feed)

    # 3. CR gets pending list
    pending_list = client.get("/announcements/pending", headers=cr_headers).json()
    assert any(a["id"] == ann_id for a in pending_list)

    # 4. CR approves announcement
    approve_res = client.post(f"/announcements/{ann_id}/approve", headers=cr_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 5. Student can now see approved announcement
    updated_feed = client.get("/announcements", headers=student_headers).json()
    assert any(a["id"] == ann_id for a in updated_feed)

def test_diagnostic_quiz_and_skill_gap_analysis():
    student_token = test_auth_login_student()
    headers = {"Authorization": f"Bearer {student_token}"}

    # Fetch diagnostic questions
    q_res = client.get("/quiz/questions?subject=DBMS&limit=5", headers=headers)
    assert q_res.status_code == 200
    questions = q_res.json()
    assert len(questions) > 0
    # Ensure answers are not leaked to student
    for q in questions:
        assert "correct_answer" not in q

    # Submit quiz answers
    answers = []
    for q in questions:
        # Pick the first choice
        answers.append({
            "question_id": q["id"],
            "selected_answer": q["choices"][0]
        })

    submit_res = client.post("/quiz/submit", json={
        "subject": "DBMS",
        "answers": answers
    }, headers=headers)
    assert submit_res.status_code == 200
    res_data = submit_res.json()
    assert "score" in res_data
    assert "percentage" in res_data
    assert len(res_data["topic_breakdown"]) > 0

def test_learning_roadmap_and_progress_delta():
    student_token = test_auth_login_student()
    headers = {"Authorization": f"Bearer {student_token}"}

    # Generate roadmap
    gen_res = client.post("/learning-plan/generate", json={"subject": "DBMS"}, headers=headers)
    assert gen_res.status_code == 200
    plans = gen_res.json()
    assert len(plans) > 0

    # Complete a learning task
    first_plan_id = plans[0]["id"]
    complete_res = client.post(f"/learning-tasks/{first_plan_id}/complete", headers=headers)
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    # Check progress tracker (should calculate attempts and metrics)
    prog_res = client.get("/progress/me?subject=DBMS", headers=headers)
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert prog_data["total_quizzes_completed"] >= 1
    assert len(prog_data["topic_mastery"]) > 0
    assert len(prog_data["recommended_next_steps"]) > 0

def test_interactive_practice_and_feedback():
    student_token = test_auth_login_student()
    headers = {"Authorization": f"Bearer {student_token}"}

    # Get practice questions for SQL Joins
    prac_res = client.get("/practice/SQL Joins?subject=DBMS", headers=headers)
    assert prac_res.status_code == 200
    prac_questions = prac_res.json()
    assert len(prac_questions) > 0

    target_q = prac_questions[0]

    # Submit practice answer
    submit_res = client.post("/practice/submit", json={
        "question_id": target_q["id"],
        "selected_answer": target_q["choices"][0]
    }, headers=headers)
    assert submit_res.status_code == 200
    data = submit_res.json()
    assert "is_correct" in data
    assert "explanation" in data

    # Explain answer with AI
    explain_res = client.post("/ai/explain-answer", json={
        "question_id": target_q["id"],
        "selected_answer": target_q["choices"][0]
    }, headers=headers)
    assert explain_res.status_code == 200
    exp_data = explain_res.json()
    assert "concept_summary" in exp_data

if __name__ == "__main__":
    setup_module(None)
    test_health()
    test_auth_login_student()
    test_auth_login_cr()
    test_auth_login_faculty()
    test_ai_announcement_extraction()
    test_cr_announcement_workflow()
    test_diagnostic_quiz_and_skill_gap_analysis()
    test_learning_roadmap_and_progress_delta()
    test_interactive_practice_and_feedback()
    print("ALL TESTS PASSED SUCCESSFULLY!")
