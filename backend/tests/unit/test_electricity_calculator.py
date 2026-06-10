import pytest
from app.services.electricity_calculator import ElectricityCalculator
from app.config import settings


@pytest.fixture
def calc():
    return ElectricityCalculator()


@pytest.fixture
def standard_plan(sample_plan):
    return sample_plan


def test_calc_tiered_first_stage_only(calc, standard_plan):
    result = calc.calc_tiered(100.0, standard_plan)
    assert result == pytest.approx(100.0 * 29.80, rel=1e-3)


def test_calc_tiered_crosses_first_threshold(calc, standard_plan):
    kwh = 200.0
    expected = 120.0 * 29.80 + 80.0 * 36.40
    assert calc.calc_tiered(kwh, standard_plan) == pytest.approx(expected, rel=1e-3)


def test_calc_tiered_crosses_second_threshold(calc, standard_plan):
    kwh = 400.0
    expected = 120.0 * 29.80 + 180.0 * 36.40 + 100.0 * 40.69
    assert calc.calc_tiered(kwh, standard_plan) == pytest.approx(expected, rel=1e-3)


def test_calc_tiered_zero_kwh(calc, standard_plan):
    assert calc.calc_tiered(0.0, standard_plan) == 0.0


def test_apply_time_based_discount_evening_pattern(calc):
    cost = calc.apply_time_based_discount(1000.0, "evening", 0.20)
    assert cost == pytest.approx(800.0)


def test_apply_time_based_discount_morning_pattern_no_discount(calc):
    cost = calc.apply_time_based_discount(1000.0, "morning", 0.20)
    assert cost == pytest.approx(1000.0)


def test_apply_time_based_discount_balanced_pattern(calc):
    cost = calc.apply_time_based_discount(1000.0, "balanced", 0.30)
    assert cost == pytest.approx(700.0)


def test_apply_bank_discount_bank_payment(calc):
    annual = calc.apply_bank_discount(120000.0, "bank", 55.0)
    assert annual == pytest.approx(120000.0 - 55.0 * 12)


def test_apply_bank_discount_credit_payment(calc):
    annual = calc.apply_bank_discount(120000.0, "credit", 55.0)
    assert annual == pytest.approx(120000.0)


def test_add_renewable_surcharge_flag_on(calc):
    annual = calc.add_renewable_surcharge(100000.0, 3000.0, 1)
    expected = 100000.0 + 3000.0 * settings.RENEWABLE_SURCHARGE_RATE
    assert annual == pytest.approx(expected)


def test_add_renewable_surcharge_flag_off(calc):
    annual = calc.add_renewable_surcharge(100000.0, 3000.0, 0)
    assert annual == pytest.approx(100000.0)


def test_calculate_annual_total_regression(calc, standard_plan):
    monthly_kwh = [300.0] * 12
    result = calc.calculate(standard_plan, monthly_kwh, "credit", "balanced")
    assert result["annual_total"] > 0
    assert result["monthly_avg"] == pytest.approx(result["annual_total"] / 12, rel=1e-3)


def test_calculate_includes_renewable_surcharge(calc, standard_plan):
    monthly_kwh = [100.0] * 12
    result_with = calc.calculate(standard_plan, monthly_kwh, "credit", "balanced")
    standard_plan.renewable_surcharge = 0
    result_without = calc.calculate(standard_plan, monthly_kwh, "credit", "balanced")
    standard_plan.renewable_surcharge = 1
    assert result_with["annual_total"] > result_without["annual_total"]
