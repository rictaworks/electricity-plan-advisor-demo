import pytest
from app.services.ranking_generator import RankingGenerator
from app.models.plan import PlanMaster


@pytest.fixture
def generator():
    return RankingGenerator()


@pytest.fixture
def two_plans(sample_plan, time_based_plan):
    return [sample_plan, time_based_plan]


def test_generate_returns_all_results(generator, seed_plans):
    monthly_kwh = [300.0] * 12
    results = generator.generate(seed_plans, monthly_kwh, "credit", "balanced", 150000.0)
    assert len(results) == 20


def test_generate_sorted_ascending_by_annual(generator, seed_plans):
    monthly_kwh = [300.0] * 12
    results = generator.generate(seed_plans, monthly_kwh, "credit", "balanced", 150000.0)
    totals = [r["annual_total"] for r in results]
    assert totals == sorted(totals)


def test_generate_rank_starts_at_1(generator, seed_plans):
    monthly_kwh = [300.0] * 12
    results = generator.generate(seed_plans, monthly_kwh, "credit", "balanced", 150000.0)
    assert results[0]["rank"] == 1
    assert results[-1]["rank"] == 20


def test_calc_saving_positive_for_cheaper_plan(generator, seed_plans):
    monthly_kwh = [300.0] * 12
    standard_plan = next(p for p in seed_plans if p.plan_code == "TEPCO_STD")
    from app.services.electricity_calculator import ElectricityCalculator
    calc = ElectricityCalculator()
    std = calc.calculate(standard_plan, monthly_kwh, "credit", "balanced")
    results = generator.generate(seed_plans, monthly_kwh, "credit", "balanced", std["annual_total"])
    cheapest = results[0]
    assert cheapest["saving_vs_standard"] >= 0


def test_generate_standard_plan_saving_near_zero(generator, seed_plans):
    monthly_kwh = [300.0] * 12
    standard_plan = next(p for p in seed_plans if p.plan_code == "TEPCO_STD")
    from app.services.electricity_calculator import ElectricityCalculator
    calc = ElectricityCalculator()
    std = calc.calculate(standard_plan, monthly_kwh, "credit", "balanced")
    results = generator.generate(seed_plans, monthly_kwh, "credit", "balanced", std["annual_total"])
    std_result = next(r for r in results if r["plan"].plan_code == "TEPCO_STD")
    assert abs(std_result["saving_vs_standard"]) < 1.0
