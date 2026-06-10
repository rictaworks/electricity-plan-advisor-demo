import pytest


def test_admin_reset_returns_success(client):
    response = client.post("/api/admin/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "reset complete"
    assert "deleted_sessions" in data
