import os
import json
from typing import Dict, Any, Optional, List
from app.core.config import settings

def get_fallback_explanation(query: str, subject_name: Optional[str], topic_name: Optional[str], proficiency: int, action_type: str) -> str:
    """Generates structured educational tutor guidance when LLM API is offline."""
    sub_title = subject_name or "Computer Science / Engineering"
    top_title = topic_name or "Core Concept"
    
    prof_label = "Novice/Foundational" if proficiency <= 2 else ("Intermediate" if proficiency <= 3 else "Advanced")
    
    if action_type == "example":
        return f"""### 💡 Real-World Practical Example: {top_title} ({sub_title})

**Scenario**: Imagine a busy traffic intersection with single-lane roads or a multi-threaded web server handling incoming requests.

1. **The Analogy**:
   - In **{top_title}**, resources (like CPU, RAM, or Database locks) are claimed by concurrent tasks.
   - If Task A holds Resource 1 and waits for Resource 2, while Task B holds Resource 2 and waits for Resource 1, neither can proceed.

2. **Code / Implementation Pattern**:
```python
# Conceptual concurrency / resource synchronization pattern
import threading
import time

lock_a = threading.Lock()
lock_b = threading.Lock()

def task_safe_order():
    # Resource hierarchy pattern to prevent circular wait
    with lock_a:
        time.sleep(0.1)
        with lock_b:
            print("Successfully acquired locks in global order!")
```

3. **Key Takeaway**: Always enforce a global acquisition hierarchy to eliminate circular wait conditions.

*(Note: AI API key is not configured. This response was provided by StudyPilot's built-in engineering tutor engine.)*"""

    elif action_type == "simplify":
        return f"""### 🧠 Simplified Explanation (ELI5): {top_title}

**What is it in one sentence?**
> **{top_title}** is a foundational mechanism in **{sub_title}** that ensures programs run correctly and predictably.

**The 3 Golden Rules to remember**:
1. **Inputs & Prerequisites**: What does this concept need before it can execute?
2. **Process / Mechanism**: What happens step-by-step under the hood?
3. **Output & Guarantees**: What guarantee does this provide (e.g. data consistency, fault tolerance, dead-lock freedom)?

*(Note: AI API key is not configured. This response was provided by StudyPilot's built-in engineering tutor engine.)*"""

    else:
        return f"""### 📚 Deep Dive: {top_title} ({sub_title})
*Tailored for {prof_label} proficiency level (Level {proficiency}/5)*

#### 1. Conceptual Foundation
**{top_title}** addresses key architectural tradeoffs in modern computing systems. When studying for your exams, focus heavily on the following aspects:
- **Core Definitions & Invariants**: Understand the formal constraints and system states.
- **Common Algorithms**: Compare trade-offs between proactive avoidance vs. reactive recovery.
- **Edge Cases & Failure Modes**: Identify what happens under high load or resource contention.

#### 2. Exam Review Checklist
- [ ] Understand the 4 necessary conditions and theoretical bounds.
- [ ] Be able to trace the algorithm step-by-step with state tables.
- [ ] Write pseudo-code demonstrating safe state transitions.

#### 3. Recommended Next Study Step
Take a quick 5-question topic quiz on **{top_title}** in StudyPilot to benchmark your recall and solidify weak areas!

*(Note: AI API key is not configured. This response was provided by StudyPilot's built-in engineering tutor engine.)*"""


def ask_ai_tutor(
    query: str,
    subject_name: Optional[str] = None,
    topic_name: Optional[str] = None,
    proficiency: int = 3,
    weak_areas: Optional[List[str]] = None,
    action_type: str = "explain"
) -> Dict[str, Any]:
    """
    Abstracted AI service connecting to Google Gemini or fallback engine.
    Injects contextual student metadata (subject, topic, proficiency level, weak areas).
    """
    api_key = settings.GEMINI_API_KEY or settings.AI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY")
    
    if not api_key:
        fallback_text = get_fallback_explanation(query, subject_name, topic_name, proficiency, action_type)
        return {
            "response": fallback_text,
            "action_type": action_type,
            "subject_name": subject_name,
            "topic_name": topic_name,
            "proficiency_context": f"Level {proficiency}/5",
            "is_fallback": True,
            "source": "built_in_tutor_engine"
        }

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        system_instruction = (
            "You are StudyPilot AI Tutor, an expert engineering and computer science professor. "
            "Your goal is to help college students master technical concepts effectively for exams and interviews. "
            f"Context: Subject='{subject_name or 'General'}', Topic='{topic_name or 'General'}', "
            f"Student Proficiency Level={proficiency}/5, Weak Points={', '.join(weak_areas or ['None specified'])}. "
            "Format your answer with clear markdown headings, bullet points, and concise code snippets where applicable."
        )

        prompt = f"Student Request ({action_type}): {query}"
        
        response = client.models.generate_content(
            model=settings.AI_MODEL or "gemini-1.5-flash",
            contents=prompt,
            config={"system_instruction": system_instruction}
        )

        return {
            "response": response.text or "No response generated.",
            "action_type": action_type,
            "subject_name": subject_name,
            "topic_name": topic_name,
            "proficiency_context": f"Level {proficiency}/5",
            "is_fallback": False,
            "source": "gemini_ai"
        }
    except Exception as e:
        # Graceful fallback on any network or API issue
        fallback_text = get_fallback_explanation(query, subject_name, topic_name, proficiency, action_type)
        return {
            "response": fallback_text,
            "action_type": action_type,
            "subject_name": subject_name,
            "topic_name": topic_name,
            "proficiency_context": f"Level {proficiency}/5",
            "is_fallback": True,
            "source": "fallback_after_error"
        }
