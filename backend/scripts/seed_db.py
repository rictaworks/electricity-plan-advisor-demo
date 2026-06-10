import json
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import settings
from app.database import SessionLocal, init_db
from app.models.plan import PlanMaster

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def load_json(filename: str) -> list:
    path = os.path.join(settings.SEED_DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_plan_master(db) -> None:
    existing = db.query(PlanMaster).count()
    if existing > 0:
        logger.info("plan_master already seeded (%d rows)", existing)
        return
    plans = load_json("plan_master.json")
    for p in plans:
        db.add(PlanMaster(**p))
    db.commit()
    logger.info("Seeded %d plans", len(plans))


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_plan_master(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
