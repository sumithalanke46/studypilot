from app.services.ai_service import ask_ai_tutor

def test_ai_tutor_offline_fallback():
    # Calling tutor without API key MUST return structured educational guidance without error
    res = ask_ai_tutor(
        query="Explain Deadlocks with a real-world scenario",
        subject_name="Operating Systems",
        topic_name="Deadlocks",
        proficiency=2,
        action_type="example"
    )
    assert res["is_fallback"] is True
    assert "Deadlocks" in res["response"]
    assert "Real-World" in res["response"]
    assert res["proficiency_context"] == "Level 2/5"

def test_ai_tutor_api_endpoint(client, auth_headers):
    response = client.post("/api/v1/ai-tutor/chat", headers=auth_headers, json={
        "query": "What are Coffman conditions?",
        "action_type": "explain"
    })
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 20
