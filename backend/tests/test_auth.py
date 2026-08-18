def test_register_user(client):
    response = client.post("/api/v1/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane@example.com"
    assert "password_hash" not in data["user"]

def test_register_duplicate_email(client, test_user):
    response = client.post("/api/v1/auth/register", json={
        "name": "Duplicate User",
        "email": test_user.email,
        "password": "password123"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client, test_user):
    response = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_user.email

def test_login_invalid_password(client, test_user):
    response = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_current_user_me(client, auth_headers, test_user):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["name"] == test_user.name

def test_update_preferences(client, auth_headers):
    response = client.put("/api/v1/auth/preferences", headers=auth_headers, json={
        "daily_hours": 4.5,
        "preferred_start_time": "19:00",
        "max_session_mins": 45
    })
    assert response.status_code == 200
    data = response.json()
    assert data["daily_hours"] == 4.5
    assert data["preferred_start_time"] == "19:00"
    assert data["max_session_mins"] == 45
