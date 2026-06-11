import pytest
from app.services.usage_estimator import UsageEstimator


@pytest.fixture
def estimator():
    return UsageEstimator()


def test_estimate_month_returns_positive_kwh(estimator):
    result = estimator.estimate_month(4, ["30代", "30代"], "balanced", 6)
    assert result > 0


def test_estimate_month_summer_higher_than_spring(estimator):
    aug = estimator.estimate_month(4, ["30代"], "balanced", 8)
    may = estimator.estimate_month(4, ["30代"], "balanced", 5)
    assert aug > may


def test_estimate_month_more_members_higher_usage(estimator):
    four_people = estimator.estimate_month(4, ["30代"], "balanced", 6)
    two_people = estimator.estimate_month(2, ["30代"], "balanced", 6)
    assert four_people > two_people


def test_estimate_month_age_coefficient_elderly_higher(estimator):
    elderly = estimator.estimate_month(2, ["60代以上", "60代以上"], "balanced", 6)
    young = estimator.estimate_month(2, ["20代", "20代"], "balanced", 6)
    assert elderly > young


def test_fill_missing_fills_none_months(estimator):
    records = [{"year": 2024, "month": 1, "kwh_actual": None}]
    filled = estimator.fill_missing(records, 4, ["30代"], "balanced")
    assert filled[0]["kwh_used"] is not None
    assert filled[0]["kwh_used"] > 0


def test_fill_missing_preserves_actual_values(estimator):
    records = [{"year": 2024, "month": 1, "kwh_actual": 350.0}]
    filled = estimator.fill_missing(records, 4, ["30代"], "balanced")
    assert filled[0]["kwh_used"] == 350.0
    assert filled[0]["kwh_estimated"] is None


def test_fill_missing_all_12_months_filled(estimator):
    records = [{"year": 2024, "month": m, "kwh_actual": None} for m in range(1, 13)]
    filled = estimator.fill_missing(records, 3, ["30代"], "balanced")
    assert len(filled) == 12
    for rec in filled:
        assert rec["kwh_used"] is not None
        assert rec["kwh_used"] > 0


def test_fill_missing_partial_input(estimator):
    records = [
        {"year": 2024, "month": 1, "kwh_actual": 400.0},
        {"year": 2024, "month": 2, "kwh_actual": None},
        {"year": 2024, "month": 3, "kwh_actual": 300.0},
    ]
    filled = estimator.fill_missing(records, 2, ["30代", "40代"], "evening")
    assert filled[0]["kwh_used"] == 400.0
    assert filled[1]["kwh_used"] > 0
    assert filled[2]["kwh_used"] == 300.0
