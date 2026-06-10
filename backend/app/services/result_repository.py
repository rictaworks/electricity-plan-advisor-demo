import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session as DBSession
from app.models.result import CalculationResult
from app.models.plan import PlanMaster

logger = logging.getLogger(__name__)


class ResultRepository:
    def save_results(
        self,
        session_id: str,
        ranked_results: list[dict],
        db: DBSession,
    ) -> None:
        db.query(CalculationResult).filter(
            CalculationResult.session_id == session_id
        ).delete()
        db.commit()

        now = datetime.now(timezone.utc)
        for r in ranked_results:
            plan: PlanMaster = r["plan"]
            result = CalculationResult(
                session_id=session_id,
                plan_id=plan.id,
                annual_total=r["annual_total"],
                monthly_avg=r["monthly_avg"],
                saving_vs_standard=r["saving_vs_standard"],
                recommendation_reason=r["recommendation_reason"],
                is_unsuitable=1 if r["is_unsuitable"] else 0,
                calculated_at=now,
            )
            db.add(result)
        db.commit()
        logger.info("Saved %d results for session %s", len(ranked_results), session_id)

    def get_results(
        self, session_id: str, db: DBSession
    ) -> list[tuple[CalculationResult, PlanMaster]]:
        rows = (
            db.query(CalculationResult, PlanMaster)
            .join(PlanMaster, CalculationResult.plan_id == PlanMaster.id)
            .filter(CalculationResult.session_id == session_id)
            .order_by(CalculationResult.annual_total)
            .all()
        )
        return rows
