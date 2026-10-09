import os
import re
import json
import datetime
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Topic Resource Mappings for DBMS
DBMS_RESOURCES = {
    "SQL Basics": {
        "resource": "https://www.w3schools.com/sql/sql_syntax.asp",
        "objective": "Master core SQL syntax including SELECT, WHERE, DISTINCT, ORDER BY, and basic aggregations (COUNT, SUM, AVG).",
        "activity_beginner": "Review SQL SELECT syntax guide and practice 5 basic filter queries.",
        "activity_intermediate": "Write complex multi-condition queries with GROUP BY and HAVING clauses."
    },
    "SQL Joins": {
        "resource": "https://www.w3schools.com/sql/sql_join.asp",
        "objective": "Understand the difference between INNER, LEFT, RIGHT, and FULL OUTER joins with Venn diagram visualizations.",
        "activity_beginner": "Study approved INNER vs LEFT JOIN examples and complete 5 beginner multi-table matching questions.",
        "activity_intermediate": "Solve multi-table join challenges with NULL value handling and cross product troubleshooting."
    },
    "Keys and Constraints": {
        "resource": "https://www.geeksforgeeks.org/types-of-keys-in-relational-model-candidate-super-primary-alternate-and-foreign/",
        "objective": "Distinguish between Primary Keys, Foreign Keys, Candidate Keys, Super Keys, and Unique Constraints.",
        "activity_beginner": "Review relational integrity constraints and identify candidate vs primary keys in schema exercises.",
        "activity_intermediate": "Design schema tables with ON DELETE CASCADE and referential integrity constraints."
    },
    "Normalization": {
        "resource": "https://www.geeksforgeeks.org/normal-forms-in-dbms/",
        "objective": "Learn Functional Dependencies, 1NF (atomic values), 2NF (no partial dependency), 3NF (no transitive dependency), and BCNF.",
        "activity_beginner": "Study 1NF, 2NF, and 3NF decomposition examples and identify anomalies in unnormalized tables.",
        "activity_intermediate": "Decompose a relation with multiple candidate keys into 3NF and BCNF without losing dependencies."
    },
    "Transactions": {
        "resource": "https://www.geeksforgeeks.org/acid-properties-in-dbms/",
        "objective": "Understand ACID properties (Atomicity, Consistency, Isolation, Durability) and Concurrency Control (Schedules, Locks).",
        "activity_beginner": "Study the ACID model and practice identifying dirty read and unrepeatable read anomalies.",
        "activity_intermediate": "Analyze serializable vs conflict serializable schedules using precedence graph method."
    }
}


class AIService:
    @staticmethod
    def _is_telugu(text: str) -> bool:
        return bool(re.search(r'[\u0C00-\u0C7F]', text))

    @classmethod
    def extract_announcement(cls, raw_text: str, source_type: str = "text") -> Dict[str, Any]:
        """Extract structured announcement info using Gemini API or rule-based fallback."""
        is_telugu = cls._is_telugu(raw_text)

        # Attempt Gemini API if key is available
        if GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = f"""
                You are ClassConnectAI, an intelligent academic notice parser.
                Parse the following classroom announcement notice into a structured JSON object.

                Notice text:
                \"\"\"{raw_text}\"\"\"

                Return ONLY a valid JSON object matching this schema:
                {{
                    "subject": "string (Subject name e.g. DBMS, OS, Computer Networks, Data Structures, or General Academic)",
                    "task_title": "string (Clear, concise academic task or announcement title)",
                    "description": "string (Detailed instructions or announcement body)",
                    "deadline": "string or null (Exact date/time in YYYY-MM-DD format if clearly stated)",
                    "resource_links": ["string url 1", "string url 2"],
                    "detected_language": "Telugu | English | Other",
                    "english_translation": "string or null (Full English translation if original is non-English)",
                    "needs_confirmation": boolean (true if date says 'tomorrow', 'next week' or relative timeframe, false if explicit date provided or no deadline),
                    "confirmation_message": "string or null (Explanation why confirmation is needed)"
                }}
                Do not invent missing deadlines, links, or subjects. If relative/ambiguous, set needs_confirmation to true.
                """
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                if response.text:
                    clean_json = response.text.strip()
                    if clean_json.startswith("```json"):
                        clean_json = clean_json[7:]
                    if clean_json.startswith("```"):
                        clean_json = clean_json[3:]
                    if clean_json.endswith("```"):
                        clean_json = clean_json[:-3]
                    parsed = json.loads(clean_json.strip())
                    return parsed
            except Exception as e:
                print(f"[AIService] Gemini extraction error (falling back): {e}")

        # Intelligent Rule-Based Engine Fallback
        return cls._rule_based_announcement_extraction(raw_text, is_telugu)

    @classmethod
    def _rule_based_announcement_extraction(cls, text: str, is_telugu: bool) -> Dict[str, Any]:
        # Extract links
        urls = re.findall(r'https?://[^\s,]+', text)

        # Detect Subject
        subject = "General Academic"
        subj_matches = {
            "DBMS": ["dbms", "database", "sql", "డేటాబేస్", "డిబిఎంఎస్", "mysql", "normalization"],
            "Operating Systems": ["operating system", "os", "process", "threads", "ఆపరేటింగ్ సిస్టమ్", "deadlock"],
            "Computer Networks": ["computer networks", "cn", "tcp", "ip", "routing", "నెట్‌వర్క్"],
            "Data Structures": ["data structures", "dsa", "trees", "graphs", "అల్గారిథమ్స్"],
            "Web Technologies": ["web tech", "react", "html", "javascript", "fastapi", "వెబ్"]
        }
        text_lower = text.lower()
        for subj, keywords in subj_matches.items():
            if any(k in text_lower for k in keywords):
                subject = subj
                break

        # Check for ambiguous or relative dates ("tomorrow", "రేపు", "next monday", etc.)
        needs_confirmation = False
        confirmation_msg = None
        deadline = None

        date_match = re.search(r'\b(202[0-9]-[0-1][0-9]-[0-3][0-9])\b', text)
        if date_match:
            deadline = date_match.group(1)
        else:
            relative_keywords = ["tomorrow", "రేపు", "next monday", "evening", "రాత్రి", "next week", "ఈరోజు", "సాయంత్రం", "friday", "monday"]
            if any(rk in text_lower for rk in relative_keywords):
                needs_confirmation = True
                tomorrow_date = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
                confirmation_msg = f"The notice specifies a relative timeframe ('tomorrow' / 'రేపు'). Please confirm exact deadline (Suggested: {tomorrow_date} 23:59)."
                deadline = tomorrow_date

        # Telugu translation
        english_translation = None
        if is_telugu:
            detected_language = "Telugu"
            english_translation = cls.translate_text(text, target_language="English")["translated_text"]
            task_title = f"{subject} Assignment / Notice"
            description = english_translation
        else:
            detected_language = "English"
            first_line = text.strip().split("\n")[0]
            task_title = first_line[:80] if len(first_line) > 10 else f"{subject} Assignment Update"
            description = text.strip()

        return {
            "subject": subject,
            "task_title": task_title,
            "description": description,
            "deadline": deadline,
            "resource_links": urls if urls else ["https://classroom.google.com"],
            "detected_language": detected_language,
            "english_translation": english_translation,
            "needs_confirmation": needs_confirmation,
            "confirmation_message": confirmation_msg
        }

    @classmethod
    def translate_text(cls, text: str, target_language: str = "English") -> Dict[str, str]:
        is_telugu = cls._is_telugu(text)
        detected_lang = "Telugu" if is_telugu else "English"

        if GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = f"Translate the following text accurately to {target_language}. Return ONLY the translated text:\n\n{text}"
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                if response.text:
                    return {
                        "original_text": text,
                        "translated_text": response.text.strip(),
                        "detected_language": detected_lang
                    }
            except Exception as e:
                print(f"[AIService] Translation error (fallback used): {e}")

        # High-quality fallback dictionary for common Telugu academic phrases
        if is_telugu:
            replacements = {
                "అందరికీ నమస్కారం": "Hello everyone",
                "రేపు డిబిఎంఎస్ అసైన్మెంట్": "Tomorrow is the DBMS assignment submission",
                "సాయంత్రం 5 గంటలలోపు": "before 5:00 PM in the evening",
                "సమర్పించాలి": "must be submitted",
                "గూగుల్ క్లాస్‌రూమ్‌లో": "in Google Classroom",
                "అప్‌లోడ్ చేయండి": "please upload",
                "ముఖ్యమైన గమనిక": "Important Note",
                "ల్యాబ్ రికార్డులు": "Lab records",
                "పరీక్ష": "Examination",
                "సిలబస్": "Syllabus"
            }
            translated = text
            for te, en in replacements.items():
                translated = translated.replace(te, en)
            return {
                "original_text": text,
                "translated_text": translated,
                "detected_language": "Telugu"
            }

        return {
            "original_text": text,
            "translated_text": text,
            "detected_language": "English"
        }

    @classmethod
    def generate_learning_roadmap(cls, subject: str, weak_topics: List[str], student_name: str = "Student") -> List[Dict[str, Any]]:
        """Generates step-by-step personalized learning roadmap items based on weak topics."""
        roadmap_items = []

        topics_to_cover = weak_topics if weak_topics else ["SQL Joins", "Normalization", "Transactions"]

        for topic in topics_to_cover:
            topic_info = DBMS_RESOURCES.get(topic, {
                "resource": "https://www.geeksforgeeks.org/dbms/",
                "objective": f"Gain strong conceptual and practical mastery of {topic}.",
                "activity_beginner": f"Study approved {topic} overview and complete beginner practice questions.",
                "activity_intermediate": f"Solve intermediate application questions and scenario problems in {topic}."
            })

            # Step 1: Conceptual Foundation & Resource Study
            roadmap_items.append({
                "subject": subject,
                "topic": topic,
                "objective": f"Review fundamentals and core rules of {topic}.",
                "recommended_activity": f"1. Review conceptual guide: {topic_info['objective']} \n2. Study approved faculty reference examples.",
                "resource_url": topic_info["resource"],
                "difficulty_level": "beginner",
                "estimated_minutes": 25
            })

            # Step 2: Interactive Practice & Application
            roadmap_items.append({
                "subject": subject,
                "topic": topic,
                "objective": f"Apply {topic} rules on 5 beginner and intermediate challenge questions.",
                "recommended_activity": f"Complete interactive practice modules for {topic} in ClassConnectAI Practice Arena with instant AI feedback.",
                "resource_url": topic_info["resource"],
                "difficulty_level": "intermediate",
                "estimated_minutes": 35
            })

            # Step 3: Reassessment & Mastery Check
            roadmap_items.append({
                "subject": subject,
                "topic": topic,
                "objective": f"Validate skill improvement via diagnostic reassessment.",
                "recommended_activity": f"Retake the {topic} diagnostic check to measure score delta and verify readiness.",
                "resource_url": topic_info["resource"],
                "difficulty_level": "advanced",
                "estimated_minutes": 15
            })

        return roadmap_items

    @classmethod
    def explain_answer(cls, question_text: str, choices: List[str], selected_answer: str, correct_answer: str, topic: str) -> Dict[str, Any]:
        is_correct = (selected_answer.strip().lower() == correct_answer.strip().lower())

        if GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = f"""
                You are ClassConnectAI, an empathetic and clear AI Computer Science tutor.
                The student just answered a question on {topic}.

                Question: {question_text}
                Options: {choices}
                Student's selected answer: {selected_answer}
                Correct answer: {correct_answer}
                Is Correct: {is_correct}

                Provide a structured JSON response:
                {{
                    "is_correct": {str(is_correct).lower()},
                    "explanation": "Friendly, clear explanation in simple language. If wrong, explain why the selected answer is incorrect and why the correct answer is right without harsh tone.",
                    "hint": "A helpful intuitive mental model or hint for future similar questions",
                    "concept_summary": "1-2 sentence core concept takeaway"
                }}
                """
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                if response.text:
                    clean_json = response.text.strip()
                    if clean_json.startswith("```json"):
                        clean_json = clean_json[7:]
                    if clean_json.startswith("```"):
                        clean_json = clean_json[3:]
                    if clean_json.endswith("```"):
                        clean_json = clean_json[:-3]
                    return json.loads(clean_json.strip())
            except Exception as e:
                print(f"[AIService] Explain answer error (fallback used): {e}")

        # Intelligent Fallback Explanation
        if is_correct:
            explanation = f"Excellent! Your answer '{selected_answer}' is correct. You correctly applied the foundational principles of {topic}."
            hint = f"Keep this rule in mind: in {topic}, always check the constraints and relational invariants."
            concept_summary = f"Solid understanding demonstrated for {topic}."
        else:
            explanation = f"You selected '{selected_answer}', but the correct answer is '{correct_answer}'. In {topic}, remember how the relational engine processes this structure."
            hint = f"Tip for {topic}: Review the formal definition and eliminate options that violate basic constraints."
            concept_summary = f"{topic} core rule: verify relations step by step to avoid edge-case pitfalls."

        return {
            "is_correct": is_correct,
            "explanation": explanation,
            "hint": hint,
            "concept_summary": concept_summary
        }
