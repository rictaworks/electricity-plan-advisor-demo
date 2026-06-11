import logging
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.config import settings
from app.database import SessionLocal
from app.models.result import CalculationResult
from app.models.usage import UsageRecord
from app.models.household import HouseholdProfile
from app.models.session import Session

logger = logging.getLogger(__name__)


class DBResetJob:
    def __init__(self) -> None:
        self.reset_time_jst = f"{settings.RESET_HOUR_JST:02d}:00"
        self._scheduler = AsyncIOScheduler(timezone=pytz.timezone("Asia/Tokyo"))
        self._scheduler.add_job(
            self.run,
            "cron",
            hour=settings.RESET_HOUR_JST,
            minute=0,
        )

    def start(self) -> None:
        self._scheduler.start()
        logger.info("DBResetJob scheduler started (JST %s)", self.reset_time_jst)

    def stop(self) -> None:
        self._scheduler.shutdown(wait=False)
        logger.info("DBResetJob scheduler stopped")

    def run(self) -> None:
        db = SessionLocal()
        try:
            deleted = self.delete_all_sessions(db)
            logger.info("DBReset: deleted %d sessions", deleted)
        except Exception:
            logger.exception("DBReset failed")
            db.rollback()
        finally:
            db.close()

    def delete_all_sessions(self, db) -> int:
        db.query(CalculationResult).delete()
        db.query(UsageRecord).delete()
        db.query(HouseholdProfile).delete()
        count = db.query(Session).count()
        db.query(Session).delete()
        db.commit()
        return count
