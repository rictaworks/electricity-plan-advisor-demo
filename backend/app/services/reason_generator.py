import json
import logging
import os
from app.config import settings
from app.models.plan import PlanMaster

logger = logging.getLogger(__name__)

_REASON_TEMPLATES_FILE = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "seed", "reason_templates.json"
)


class ReasonGenerator:
    def __init__(self) -> None:
        self.REASON_RULES = self._load_templates()

    def _load_templates(self) -> dict:
        try:
            with open(_REASON_TEMPLATES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("reason_templates.json not found, using defaults")
            return self._default_templates()

    def _default_templates(self) -> dict:
        return {
            "high_saving": "年間{saving}円の節約が見込めます（上位節約プラン）",
            "moderate_saving": "年間{saving}円の節約が見込めます",
            "night_time_based": "夜間割引が在宅パターンに最適です",
            "bank_discount": "口座振替割引が適用されます（月{discount}円引き）",
            "renewable": "再生可能エネルギー100%のエコプランです",
            "standard": "標準的な従量電灯プランです",
            "unsuitable_time_based": "昼間在宅が多い場合、夜間割引の効果が限定的です",
            "high_saving_threshold": 50000,
        }

    def check_unsuitable(
        self,
        plan: PlanMaster,
        stay_home_pattern: str,
    ) -> bool:
        if plan.has_time_based and stay_home_pattern == "morning":
            return True
        return False

    def generate(
        self,
        plan: PlanMaster,
        payment_method: str,
        stay_home_pattern: str,
        saving: float,
    ) -> str:
        if self.check_unsuitable(plan, stay_home_pattern):
            return self.REASON_RULES["unsuitable_time_based"]

        reasons = []

        threshold = self.REASON_RULES.get("high_saving_threshold", 50000)
        if saving >= threshold:
            reasons.append(
                self.REASON_RULES["high_saving"].format(saving=int(saving))
            )
        elif saving > 0:
            reasons.append(
                self.REASON_RULES["moderate_saving"].format(saving=int(saving))
            )

        if plan.has_time_based and stay_home_pattern in ("evening", "balanced"):
            reasons.append(self.REASON_RULES["night_time_based"])

        if plan.bank_discount > 0 and payment_method == "bank":
            reasons.append(
                self.REASON_RULES["bank_discount"].format(
                    discount=int(plan.bank_discount)
                )
            )

        if "グリーン" in plan.plan_name or "エコ" in plan.plan_name:
            reasons.append(self.REASON_RULES["renewable"])

        if not reasons:
            reasons.append(self.REASON_RULES["standard"])

        return "／".join(reasons)
