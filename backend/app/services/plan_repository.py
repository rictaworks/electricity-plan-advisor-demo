import logging
from sqlalchemy.orm import Session as DBSession
from app.models.plan import PlanMaster

logger = logging.getLogger(__name__)


class PlanRepository:
    def get_all(self, db: DBSession) -> list[PlanMaster]:
        return db.query(PlanMaster).all()

    def get_by_code(self, db: DBSession, plan_code: str) -> PlanMaster | None:
        return db.query(PlanMaster).filter(PlanMaster.plan_code == plan_code).first()
