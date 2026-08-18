# StudyPilot — Full-Stack Adaptive AI Study Planner

> **Production-grade full-stack adaptive study planner designed for college students and engineering candidates.**

StudyPilot eliminates the guesswork in exam preparation. Unlike generic timetable generators or shallow ChatGPT wrappers, StudyPilot pairs a **deterministic multi-factor Python scheduling and optimization engine** with **persistent relational tracking**, **real-time readiness metrics**, **spaced-repetition topic scoring**, **adaptive missed-day recovery**, and a **context-aware AI Tutor**.

---

## 🚀 Key Highlights & Differentiators

* 🧠 **Deterministic Python Engine**: Prioritizes topics and time slots using mathematical multi-factor scoring (exam urgency, proficiency gaps, topic difficulty, quiz recall, and cognitive subject interleaving). Runs 100% independently of external LLM APIs.
* 📈 **Dynamic Readiness & Risk Analytics**: Calculates quantitative subject and exam readiness percentages from real-world completion ratios, self-rated proficiencies, and quiz evaluations.
* 🔄 **Velocity-Based Missed-Day Recovery**: When study days are missed, the engine does not naively slide sessions forward—it re-balances the remaining workload velocity against remaining deadlines.
* 🤖 **Context-Aware AI Tutor**: Incorporates student proficiency level and past weak areas to provide contextual technical explanations, analogies, and code walkthroughs. Gracefully degrades to a built-in offline knowledge engine when no external API key is configured.
* ⏱️ **Interactive Focus Runner**: Built-in Pomodoro/custom focus timer with circular progress tracking, celebratory feedback, reflection notes, and immediate study logging.
* 📊 **Interactive Diagnostic Quizzes**: Instant 5-question topic quizzes with immediate feedback, explanations, and automatic topic proficiency level adaptation in the database.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, React Router v6, Recharts, Axios, Lucide Icons, Canvas Confetti |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn |
| **Security** | JWT Authentication (PyJWT, HS256), Password Hashing (Bcrypt) |
| **Database** | PostgreSQL (Production on Render) / SQLite (Zero-config local development) |
| **AI Layer** | Google Gemini API (`gemini-1.5-flash`) with structured offline fallback |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, FastAPI TestClient (100% test pass rate) |
| **Deployment** | Backend & DB on Render (`render.yaml`), Frontend on Vercel (`vercel.json`) |

---

## 📐 Mathematical Formulation & Scheduling Model

### 1. Topic Priority Scoring Engine
Every candidate topic $T$ in subject $S$ is scored by the deterministic engine:

$$\text{PriorityScore}(T) = W_{\text{urgency}}(S) + W_{\text{weakness}}(T) + W_{\text{difficulty}}(T) + W_{\text{incomplete}}(T) + W_{\text{quiz}}(T) + W_{\text{recency}}(T) + W_{\text{missed}}(T)$$

Where:
* **Exam Urgency ($W_{\text{urgency}}$)**: If subject $S$ has an exam in $D$ days:
  $$W_{\text{urgency}} = \text{PriorityMultiplier} \times \min\left(100, \frac{150}{D + 1}\right)$$
  *(Urgent: $\times 1.6$, High: $\times 1.3$, Medium: $\times 1.0$, Low: $\times 0.7$)*
* **Proficiency Deficit ($W_{\text{weakness}}$)**: $(6 - \text{proficiency}) \times 12.0$ (Scale 1–5).
* **Difficulty Weight ($W_{\text{difficulty}}$)**: $\text{difficulty} \times 8.0$ (Scale 1–5).
* **Incomplete Work ($W_{\text{incomplete}}$)**: $\min\left(30, \frac{H_{\text{rem}}}{H_{\text{est}}} \times 20 + H_{\text{rem}} \times 2\right)$.
* **Quiz Deficit ($W_{\text{quiz}}$)**: $(100 - Q_{\text{pct}}) \times 0.30$.
* **Spaced Repetition ($W_{\text{recency}}$)**: $\min(25, D_{\text{last}} \times 2.5)$.
* **Missed Session Penalty ($W_{\text{missed}}$)**: $\min(30, \text{MissedCount} \times 8.0)$.

### 2. Subject & Exam Readiness Formulas
$$\text{SubjectReadiness} = (0.40 \times \text{CompletionRatio}) + (0.35 \times \text{NormalizedProficiency}) + (0.25 \times \text{AvgQuizScore})$$

$$\text{ExamReadiness} = \text{SubjectReadiness} \times \left(0.60 + 0.40 \times \min\left(1.0, \frac{\text{AvailableStudyHoursRemaining}}{\text{RemainingEstimatedHoursRequired}}\right)\right)$$

### 3. Weak Topic Risk Classification
$$\text{RiskScore} = (0.35 \times \text{ProficiencyDeficit}) + (0.35 \times \text{QuizDeficit}) + (0.20 \times \text{MissedRate} \times 100) + (0.10 \times \text{DifficultyFactor})$$
* **HIGH RISK**: Risk Score $\ge 60\%$
* **MEDIUM RISK**: $35\% \le \text{Risk Score} < 60\%$
* **LOW RISK**: Risk Score $< 35\%$

---

## 📁 Project Structure

```
studypilot/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & middleware
│   │   ├── core/                       # Configuration, database engine & security
│   │   ├── models/                     # SQLAlchemy relational database models
│   │   ├── schemas/                    # Pydantic v2 validation schemas
│   │   ├── routes/                     # REST API route controllers
│   │   ├── services/                   # Business logic layer
│   │   ├── algorithms/                 # Deterministic scheduling & adaptive engines
│   │   └── utils/                      # Sample demo dataset seeder
│   ├── alembic/                        # Database migration scripts
│   ├── tests/                          # Automated Pytest suite (16 test cases)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                        # Axios HTTP client services
│   │   ├── components/                 # Modals, layout, sidebar, timer
│   │   ├── contexts/                   # AuthContext & NotificationContext
│   │   ├── pages/                      # 12 Responsive UI Pages
│   │   ├── index.css                   # Custom modern CSS design system
│   │   ├── App.jsx                     # Protected routing
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json
├── docs/
│   ├── architecture.md                 # System architecture diagrams & data flows
│   └── api.md                          # REST API specification
├── render.yaml                         # Production Render blueprint
└── README.md
```

---

## ⚡ Quick Start / Local Setup

### 1. Prerequisites
* Python 3.12+ (or `uv`)
* Node.js v18+ & npm

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed demo dataset
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`.
Interactive Swagger API docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

### 4. 1-Click Demo Login
Click the **"1-Click Demo Student Login"** button on the login screen or sign in with:
* **Email**: `demo@studypilot.io`
* **Password**: `password123`

---

## 🧪 Running Automated Tests

Run the complete backend pytest suite:
```bash
cd backend
pytest -v
```
**Results**:
```
tests/test_adaptive_engine.py::test_recover_missed_days PASSED           [  6%]
tests/test_ai_service.py::test_ai_tutor_offline_fallback PASSED          [ 12%]
tests/test_ai_service.py::test_ai_tutor_api_endpoint PASSED              [ 18%]
tests/test_auth.py::test_register_user PASSED                            [ 25%]
tests/test_auth.py::test_register_duplicate_email PASSED                 [ 31%]
tests/test_auth.py::test_login_success PASSED                            [ 37%]
tests/test_auth.py::test_login_invalid_password PASSED                   [ 43%]
tests/test_auth.py::test_get_current_user_me PASSED                      [ 50%]
tests/test_auth.py::test_update_preferences PASSED                       [ 56%]
tests/test_quizzes.py::test_quiz_workflow PASSED                         [ 62%]
tests/test_readiness.py::test_subject_readiness_calculation PASSED       [ 68%]
tests/test_readiness.py::test_weak_topic_detection PASSED                [ 75%]
tests/test_scheduler.py::test_priority_score_calculation PASSED          [ 81%]
tests/test_scheduler.py::test_time_slot_generation PASSED                [ 87%]
tests/test_scheduler.py::test_interleaving_and_schedule_generation PASSED [ 93%]
tests/test_subjects.py::test_subject_crud PASSED                         [100%]
======================= 16 passed in 4.58s ========================
```

---

## 🌐 Production Deployment

### Backend (Render)
1. Push repository to GitHub.
2. In Render, select **New > Blueprint** and select `render.yaml`.
3. Render automatically provisions the PostgreSQL database and deploys the FastAPI web service.

### Frontend (Vercel)
1. Import the repository in Vercel.
2. Set Root Directory to `frontend`.
3. Add Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api/v1`.
4. Deploy!

---

## 📄 License & Author
Built for college engineering excellence and software portfolio demonstrations.
