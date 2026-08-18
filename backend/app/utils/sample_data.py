from datetime import date, timedelta, timezone, datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.subject import Subject, Topic
from app.models.exam import Exam
from app.models.quiz import QuizQuestion, QuizResult
from app.models.study_plan import StudyPlan, StudySession
from app.models.notification import Notification
from app.core.security import get_password_hash
from app.algorithms.study_scheduler import build_adaptive_schedule

def seed_demo_data_if_empty(db: Session):
    """Seeds a rich, realistic college engineering study environment if DB is empty."""
    user = db.query(User).filter(User.email == "demo@studypilot.io").first()
    if user:
        return user

    # 1. Create demo user
    user = User(
        name="Alex Chen",
        email="demo@studypilot.io",
        password_hash=get_password_hash("password123"),
        daily_hours=3.5,
        preferred_start_time="18:00",
        preferred_end_time="22:00",
        max_session_mins=45,
        break_duration_mins=10,
        available_days=["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Add Subjects
    os_sub = Subject(
        user_id=user.id,
        name="Operating Systems",
        description="Processes, concurrency, memory management, file systems, and kernel architecture.",
        difficulty=4,
        proficiency=3,
        color="#4F46E5"
    )
    dbms_sub = Subject(
        user_id=user.id,
        name="Database Management Systems",
        description="Relational model, SQL, normalization, transactions, ACID, indexing, and query optimization.",
        difficulty=3,
        proficiency=4,
        color="#0891B2"
    )
    cn_sub = Subject(
        user_id=user.id,
        name="Computer Networks",
        description="OSI & TCP/IP stack, routing protocols, flow control, transport protocols, and socket programming.",
        difficulty=4,
        proficiency=2,
        color="#EA580C"
    )
    db.add_all([os_sub, dbms_sub, cn_sub])
    db.commit()
    db.refresh(os_sub)
    db.refresh(dbms_sub)
    db.refresh(cn_sub)

    # 3. Add Topics
    os_topics = [
        Topic(subject_id=os_sub.id, name="Processes & Threads", description="Process states, PCB, context switching, multithreading models", difficulty=3, proficiency=4, estimated_hours=2.5, completed_hours=2.5, completed=True),
        Topic(subject_id=os_sub.id, name="CPU Scheduling", description="FCFS, SJF, Round Robin, Priority, Multilevel Feedback Queues", difficulty=3, proficiency=3, estimated_hours=2.0, completed_hours=1.5, completed=False),
        Topic(subject_id=os_sub.id, name="Deadlocks & Synchronization", description="Coffman conditions, Semaphores, Mutex, Banker's Algorithm, RAG", difficulty=5, proficiency=2, estimated_hours=3.5, completed_hours=0.5, completed=False),
        Topic(subject_id=os_sub.id, name="Virtual Memory & Paging", description="Page tables, TLB, Page replacement (LRU, FIFO), Thrashing", difficulty=4, proficiency=2, estimated_hours=3.0, completed_hours=0.0, completed=False),
    ]

    dbms_topics = [
        Topic(subject_id=dbms_sub.id, name="Relational Model & Normalization", description="Functional dependencies, 1NF, 2NF, 3NF, BCNF", difficulty=3, proficiency=4, estimated_hours=2.5, completed_hours=2.5, completed=True),
        Topic(subject_id=dbms_sub.id, name="Transactions & Concurrency (ACID)", description="Serializability, 2PL, Timestamp ordering, Deadlocks", difficulty=4, proficiency=3, estimated_hours=3.0, completed_hours=1.5, completed=False),
        Topic(subject_id=dbms_sub.id, name="Indexing & B+ Trees", description="Dense vs sparse indexes, B+ Tree search/insertion, Clustered indexes", difficulty=4, proficiency=3, estimated_hours=2.5, completed_hours=0.0, completed=False),
    ]

    cn_topics = [
        Topic(subject_id=cn_sub.id, name="TCP/IP & Flow Control", description="3-way handshake, Sliding window, TCP Tahoe/Reno congestion control", difficulty=4, proficiency=2, estimated_hours=3.0, completed_hours=0.5, completed=False),
        Topic(subject_id=cn_sub.id, name="IP Addressing & Subnetting", description="CIDR, Subnet masks, IPv4 vs IPv6, NAT, DHCP", difficulty=3, proficiency=3, estimated_hours=2.0, completed_hours=2.0, completed=True),
        Topic(subject_id=cn_sub.id, name="Routing Algorithms", description="Distance Vector, Link State (OSPF), BGP path vector", difficulty=4, proficiency=2, estimated_hours=3.0, completed_hours=0.0, completed=False),
    ]

    all_topics = os_topics + dbms_topics + cn_topics
    db.add_all(all_topics)
    db.commit()

    # 4. Add Upcoming Exams
    today = date.today()
    os_exam = Exam(
        user_id=user.id,
        subject_id=os_sub.id,
        exam_name="OS Midterm Examination",
        exam_date=today + timedelta(days=5),
        priority="urgent",
        target_score=92.0
    )
    cn_exam = Exam(
        user_id=user.id,
        subject_id=cn_sub.id,
        exam_name="Computer Networks Finals",
        exam_date=today + timedelta(days=12),
        priority="high",
        target_score=88.0
    )
    dbms_exam = Exam(
        user_id=user.id,
        subject_id=dbms_sub.id,
        exam_name="DBMS Practical & Theory Exam",
        exam_date=today + timedelta(days=18),
        priority="medium",
        target_score=90.0
    )
    db.add_all([os_exam, cn_exam, dbms_exam])
    db.commit()

    # 5. Add Sample Quiz Results
    q1 = QuizResult(
        user_id=user.id,
        subject_id=os_sub.id,
        topic_id=os_topics[0].id,
        score=5,
        total_questions=5,
        percentage=100.0,
        answers_breakdown=[]
    )
    q2 = QuizResult(
        user_id=user.id,
        subject_id=os_sub.id,
        topic_id=os_topics[2].id,
        score=2,
        total_questions=5,
        percentage=40.0,
        answers_breakdown=[]
    )
    db.add_all([q1, q2])
    db.commit()

    # 6. Generate Initial Study Plan
    subjects = [os_sub, dbms_sub, cn_sub]
    exams = [os_exam, cn_exam, dbms_exam]
    quizzes = [q1, q2]
    
    session_dicts = build_adaptive_schedule(
        user=user,
        subjects=subjects,
        topics=all_topics,
        exams=exams,
        quiz_results=quizzes,
        past_sessions=[],
        start_date=today,
        days=7
    )

    if session_dicts:
        total_h = sum(s["duration_minutes"] for s in session_dicts) / 60.0
        plan = StudyPlan(
            user_id=user.id,
            plan_start_date=today,
            plan_end_date=today + timedelta(days=6),
            status="active",
            total_sessions=len(session_dicts),
            total_hours=round(total_h, 1)
        )
        db.add(plan)
        db.flush()

        for s_data in session_dicts:
            db.add(StudySession(
                user_id=user.id,
                subject_id=s_data["subject_id"],
                topic_id=s_data["topic_id"],
                plan_id=plan.id,
                scheduled_date=s_data["scheduled_date"],
                start_time=s_data["start_time"],
                end_time=s_data["end_time"],
                duration_minutes=s_data["duration_minutes"],
                actual_duration_minutes=0,
                status="scheduled"
            ))

    # 7. Add Notifications
    n1 = Notification(
        user_id=user.id,
        title="High-Priority Exam Approaching",
        message="OS Midterm Examination is in 5 days. High focus allocated to Deadlocks & Synchronization.",
        type="exam_alert",
        link="/exams"
    )
    n2 = Notification(
        user_id=user.id,
        title="Weak Topic Risk Detected",
        message="Deadlocks & Synchronization risk is HIGH (Quiz score: 40%). Extra practice recommended.",
        type="weak_topic",
        link="/quizzes"
    )
    db.add_all([n1, n2])
    db.commit()

    return user
