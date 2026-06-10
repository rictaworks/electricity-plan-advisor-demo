import logging
from app.models.plan import PlanMaster
from app.services.electricity_calculator import ElectricityCalculator

logger = logging.getLogger(__name__)


class RankingGenerator:
    def __init__(self) -> None:
        self._calculator = ElectricityCalculator()

    def generate(
        self,
        plans: list[PlanMaster],
        monthly_kwh: list[float],
        payment_method: str,
        stay_home_pattern: str,
        standard_annual: float,
    ) -> list[dict]:
        results = []
        for plan in plans:
            calc = self._calculator.calculate(
                plan, monthly_kwh, payment_method, stay_home_pattern
            )
            saving = round(standard_annual - calc["annual_total"], 2)
            results.append(
                {
                    "plan": plan,
                    "annual_total": calc["annual_total"],
                    "monthly_avg": calc["monthly_avg"],
                    "saving_vs_standard": saving,
                }
            )
        results.sort(key=lambda r: r["annual_total"])
        for i, r in enumerate(results, start=1):
            r["rank"] = i
        return results

    def get_standard_annual(
        self,
        standard_plan: PlanMaster,
        monthly_kwh: list[float],
        payment_method: str,
        stay_home_pattern: str,
    ) -> float:
        calc = self._calculator.calculate(
            standard_plan, monthly_kwh, payment_method, stay_home_pattern
        )
        return calc["annual_total"]
