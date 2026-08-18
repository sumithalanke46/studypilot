def test_subject_crud(client, auth_headers):
    # 1. Create subject
    create_res = client.post("/api/v1/subjects", headers=auth_headers, json={
        "name": "Distributed Systems",
        "description": "Consensus, Paxos, Raft, Vector Clocks",
        "difficulty": 4,
        "proficiency": 2,
        "color": "#6366F1"
    })
    assert create_res.status_code == 201
    sub_data = create_res.json()
    subject_id = sub_data["id"]
    assert sub_data["name"] == "Distributed Systems"

    # 2. List subjects
    list_res = client.get("/api/v1/subjects", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Create topic
    topic_res = client.post("/api/v1/topics", headers=auth_headers, json={
        "subject_id": subject_id,
        "name": "Raft Consensus Algorithm",
        "description": "Leader election, Log replication, Safety",
        "difficulty": 4,
        "proficiency": 2,
        "estimated_hours": 3.0
    })
    assert topic_res.status_code == 201
    topic_data = topic_res.json()
    topic_id = topic_data["id"]

    # 4. Toggle topic complete
    toggle_res = client.post(f"/api/v1/topics/{topic_id}/toggle-complete", headers=auth_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["completed"] is True

    # 5. Delete topic & subject
    del_topic_res = client.delete(f"/api/v1/topics/{topic_id}", headers=auth_headers)
    assert del_topic_res.status_code == 200

    del_sub_res = client.delete(f"/api/v1/subjects/{subject_id}", headers=auth_headers)
    assert del_sub_res.status_code == 200
