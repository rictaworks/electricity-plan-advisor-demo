import pytest
from app.services.reason_generator import ReasonGenerator
from app.models.plan import PlanMaster


@pytest.fixture
def generator():
    return ReasonGenerator()


def test_generate_uses_template_not_hardcoded(generator):
    templates = generator.REASON_RULES
    assert "high_saving" in templates
    assert "unsuitable_time_based" in templates
    assert "{saving}" in templates["high_saving"]


def test_check_unsuitable_time_based_morning_returns_true(generator, time_based_plan):
    assert generator.check_unsuitable(time_based_plan, "morning") is True


def test_check_unsuitable_time_based_evening_returns_false(generator, time_based_plan):
    assert generator.check_unsuitable(time_based_plan, "evening") is False


def test_check_unsuitable_non_time_based_any_pattern(generator, sample_plan):
    assert generator.check_unsuitable(sample_plan, "morning") is False
    assert generator.check_unsuitable(sample_plan, "evening") is False


def test_generate_unsuitable_returns_unsuitable_reason(generator, time_based_plan):
    reason = generator.generate(time_based_plan, "bank", "morning", 10000.0)
    assert reason == generator.REASON_RULES["unsuitable_time_based"]


def test_generate_high_saving_plan(generator, sample_plan):
    reason = generator.generate(sample_plan, "credit", "balanced", 60000.0)
    assert "節約" in reason
    assert "60000" in reason


def test_generate_bank_discount_reason(generator, sample_plan):
    reason = generator.generate(sample_plan, "bank", "balanced", 1000.0)
    assert "口座振替" in reason


def test_generate_night_time_based_evening_reason(generator, time_based_plan):
    reason = generator.generate(time_based_plan, "credit", "evening", 1000.0)
    assert "夜間" in reason


def test_generate_no_saving_returns_standard(generator, sample_plan):
    sample_plan_no_saving = PlanMaster(
        id=99,
        plan_code="EXPENSIVE",
        company_name="高いでんき",
        plan_name="高いプラン",
        region="tokyo",
        ampere=30,
        base_fee=858.0,
        unit_price_1=29.80,
        threshold_1=120.0,
        unit_price_2=36.40,
        threshold_2=300.0,
        unit_price_3=40.69,
        has_time_based=0,
        night_discount_rate=0.0,
        bank_discount=0.0,
        renewable_surcharge=1,
        notes=None,
    )
    reason = generator.generate(sample_plan_no_saving, "credit", "balanced", -5000.0)
    assert reason == generator.REASON_RULES["standard"]
