def test_quiz_workflow(client, auth_headers):
    # 1. Create subject and topic
    sub_res = client.post("/api/v1/subjects", headers=auth_headers, json={
        "name": "Operating Systems",
        "difficulty": 4,
        "proficiency": 3
    })
    sub_id = sub_res.json()["id"]

    top_res = client.post("/api/v1/topics", headers=auth_headers, json={
        "subject_id": sub_id,
        "name": "Deadlocks",
        "difficulty": 4,
        "proficiency": 2,
        "estimated_hours": 3.0
    })
    top_id = top_res.json()["id"]

    # 2. Get quiz questions
    quiz_res = client.get(f"/api/v1/quizzes/topic/{top_id}?subject_id={sub_id}&count=3", headers=auth_headers)
    assert quiz_res.status_code == 200
    questions = quiz_res.json()
    assert len(questions) >= 1
    q1 = questions[0]
    assert "question_text" in q1
    assert len(q1["options"]) >= 2

    # 3. Submit answers
    submit_res = client.post("/api/v1/quizzes/submit", headers=auth_headers, json={
        "subject_id": sub_id,
        "topic_id": top_id,
        "answers": [
            {
                "question_id": q1["id"],
                "selected_option_index": 0
            }
        ]
    })
    assert submit_res.status_code == 200
    result = submit_res.json()
    assert "percentage" in result
    assert "answers_breakdown" in result
    assert result["total_questions"] == 1
