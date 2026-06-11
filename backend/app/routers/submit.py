import json
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Cookie, Response, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.config import settings
from app.database import get_db
from app.models.household import HouseholdProfile
from app.models.usage import UsageRecord
from app.schemas.submit import SubmitRequest, SubmitResponse, RankedPlan
from app.services.session_manager import SessionManager
from app.services.usage_estimator import UsageEstimator
from app.services.plan_repository import PlanRepository
from app.services.ranking_generator import RankingGenerator
from app.services.reason_generator import ReasonGenerator
from app.services.result_repository import ResultRepository

logger = logging.getLogger(__name__)
router = APIRouter()

_session_manager = SessionManager()
_usage_estimator = UsageEstimator()
_plan_repository = PlanRepository()
_ranking_generator = RankingGenerator()
_reason_generator = ReasonGenerator()
_result_repository = ResultRepository()


@router.post("/api/submit", response_model=SubmitResponse)
def submit(
    body: SubmitRequest,
    response: Response,
    session_id: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE_NAME),
    db: DBSession = Depends(get_db),
) -> SubmitResponse:
    if body.hp_field:
        logger.warning("Honeypot triggered")
        return SubmitResponse(session_id="", ranking=[])

    sid = _session_manager.get_or_create(session_id, db)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=sid,
        httponly=True,
        samesite="lax",
        max_age=settings.SESSION_TTL_HOURS * 3600,
    )

    now = datetime.now(timezone.utc)

    db.query(HouseholdProfile).filter(HouseholdProfile.session_id == sid).delete()
    db.commit()
    profile = HouseholdProfile(
        session_id=sid,
        member_count=body.member_count,
        age_group_json=json.dumps(body.age_groups, ensure_ascii=False),
        stay_home_pattern=body.stay_home_pattern,
        payment_method=body.payment_method,
        created_at=now,
    )
    db.add(profile)
    db.commit()

    usage_dicts = []
    for u in body.usage_records:
        kwh_actual = u.kwh
        if kwh_actual is None and u.yen is not None:
            kwh_actual = round(u.yen / settings.YEN_TO_KWH_APPROX_RATE, 2)
        usage_dicts.append(
            {"year": u.year, "month": u.month, "kwh_actual": kwh_actual}
        )

    filled = _usage_estimator.fill_missing(
        usage_dicts,
        body.member_count,
        body.age_groups,
        body.stay_home_pattern,
    )

    db.query(UsageRecord).filter(UsageRecord.session_id == sid).delete()
    db.commit()
    for rec in filled:
        db.add(
            UsageRecord(
                session_id=sid,
                year=rec["year"],
                month=rec["month"],
                kwh_actual=rec.get("kwh_actual"),
                kwh_estimated=rec.get("kwh_estimated"),
                kwh_used=rec.get("kwh_used"),
                created_at=now,
            )
        )
    db.commit()

    monthly_kwh = [rec["kwh_used"] for rec in filled]

    plans = _plan_repository.get_all(db)
    if not plans:
        raise HTTPException(status_code=500, detail="Plan master data not found")

    standard_plan = _plan_repository.get_by_code(db, settings.STANDARD_PLAN_CODE)
    if standard_plan is None:
        standard_plan = plans[0]

    from app.services.electricity_calculator import ElectricityCalculator
    calc = ElectricityCalculator()
    std_result = calc.calculate(
        standard_plan, monthly_kwh, body.payment_method, body.stay_home_pattern
    )
    standard_annual = std_result["annual_total"]

    ranked = _ranking_generator.generate(
        plans, monthly_kwh, body.payment_method, body.stay_home_pattern, standard_annual
    )

    for r in ranked:
        r["is_unsuitable"] = _reason_generator.check_unsuitable(
            r["plan"], body.stay_home_pattern
        )
        r["recommendation_reason"] = _reason_generator.generate(
            r["plan"],
            body.payment_method,
            body.stay_home_pattern,
            r["saving_vs_standard"],
        )

    _result_repository.save_results(sid, ranked, db)

    ranking = [
        RankedPlan(
            rank=r["rank"],
            plan_id=r["plan"].id,
            plan_code=r["plan"].plan_code,
            company_name=r["plan"].company_name,
            plan_name=r["plan"].plan_name,
            annual_total=r["annual_total"],
            monthly_avg=r["monthly_avg"],
            saving_vs_standard=r["saving_vs_standard"],
            recommendation_reason=r["recommendation_reason"],
            is_unsuitable=r["is_unsuitable"],
        )
        for r in ranked
    ]
    return SubmitResponse(session_id=sid, ranking=ranking)
