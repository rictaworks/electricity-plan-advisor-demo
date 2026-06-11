from pydantic import BaseModel, field_validator
from typing import Optional
from app.config import settings


class MonthlyUsage(BaseModel):
    year: int
    month: int
    kwh: Optional[float] = None
    yen: Optional[float] = None

    @field_validator("month")
    @classmethod
    def validate_month(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("month must be between 1 and 12")
        return v

    @field_validator("kwh")
    @classmethod
    def validate_kwh(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < settings.MIN_KWH or v > settings.MAX_KWH):
            raise ValueError(
                f"kwh must be between {settings.MIN_KWH} and {settings.MAX_KWH}"
            )
        return v


class SubmitRequest(BaseModel):
    hp_field: str = ""
    member_count: int
    age_groups: list[str]
    stay_home_pattern: str
    payment_method: str
    usage_records: list[MonthlyUsage]

    @field_validator("member_count")
    @classmethod
    def validate_member_count(cls, v: int) -> int:
        if v < settings.MIN_MEMBER_COUNT or v > settings.MAX_MEMBER_COUNT:
            raise ValueError(
                f"member_count must be between {settings.MIN_MEMBER_COUNT} and {settings.MAX_MEMBER_COUNT}"
            )
        return v

    @field_validator("stay_home_pattern")
    @classmethod
    def validate_stay_home_pattern(cls, v: str) -> str:
        allowed = {"morning", "evening", "balanced"}
        if v not in allowed:
            raise ValueError(f"stay_home_pattern must be one of {allowed}")
        return v

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, v: str) -> str:
        allowed = {"bank", "credit"}
        if v not in allowed:
            raise ValueError(f"payment_method must be one of {allowed}")
        return v


class RankedPlan(BaseModel):
    rank: int
    plan_id: int
    plan_code: str
    company_name: str
    plan_name: str
    annual_total: float
    monthly_avg: float
    saving_vs_standard: float
    recommendation_reason: str
    is_unsuitable: bool


class SubmitResponse(BaseModel):
    session_id: str
    ranking: list[RankedPlan]
