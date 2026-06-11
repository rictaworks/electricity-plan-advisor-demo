import pytest


def test_get_session_first_time_returns_new_session(client):
    response = client.get("/api/session")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert len(data["session_id"]) == 36


def test_get_session_returns_cookie(client):
    response = client.get("/api/session")
    assert "session_id" in response.cookies


def test_health_returns_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
