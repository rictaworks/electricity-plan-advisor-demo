import json
import logging
import os
from app.config import settings

logger = logging.getLogger(__name__)


class UsageEstimator:
    def __init__(self) -> None:
        self._age_coefficients = self._load_json("age_coefficients.json")
        self._season_coefficients = self._load_json("season_coefficients.json")
        self._household_profiles = self._load_json("household_profiles.json")

        self._age_coeff_map: dict[str, float] = {
            row["age_group"]: row["coefficient"]
            for row in self._age_coefficients
        }
        self._season_coeff_map: dict[int, float] = {
            row["month"]: row["coefficient"]
            for row in self._season_coefficients
        }
        self._profile_map: dict[tuple[int, str], float] = {
            (row["member_count"], row["stay_home_pattern"]): row["base_kwh_monthly"]
            for row in self._household_profiles
        }
        self._extra_kwh_per_person = 65.0

    def _load_json(self, filename: str) -> list:
        path = os.path.join(settings.SEED_DATA_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _get_base_kwh(self, member_count: int, stay_home_pattern: str) -> float:
        if member_count <= 6:
            return self._profile_map[(member_count, stay_home_pattern)]
        base = self._profile_map[(6, stay_home_pattern)]
        return base + (member_count - 6) * self._extra_kwh_per_person

    def _get_age_coefficient(self, age_groups: list[str]) -> float:
        if not age_groups:
            return 1.0
        coeffs = [self._age_coeff_map.get(ag, 1.0) for ag in age_groups]
        return sum(coeffs) / len(coeffs)

    def estimate_month(
        self,
        member_count: int,
        age_groups: list[str],
        stay_home_pattern: str,
        month: int,
    ) -> float:
        base = self._get_base_kwh(member_count, stay_home_pattern)
        age_coeff = self._get_age_coefficient(age_groups)
        season_coeff = self._season_coeff_map.get(month, 1.0)
        return round(base * age_coeff * season_coeff, 2)

    def fill_missing(
        self,
        records: list[dict],
        member_count: int,
        age_groups: list[str],
        stay_home_pattern: str,
    ) -> list[dict]:
        filled = []
        for rec in records:
            new_rec = dict(rec)
            if new_rec.get("kwh_actual") is None:
                estimated = self.estimate_month(
                    member_count, age_groups, stay_home_pattern, rec["month"]
                )
                new_rec["kwh_estimated"] = estimated
                new_rec["kwh_used"] = estimated
            else:
                new_rec["kwh_estimated"] = None
                new_rec["kwh_used"] = new_rec["kwh_actual"]
            filled.append(new_rec)
        return filled
