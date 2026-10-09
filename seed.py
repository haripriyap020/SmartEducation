import json
import datetime
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from .models import Class, User, Question, Announcement, QuizAttempt, Answer, LearningPlan
from .auth import get_password_hash

DBMS_QUESTIONS = [
    # 1. SQL Basics (5 questions)
    {
        "subject": "DBMS",
        "topic": "SQL Basics",
        "question_text": "Which SQL clause is used to filter records returned by a SELECT query based on a specified condition?",
        "choices": ["WHERE", "ORDER BY", "GROUP BY", "HAVING"],
        "correct_answer": "WHERE",
        "explanation": "The WHERE clause is used to filter rows before any groupings are made in standard SQL.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Basics",
        "question_text": "Which SQL command is used to remove all duplicate records from the output of a query?",
        "choices": ["DISTINCT", "UNIQUE", "FILTER", "NO_DUPLICATES"],
        "correct_answer": "DISTINCT",
        "explanation": "SELECT DISTINCT removes duplicate rows from the query result set.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Basics",
        "question_text": "What is the difference between WHERE and HAVING clauses in SQL?",
        "choices": [
            "WHERE filters rows before aggregation; HAVING filters aggregated groups after GROUP BY",
            "WHERE is only for numbers; HAVING is for strings",
            "HAVING is executed before WHERE",
            "There is no difference; they are interchangeable"
        ],
        "correct_answer": "WHERE filters rows before aggregation; HAVING filters aggregated groups after GROUP BY",
        "explanation": "WHERE filters individual rows prior to GROUP BY aggregation, while HAVING filters the grouped results produced by aggregate functions (e.g., SUM, COUNT).",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Basics",
        "question_text": "Which of the following aggregate functions ignores NULL values by default in SQL?",
        "choices": ["COUNT(*)", "AVG(column_name)", "ALL(column_name)", "EXISTS"],
        "correct_answer": "AVG(column_name)",
        "explanation": "Aggregate functions like AVG, SUM, MIN, MAX ignore NULL values in column expressions, unlike COUNT(*) which counts all rows.",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Basics",
        "question_text": "Which DDL statement is used to permanently remove a table structure along with all its data from the database?",
        "choices": ["DROP TABLE", "DELETE TABLE", "TRUNCATE TABLE", "REMOVE TABLE"],
        "correct_answer": "DROP TABLE",
        "explanation": "DROP TABLE removes the entire table definition and its contents permanently from the database catalog.",
        "difficulty": "beginner"
    },

    # 2. SQL Joins (5 questions)
    {
        "subject": "DBMS",
        "topic": "SQL Joins",
        "question_text": "Which type of JOIN returns only the rows that have matching values in both tables?",
        "choices": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"],
        "correct_answer": "INNER JOIN",
        "explanation": "INNER JOIN selects records that have matching values in both related tables based on the ON condition.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Joins",
        "question_text": "If Table A has 5 rows and Table B has 4 rows, how many rows are produced by a CROSS JOIN (Cartesian product) between A and B?",
        "choices": ["20", "9", "5", "1"],
        "correct_answer": "20",
        "explanation": "A CROSS JOIN produces a Cartesian product where every row of table A pairs with every row of table B (5 * 4 = 20 rows).",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Joins",
        "question_text": "When performing a LEFT OUTER JOIN between Table A (Left) and Table B (Right), what appears in Table B's columns when there is no matching record?",
        "choices": ["NULL", "0", "Empty string", "Error is thrown"],
        "correct_answer": "NULL",
        "explanation": "In a LEFT JOIN, all rows from the left table are returned, and unmatched columns from the right table are filled with NULL.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Joins",
        "question_text": "Which join query will return all students who have NOT enrolled in any course (Students LEFT JOIN Enrollments)?",
        "choices": [
            "SELECT * FROM Students s LEFT JOIN Enrollments e ON s.id = e.student_id WHERE e.student_id IS NULL",
            "SELECT * FROM Students s INNER JOIN Enrollments e ON s.id = e.student_id WHERE e.student_id IS NULL",
            "SELECT * FROM Students s RIGHT JOIN Enrollments e ON s.id = e.student_id",
            "SELECT * FROM Students s FULL JOIN Enrollments e ON s.id = e.student_id"
        ],
        "correct_answer": "SELECT * FROM Students s LEFT JOIN Enrollments e ON s.id = e.student_id WHERE e.student_id IS NULL",
        "explanation": "A LEFT JOIN combined with 'WHERE right_table.key IS NULL' filters out matched records, leaving only unmatched left table rows (anti-join pattern).",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "SQL Joins",
        "question_text": "What is a SELF JOIN in relational database systems?",
        "choices": [
            "A regular join where a table is joined with itself using table aliases",
            "A join that requires no ON condition",
            "A join between two databases on different servers",
            "A query that joins a view with a table"
        ],
        "correct_answer": "A regular join where a table is joined with itself using table aliases",
        "explanation": "A self join joins a table with itself, typically used for hierarchical or recursive relationships like employee-manager hierarchies.",
        "difficulty": "intermediate"
    },

    # 3. Keys and Constraints (5 questions)
    {
        "subject": "DBMS",
        "topic": "Keys and Constraints",
        "question_text": "Which property strictly distinguishes a Primary Key from a Unique Constraint in SQL?",
        "choices": [
            "A Primary Key cannot accept NULL values, and a table can only have one Primary Key",
            "Unique constraints cannot have indexes",
            "Primary keys can only be integer columns",
            "There is no difference between them"
        ],
        "correct_answer": "A Primary Key cannot accept NULL values, and a table can only have one Primary Key",
        "explanation": "A table can have only one Primary Key constraint which cannot contain NULL values, whereas multiple UNIQUE constraints can exist and generally accept NULLs.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "Keys and Constraints",
        "question_text": "What is a Foreign Key used for in a relational database?",
        "choices": [
            "To enforce referential integrity between two related tables",
            "To speed up database backups",
            "To encrypt table columns for external users",
            "To store external API keys"
        ],
        "correct_answer": "To enforce referential integrity between two related tables",
        "explanation": "A foreign key creates a link between tables by referencing the primary key (or candidate key) of another table, ensuring referential integrity.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "Keys and Constraints",
        "question_text": "What does the 'ON DELETE CASCADE' clause on a foreign key do?",
        "choices": [
            "Automatically deletes corresponding child rows when the parent row is deleted",
            "Prevents the parent row from being deleted",
            "Sets child foreign keys to NULL when parent is deleted",
            "Prompts the user for confirmation before deletion"
        ],
        "correct_answer": "Automatically deletes corresponding child rows when the parent row is deleted",
        "explanation": "ON DELETE CASCADE ensures that when a row in the parent table is deleted, all dependent referencing rows in child tables are automatically removed.",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "Keys and Constraints",
        "question_text": "What defines a Candidate Key in relational database theory?",
        "choices": [
            "A minimal super key that uniquely identifies each tuple without unnecessary attributes",
            "Any column that has an index",
            "A primary key with multiple data types",
            "A key generated exclusively by foreign servers"
        ],
        "correct_answer": "A minimal super key that uniquely identifies each tuple without unnecessary attributes",
        "explanation": "A candidate key is a minimal set of attributes that can uniquely identify a tuple in a relation (no proper subset is a super key).",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "Keys and Constraints",
        "question_text": "Which constraint ensures that all values in a column satisfy a specific Boolean condition (e.g., Age >= 18)?",
        "choices": ["CHECK", "DEFAULT", "VERIFY", "ASSERT"],
        "correct_answer": "CHECK",
        "explanation": "The CHECK constraint limits the range or criteria of values that can be placed in a column according to a Boolean condition.",
        "difficulty": "beginner"
    },

    # 4. Normalization (5 questions)
    {
        "subject": "DBMS",
        "topic": "Normalization",
        "question_text": "What is the primary objective of Database Normalization?",
        "choices": [
            "To minimize data redundancy and avoid insertion, deletion, and update anomalies",
            "To increase disk storage usage",
            "To remove all primary keys from tables",
            "To merge all tables into a single giant table"
        ],
        "correct_answer": "To minimize data redundancy and avoid insertion, deletion, and update anomalies",
        "explanation": "Normalization organizes relational tables to reduce duplicate data and eliminate update/insertion/deletion anomalies.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "Normalization",
        "question_text": "A relation is in First Normal Form (1NF) if and only if:",
        "choices": [
            "All attributes contain only atomic (indivisible) values and no repeating groups exist",
            "Every non-prime attribute is fully functionally dependent on every candidate key",
            "No transitive dependencies exist",
            "It has exactly one column"
        ],
        "correct_answer": "All attributes contain only atomic (indivisible) values and no repeating groups exist",
        "explanation": "1NF requires that each column contains atomic (single, indivisible) values and no multi-valued or repeating columns exist.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "Normalization",
        "question_text": "A table is in 2NF if it is in 1NF and contains NO:",
        "choices": [
            "Partial functional dependencies on any candidate key",
            "Transitive dependencies",
            "Foreign keys",
            "Primary keys"
        ],
        "correct_answer": "Partial functional dependencies on any candidate key",
        "explanation": "2NF requires that no non-prime attribute is partially dependent on any proper subset of a composite candidate key.",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "Normalization",
        "question_text": "If attribute A determines B (A -> B) and B determines C (B -> C), what dependency exists between A and C, which violates 3NF?",
        "choices": [
            "Transitive Dependency",
            "Partial Dependency",
            "Join Dependency",
            "Multivalued Dependency"
        ],
        "correct_answer": "Transitive Dependency",
        "explanation": "When A -> B and B -> C, A -> C represents a Transitive Dependency. 3NF prohibits non-prime attributes from transitively depending on a candidate key.",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "Normalization",
        "question_text": "Boyce-Codd Normal Form (BCNF) is stricter than 3NF because for every non-trivial functional dependency X -> Y:",
        "choices": [
            "X must be a Super Key",
            "Y must be a Primary Key",
            "X and Y must have identical data types",
            "Table must have fewer than 10 rows"
        ],
        "correct_answer": "X must be a Super Key",
        "explanation": "BCNF requires that for every functional dependency X -> Y, X must strictly be a Super Key.",
        "difficulty": "advanced"
    },

    # 5. Transactions (5 questions)
    {
        "subject": "DBMS",
        "topic": "Transactions",
        "question_text": "What does the 'A' in the ACID properties of database transactions stand for?",
        "choices": ["Atomicity", "Availability", "Authorization", "Authentication"],
        "correct_answer": "Atomicity",
        "explanation": "Atomicity guarantees that all operations within a transaction complete successfully (commit) or none do (rollback) — all or nothing.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "Transactions",
        "question_text": "Which ACID property guarantees that once a transaction commits, its changes survive system crashes or power failures?",
        "choices": ["Durability", "Consistency", "Isolation", "Atomicity"],
        "correct_answer": "Durability",
        "explanation": "Durability ensures that committed transaction state is permanently written to non-volatile storage and will not be lost.",
        "difficulty": "beginner"
    },
    {
        "subject": "DBMS",
        "topic": "Transactions",
        "question_text": "What is a 'Dirty Read' concurrency phenomenon?",
        "choices": [
            "A transaction reads uncommitted data modified by another concurrent transaction",
            "Reading corrupted disk sectors",
            "A query that takes longer than 10 seconds to execute",
            "A transaction reading from an outdated backup"
        ],
        "correct_answer": "A transaction reads uncommitted data modified by another concurrent transaction",
        "explanation": "A dirty read occurs when Transaction 1 modifies a row without committing, and Transaction 2 reads that uncommitted modified row.",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "Transactions",
        "question_text": "In Two-Phase Locking (2PL), what characterizes the Growing Phase?",
        "choices": [
            "A transaction may acquire new locks but may not release any locks",
            "A transaction releases all locks simultaneously",
            "Table size grows dynamically",
            "Database server memory allocation doubles"
        ],
        "correct_answer": "A transaction may acquire new locks but may not release any locks",
        "explanation": "Under 2PL, during the Growing (expanding) Phase, transactions only acquire locks and cannot release any locks until the shrinking phase begins.",
        "difficulty": "intermediate"
    },
    {
        "subject": "DBMS",
        "topic": "Transactions",
        "question_text": "Which transaction isolation level provides the highest degree of isolation by completely preventing Dirty Reads, Non-repeatable Reads, and Phantom Reads?",
        "choices": ["SERIALIZABLE", "READ COMMITTED", "READ UNCOMMITTED", "REPEATABLE READ"],
        "correct_answer": "SERIALIZABLE",
        "explanation": "SERIALIZABLE is the strictest SQL isolation level, executing transactions as if they were executed strictly one after another.",
        "difficulty": "advanced"
    }
]


def seed_database(db: Session):
    # Check if classes already seeded
    existing_class = db.query(Class).first()
    if existing_class:
        print("[Seed] Database already seeded. Skipping initial seeding.")
        return

    print("[Seed] Seeding ClassConnectAI initial data...")

    # 1. Create Classes
    class_a = Class(
        class_name="B.Tech Computer Science & Engineering",
        section="Section A",
        academic_year="2025-2026"
    )
    class_b = Class(
        class_name="B.Tech Computer Science & Engineering",
        section="Section B",
        academic_year="2025-2026"
    )
    db.add(class_a)
    db.add(class_b)
    db.commit()
    db.refresh(class_a)
    db.refresh(class_b)

    # 2. Create Users (Student, CR, Faculty)
    student = User(
        name="Haripriya (Student)",
        email="student@classconnect.ai",
        password_hash=get_password_hash("student123"),
        role="student",
        class_id=class_a.id
    )
    cr = User(
        name="Arjun Varma (Class Representative)",
        email="cr@classconnect.ai",
        password_hash=get_password_hash("cr123"),
        role="cr",
        class_id=class_a.id
    )
    faculty = User(
        name="Dr. Ramanathan (Professor & HOD)",
        email="faculty@classconnect.ai",
        password_hash=get_password_hash("faculty123"),
        role="faculty",
        class_id=None
    )
    db.add_all([student, cr, faculty])
    db.commit()
    db.refresh(student)
    db.refresh(cr)
    db.refresh(faculty)

    # 3. Seed DBMS Question Bank
    created_questions = []
    for q_data in DBMS_QUESTIONS:
        q = Question(
            subject=q_data["subject"],
            topic=q_data["topic"],
            question_text=q_data["question_text"],
            choices=json.dumps(q_data["choices"]),
            correct_answer=q_data["correct_answer"],
            explanation=q_data["explanation"],
            difficulty=q_data["difficulty"]
        )
        db.add(q)
        created_questions.append(q)
    db.commit()

    # 4. Seed Classroom Announcements
    # Approved announcement 1
    ann1 = Announcement(
        class_id=class_a.id,
        created_by=cr.id,
        subject="DBMS",
        task_title="Lab Milestone 3: SQL Normalization & Subqueries",
        description="Complete exercises on BCNF decomposition and nested subqueries on the university portal. Make sure schema definitions are well documented.",
        original_text="Submit DBMS Lab 3 exercises by Friday.",
        translated_text=None,
        deadline=(datetime.datetime.now() + datetime.timedelta(days=3)).strftime("%Y-%m-%d 23:59"),
        resource_links="https://classroom.google.com/dbms-lab, https://www.geeksforgeeks.org/dbms/",
        status="approved",
        approved_at=datetime.datetime.utcnow()
    )
    # Approved announcement 2
    ann2 = Announcement(
        class_id=class_a.id,
        created_by=cr.id,
        subject="Operating Systems",
        task_title="Process Synchronization & Semaphores Quiz",
        description="Prepare for the upcoming diagnostic class quiz covering Producer-Consumer problem and Peterson's algorithm.",
        original_text="OS Quiz scheduled for Monday morning.",
        deadline=(datetime.datetime.now() + datetime.timedelta(days=5)).strftime("%Y-%m-%d 10:00"),
        resource_links="https://classroom.google.com/os-sync",
        status="approved",
        approved_at=datetime.datetime.utcnow()
    )
    # Pending announcement with Telugu text for CR review demo
    ann3 = Announcement(
        class_id=class_a.id,
        created_by=cr.id,
        subject="DBMS",
        task_title="DBMS Assignment 4 Submission",
        description="Tomorrow is the DBMS assignment submission before 5:00 PM in the evening in Google Classroom. Please upload your solutions.",
        original_text="అందరికీ నమస్కారం, రేపు డిబిఎంఎస్ అసైన్మెంట్ సాయంత్రం 5 గంటలలోపు గూగుల్ క్లాస్‌రూమ్‌లో అప్‌లోడ్ చేయండి. లింక్: https://classroom.google.com/dbms-assignment-4",
        translated_text="Hello everyone, tomorrow is the DBMS assignment submission before 5:00 PM in the evening in Google Classroom. Please upload your solutions.",
        deadline=(datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d 17:00"),
        resource_links="https://classroom.google.com/dbms-assignment-4",
        status="pending",
        approved_at=None
    )
    db.add_all([ann1, ann2, ann3])
    db.commit()

    # 5. Seed an initial baseline quiz attempt for demonstration
    # Student took a baseline diagnostic quiz and scored 40% (2/5)
    # Topic performance: SQL Basics (Correct), Keys (Correct), Joins (Wrong), Normalization (Wrong), Transactions (Wrong)
    past_date = datetime.datetime.utcnow() - datetime.timedelta(days=2)
    attempt1 = QuizAttempt(
        student_id=student.id,
        subject="DBMS",
        score=2,
        total_questions=5,
        percentage=40.0,
        created_at=past_date
    )
    db.add(attempt1)
    db.commit()
    db.refresh(attempt1)

    # Seed answers for attempt1
    ans_data = [
        {"q_idx": 0, "ans": "WHERE", "corr": True},                  # SQL Basics: Correct
        {"q_idx": 5, "ans": "LEFT JOIN", "corr": False},             # SQL Joins: Wrong
        {"q_idx": 10, "ans": "A Primary Key cannot accept NULL values, and a table can only have one Primary Key", "corr": True}, # Keys: Correct
        {"q_idx": 15, "ans": "To merge all tables into a single giant table", "corr": False}, # Normalization: Wrong
        {"q_idx": 20, "ans": "Availability", "corr": False}          # Transactions: Wrong
    ]
    for ad in ans_data:
        q_obj = created_questions[ad["q_idx"]]
        ans = Answer(
            attempt_id=attempt1.id,
            question_id=q_obj.id,
            selected_answer=ad["ans"],
            is_correct=ad["corr"]
        )
        db.add(ans)

    # Seed initial personalized learning plan for student based on weak topics
    plan1 = LearningPlan(
        student_id=student.id,
        subject="DBMS",
        topic="SQL Joins",
        objective="Master INNER vs LEFT JOIN query mechanics with Venn diagram visualization.",
        recommended_activity="1. Study approved INNER vs LEFT JOIN examples.\n2. Complete 5 beginner multi-table practice challenges.",
        resource_url="https://www.w3schools.com/sql/sql_join.asp",
        difficulty_level="beginner",
        estimated_minutes=25,
        status="completed",
        created_at=past_date
    )
    plan2 = LearningPlan(
        student_id=student.id,
        subject="DBMS",
        topic="Normalization",
        objective="Learn functional dependencies and 1NF, 2NF, 3NF decomposition steps.",
        recommended_activity="Study 1NF, 2NF, and 3NF decomposition examples and eliminate partial dependencies.",
        resource_url="https://www.geeksforgeeks.org/normal-forms-in-dbms/",
        difficulty_level="intermediate",
        estimated_minutes=35,
        status="in_progress",
        created_at=past_date
    )
    db.add_all([plan1, plan2])
    db.commit()

    print("[Seed] Database seeding completed successfully!")
