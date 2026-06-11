import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.config import settings
from app.database import get_db
from app.schemas.submit import SubmitResponse, RankedPlan
from app.services.session_manager import SessionManager
from app.services.result_repository import ResultRepository

logger = logging.getLogger(__name__)
router = APIRouter()

_session_manager = SessionManager()
_result_repository = ResultRepository()


@router.get("/api/result/{session_id}", response_model=SubmitResponse)
def get_result(
    session_id: str,
    db: DBSession = Depends(get_db),
) -> SubmitResponse:
    if not _session_manager.validate_uuid(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    rows = _result_repository.get_results(session_id, db)
    if not rows:
        raise HTTPException(status_code=404, detail="Result not found")

    ranking = [
        RankedPlan(
            rank=i + 1,
            plan_id=plan.id,
            plan_code=plan.plan_code,
            company_name=plan.company_name,
            plan_name=plan.plan_name,
            annual_total=result.annual_total,
            monthly_avg=result.monthly_avg,
            saving_vs_standard=result.saving_vs_standard,
            recommendation_reason=result.recommendation_reason,
            is_unsuitable=bool(result.is_unsuitable),
        )
        for i, (result, plan) in enumerate(rows)
    ]
    return SubmitResponse(session_id=session_id, ranking=ranking)
