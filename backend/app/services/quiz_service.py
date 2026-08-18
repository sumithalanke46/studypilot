from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.subject import Subject, Topic
from app.models.quiz import QuizQuestion, QuizResult
from app.models.user import User
from app.schemas.quiz import QuizSubmissionRequest, SingleAnswerSubmission

# Pre-seeded topic quiz question bank for offline / guaranteed instant quizzes
CURATED_QUESTION_BANK = [
    {
        "keywords": ["deadlock", "deadlocks", "concurrency", "operating system"],
        "questions": [
            {
                "question": "Which of the following is NOT one of Coffman's four necessary conditions for deadlock?",
                "options": ["Mutual Exclusion", "Hold and Wait", "Preemption allowed", "Circular Wait"],
                "correct_option_index": 2,
                "explanation": "No preemption is the condition required for deadlocks. If preemption is allowed, deadlocks cannot occur.",
                "difficulty": 3
            },
            {
                "question": "Which algorithm is commonly used for deadlock avoidance in banking and resource allocation systems?",
                "options": ["Round Robin Algorithm", "Banker's Algorithm", "Dijkstra's Shortest Path", "LRU Page Replacement"],
                "correct_option_index": 1,
                "explanation": "The Banker's Algorithm by Edsger Dijkstra tests for safety by simulating resource allocation.",
                "difficulty": 3
            },
            {
                "question": "In a Resource Allocation Graph (RAG), what indicates a deadlock when every resource has only one instance?",
                "options": ["A cycle in the graph", "Multiple roots", "Isolated vertices", "A bipartite structure"],
                "correct_option_index": 0,
                "explanation": "In a single-instance RAG, the presence of a cycle is both necessary and sufficient for deadlock.",
                "difficulty": 4
            }
        ]
    },
    {
        "keywords": ["process", "processes", "threads", "scheduling", "cpu"],
        "questions": [
            {
                "question": "Which CPU scheduling algorithm can suffer from the 'convoy effect'?",
                "options": ["First-Come, First-Served (FCFS)", "Round Robin (RR)", "Shortest Job First (SJF)", "Priority Scheduling"],
                "correct_option_index": 0,
                "explanation": "FCFS suffers from the convoy effect when a CPU-bound process blocks several I/O-bound processes.",
                "difficulty": 2
            },
            {
                "question": "What is the primary advantage of user-level threads over kernel-level threads?",
                "options": ["Faster context switching and creation", "Automatic hardware multicore distribution", "Non-blocking system calls", "Direct kernel memory access"],
                "correct_option_index": 0,
                "explanation": "User threads don't require switching to kernel mode, making context switching and thread creation much faster.",
                "difficulty": 3
            }
        ]
    },
    {
        "keywords": ["database", "dbms", "sql", "transaction", "acid"],
        "questions": [
            {
                "question": "What does the 'I' in ACID properties of a database transaction stand for?",
                "options": ["Integrity", "Isolation", "Immutability", "Indexing"],
                "correct_option_index": 1,
                "explanation": "Isolation ensures that concurrent transactions execute independently without interfering with each other.",
                "difficulty": 2
            },
            {
                "question": "Which normal form removes transitive functional dependencies?",
                "options": ["First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "BCNF"],
                "correct_option_index": 2,
                "explanation": "3NF requires the table to be in 2NF and have no non-prime attribute transitively dependent on any candidate key.",
                "difficulty": 3
            }
        ]
    },
    {
        "keywords": ["network", "tcp", "udp", "ip", "osi"],
        "questions": [
            {
                "question": "At which layer of the OSI model does the TCP protocol operate?",
                "options": ["Network Layer", "Transport Layer", "Data Link Layer", "Session Layer"],
                "correct_option_index": 1,
                "explanation": "TCP and UDP are transport layer protocols providing host-to-host communication services.",
                "difficulty": 2
            },
            {
                "question": "What is the size of an IPv6 address in bits?",
                "options": ["32 bits", "64 bits", "128 bits", "256 bits"],
                "correct_option_index": 2,
                "explanation": "IPv6 addresses are 128 bits (16 bytes) in length, formatted as 8 groups of 4 hexadecimal digits.",
                "difficulty": 2
            }
        ]
    }
]

def get_or_generate_quiz_questions(db: Session, topic_id: int, subject_id: int, count: int = 5) -> List[QuizQuestion]:
    """Retrieves existing questions from DB or seeds appropriate topic questions."""
    existing_questions = db.query(QuizQuestion).filter(
        QuizQuestion.topic_id == topic_id,
        QuizQuestion.subject_id == subject_id
    ).limit(count).all()

    if existing_questions and len(existing_questions) >= 3:
        return existing_questions

    # Find matching questions from question bank based on topic and subject name
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    
    search_terms = []
    if topic:
        search_terms.extend(topic.name.lower().split())
    if subject:
        search_terms.extend(subject.name.lower().split())

    matched_bank = None
    for bank in CURATED_QUESTION_BANK:
        for kw in bank["keywords"]:
            if any(kw in term or term in kw for term in search_terms):
                matched_bank = bank
                break
        if matched_bank:
            break

    # If no specific match, use general question bank
    if not matched_bank:
        matched_bank = CURATED_QUESTION_BANK[0]

    created = []
    for q_data in matched_bank["questions"]:
        # Check if already added
        exists = db.query(QuizQuestion).filter(
            QuizQuestion.topic_id == topic_id,
            QuizQuestion.question_text == q_data["question"]
        ).first()
        if not exists:
            new_q = QuizQuestion(
                subject_id=subject_id,
                topic_id=topic_id,
                question_text=q_data["question"],
                options=q_data["options"],
                correct_option_index=q_data["correct_option_index"],
                explanation=q_data["explanation"],
                difficulty=q_data["difficulty"]
            )
            db.add(new_q)
            created.append(new_q)
    
    db.commit()
    return db.query(QuizQuestion).filter(
        QuizQuestion.topic_id == topic_id,
        QuizQuestion.subject_id == subject_id
    ).limit(count).all()

def submit_quiz_answers(
    db: Session,
    user_id: int,
    sub_req: QuizSubmissionRequest
) -> Dict[str, Any]:
    """
    Evaluates quiz submission, computes percentage score,
    updates topic proficiency dynamically, and saves historical results.
    """
    total_q = len(sub_req.answers)
    if total_q == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers submitted.")

    score = 0
    feedback_breakdown = []

    for ans in sub_req.answers:
        q_obj = db.query(QuizQuestion).filter(QuizQuestion.id == ans.question_id).first()
        if not q_obj:
            continue

        is_correct = (ans.selected_option_index == q_obj.correct_option_index)
        if is_correct:
            score += 1

        feedback_breakdown.append({
            "question_id": q_obj.id,
            "question_text": q_obj.question_text,
            "options": q_obj.options,
            "selected_option_index": ans.selected_option_index,
            "correct_option_index": q_obj.correct_option_index,
            "is_correct": is_correct,
            "explanation": q_obj.explanation
        })

    percentage = round((score / total_q) * 100.0, 1)

    # Save QuizResult
    quiz_result = QuizResult(
        user_id=user_id,
        subject_id=sub_req.subject_id,
        topic_id=sub_req.topic_id,
        score=score,
        total_questions=total_q,
        percentage=percentage,
        answers_breakdown=feedback_breakdown
    )
    db.add(quiz_result)

    # Automatically adapt topic proficiency based on quiz performance
    topic = db.query(Topic).filter(Topic.id == sub_req.topic_id).first()
    if topic:
        if percentage >= 85:
            topic.proficiency = min(5, topic.proficiency + 1)
        elif percentage < 50:
            topic.proficiency = max(1, topic.proficiency - 1)

    db.commit()
    db.refresh(quiz_result)

    return {
        "id": quiz_result.id,
        "user_id": quiz_result.user_id,
        "subject_id": quiz_result.subject_id,
        "topic_id": quiz_result.topic_id,
        "score": score,
        "total_questions": total_q,
        "percentage": percentage,
        "answers_breakdown": feedback_breakdown,
        "created_at": quiz_result.created_at,
        "updated_topic_proficiency": topic.proficiency if topic else None
    }
