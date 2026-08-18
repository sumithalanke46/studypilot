# StudyPilot — REST API Specification

Base URL: `/api/v1`

All protected endpoints require the HTTP header:
`Authorization: Bearer <access_token>`

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
Registers a new user account.
* **Request Body**:
  ```json
  {
    "name": "Alex Chen",
    "email": "alex@university.edu",
    "password": "securepassword123"
  }
  ```
* **Response `201 Created`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "name": "Alex Chen",
      "email": "alex@university.edu",
      "daily_hours": 3.0,
      "preferred_start_time": "18:00",
      "preferred_end_time": "22:00",
      "max_session_mins": 50,
      "break_duration_mins": 10,
      "available_days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    }
  }
  ```

### `POST /auth/login`
Authenticates credentials and returns JWT token.
* **Request Body**:
  ```json
  {
    "email": "alex@university.edu",
    "password": "securepassword123"
  }
  ```

### `GET /auth/me` *(Protected)*
Returns currently authenticated user profile.

### `PUT /auth/preferences` *(Protected)*
Updates daily study capacity and time window.

---

## 2. Subjects & Topics (`/subjects` & `/topics`)

### `GET /subjects` *(Protected)*
Returns all subjects with topic counts and readiness metrics.

### `POST /subjects` *(Protected)*
Creates a new subject.
* **Request Body**:
  ```json
  {
    "name": "Operating Systems",
    "description": "Kernel architecture, processes, memory management",
    "difficulty": 4,
    "proficiency": 3,
    "color": "#4F46E5"
  }
  ```

### `POST /topics` *(Protected)*
Adds a topic under a subject.
* **Request Body**:
  ```json
  {
    "subject_id": 1,
    "name": "Deadlocks & Synchronization",
    "description": "Coffman conditions, Semaphores, Banker's Algorithm",
    "difficulty": 5,
    "proficiency": 2,
    "estimated_hours": 3.5
  }
  ```

### `POST /topics/{id}/toggle-complete` *(Protected)*
Toggles topic completion status.

---

## 3. Exams & Deadlines (`/exams`)

### `GET /exams` *(Protected)*
Returns upcoming exams with countdown days and calculated projected readiness.

### `POST /exams` *(Protected)*
Creates an upcoming exam.
* **Request Body**:
  ```json
  {
    "subject_id": 1,
    "exam_name": "OS Midterm Examination",
    "exam_date": "2026-08-25",
    "priority": "urgent",
    "target_score": 92.0
  }
  ```

---

## 4. Adaptive Study Plan (`/study-plan` & `/sessions`)

### `POST /study-plan/generate` *(Protected)*
Generates a deterministic adaptive study plan.
* **Request Body**:
  ```json
  {
    "start_date": "2026-08-18",
    "days": 7,
    "focus_subject_ids": null,
    "override_daily_hours": null
  }
  ```

### `GET /study-plan/current` *(Protected)*
Returns the active study plan and its structured sessions.

### `POST /study-plan/rebuild` *(Protected)*
Recalculates roadmap after missed study days.
* **Request Body**:
  ```json
  {
    "missed_days": 2,
    "reason": "College festival"
  }
  ```

### `POST /sessions/{id}/complete` *(Protected)*
Logs completion of a study session.
* **Request Body**:
  ```json
  {
    "actual_duration_minutes": 45,
    "notes": "Reviewed Banker's Algorithm and solved 2 practice questions.",
    "update_topic_proficiency": 3
  }
  ```

---

## 5. Topic Quizzes (`/quizzes`)

### `GET /quizzes/topic/{topic_id}?subject_id={subject_id}&count=5` *(Protected)*
Returns diagnostic multiple choice questions.

### `POST /quizzes/submit` *(Protected)*
Submits answers, returns score & explanations, and adapts topic proficiency in DB.

---

## 6. Real-Time Analytics (`/analytics`)

### `GET /analytics/dashboard` *(Protected)*
Returns comprehensive dashboard stats (daily hours, streak, readiness, weak topics, upcoming exams).

### `GET /analytics/weak-topics` *(Protected)*
Returns weak topics ranked by composite risk score (`HIGH`, `MEDIUM`, `LOW`).

---

## 7. Context-Aware AI Tutor (`/ai-tutor`)

### `POST /ai-tutor/chat` *(Protected)*
* **Request Body**:
  ```json
  {
    "query": "Explain Deadlocks with a real-world scenario",
    "subject_id": 1,
    "topic_id": 3,
    "action_type": "example"
  }
  ```
* **Response**:
  ```json
  {
    "response": "### 💡 Real-World Practical Example...",
    "action_type": "example",
    "subject_name": "Operating Systems",
    "topic_name": "Deadlocks & Synchronization",
    "proficiency_context": "Level 2/5",
    "is_fallback": false,
    "source": "gemini_ai"
  }
  ```
