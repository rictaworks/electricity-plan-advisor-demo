import logging
from app.config import settings
from app.models.plan import PlanMaster

logger = logging.getLogger(__name__)


class ElectricityCalculator:
    def calc_tiered(self, kwh: float, plan: PlanMaster) -> float:
        if kwh <= 0:
            return 0.0
        tier1 = min(kwh, plan.threshold_1) * plan.unit_price_1
        tier2 = max(0.0, min(kwh, plan.threshold_2) - plan.threshold_1) * plan.unit_price_2
        tier3 = max(0.0, kwh - plan.threshold_2) * plan.unit_price_3
        return tier1 + tier2 + tier3

    def apply_time_based_discount(
        self,
        monthly_cost: float,
        stay_home_pattern: str,
        discount_rate: float,
    ) -> float:
        if stay_home_pattern != "morning":
            return monthly_cost * (1.0 - discount_rate)
        return monthly_cost

    def apply_bank_discount(
        self,
        annual_cost: float,
        payment_method: str,
        bank_discount_per_month: float,
    ) -> float:
        if payment_method == "bank":
            return annual_cost - bank_discount_per_month * 12
        return annual_cost

    def add_renewable_surcharge(
        self,
        annual_cost: float,
        annual_kwh: float,
        surcharge_flag: int,
    ) -> float:
        if surcharge_flag == 1:
            return annual_cost + annual_kwh * settings.RENEWABLE_SURCHARGE_RATE
        return annual_cost

    def calculate(
        self,
        plan: PlanMaster,
        monthly_kwh: list[float],
        payment_method: str,
        stay_home_pattern: str,
    ) -> dict:
        monthly_costs = []
        for kwh in monthly_kwh:
            cost = plan.base_fee / 12 + self.calc_tiered(kwh, plan)
            if plan.has_time_based and plan.night_discount_rate > 0:
                cost = self.apply_time_based_discount(
                    cost, stay_home_pattern, plan.night_discount_rate
                )
            monthly_costs.append(cost)

        annual_total = sum(monthly_costs)
        annual_kwh = sum(monthly_kwh)

        annual_total = self.apply_bank_discount(
            annual_total, payment_method, plan.bank_discount
        )
        annual_total = self.add_renewable_surcharge(
            annual_total, annual_kwh, plan.renewable_surcharge
        )

        monthly_avg = annual_total / 12 if monthly_costs else 0.0
        return {
            "annual_total": round(annual_total, 2),
            "monthly_avg": round(monthly_avg, 2),
            "annual_kwh": round(annual_kwh, 2),
        }
