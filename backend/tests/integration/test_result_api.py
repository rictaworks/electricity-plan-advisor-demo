import pytest


VALID_PAYLOAD = {
    "hp_field": "",
    "member_count": 3,
    "age_groups": ["30代", "30代", "10代"],
    "stay_home_pattern": "evening",
    "payment_method": "credit",
    "usage_records": [
        {"year": 2024, "month": m, "kwh": 280.0}
        for m in range(1, 13)
    ],
}


def test_get_result_returns_cached_results(client, seed_plans):
    submit_res = client.post("/api/submit", json=VALID_PAYLOAD)
    session_id = submit_res.json()["session_id"]

    result_res = client.get(f"/api/result/{session_id}")
    assert result_res.status_code == 200
    data = result_res.json()
    assert len(data["ranking"]) == 20


def test_get_result_wrong_session_returns_404(client):
    import uuid
    fake_id = str(uuid.uuid4())
    response = client.get(f"/api/result/{fake_id}")
    assert response.status_code == 404


def test_get_result_invalid_session_id_returns_404(client):
    response = client.get("/api/result/not-a-uuid")
    assert response.status_code == 404
