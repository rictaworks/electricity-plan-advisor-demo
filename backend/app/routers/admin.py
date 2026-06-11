import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.jobs.db_reset import DBResetJob

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/admin/reset")
def admin_reset(db: DBSession = Depends(get_db)) -> dict:
    job = DBResetJob.__new__(DBResetJob)
    deleted = job.delete_all_sessions(db)
    logger.info("Manual DB reset: deleted %d sessions", deleted)
    return {"message": "reset complete", "deleted_sessions": deleted}


@router.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
