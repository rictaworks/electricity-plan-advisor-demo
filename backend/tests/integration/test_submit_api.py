import pytest


VALID_PAYLOAD = {
    "hp_field": "",
    "member_count": 4,
    "age_groups": ["30代", "30代", "10代", "10代"],
    "stay_home_pattern": "balanced",
    "payment_method": "bank",
    "usage_records": [
        {"year": 2024, "month": m, "kwh": 300.0}
        for m in range(1, 13)
    ],
}


def test_submit_full_input_returns_200(client, seed_plans):
    response = client.post("/api/submit", json=VALID_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert "ranking" in data
    assert len(data["ranking"]) == 20


def test_submit_partial_input_triggers_estimation(client, seed_plans):
    payload = dict(VALID_PAYLOAD)
    payload["usage_records"] = [
        {"year": 2024, "month": 1, "kwh": 400.0},
    ]
    response = client.post("/api/submit", json=payload)
    assert response.status_code == 200


def test_submit_no_input_triggers_full_estimation(client, seed_plans):
    payload = dict(VALID_PAYLOAD)
    payload["usage_records"] = []
    response = client.post("/api/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["ranking"]) == 20


def test_submit_honeypot_returns_empty_ranking(client, seed_plans):
    payload = dict(VALID_PAYLOAD)
    payload["hp_field"] = "bot_value"
    response = client.post("/api/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ranking"] == []


def test_submit_invalid_member_count_returns_422(client):
    payload = dict(VALID_PAYLOAD)
    payload["member_count"] = 9
    response = client.post("/api/submit", json=payload)
    assert response.status_code == 422


def test_submit_invalid_kwh_returns_422(client):
    payload = dict(VALID_PAYLOAD)
    payload["usage_records"] = [{"year": 2024, "month": 1, "kwh": -1.0}]
    response = client.post("/api/submit", json=payload)
    assert response.status_code == 422


def test_submit_ranking_sorted_by_annual(client, seed_plans):
    response = client.post("/api/submit", json=VALID_PAYLOAD)
    data = response.json()
    totals = [r["annual_total"] for r in data["ranking"]]
    assert totals == sorted(totals)


def test_submit_ranking_has_required_fields(client, seed_plans):
    response = client.post("/api/submit", json=VALID_PAYLOAD)
    data = response.json()
    first = data["ranking"][0]
    required = ["rank", "plan_code", "company_name", "plan_name",
                "annual_total", "monthly_avg", "saving_vs_standard",
                "recommendation_reason", "is_unsuitable"]
    for field in required:
        assert field in first, f"Missing field: {field}"
