import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.jobs.db_reset import DBResetJob
from app.routers import session, submit, result, admin
from scripts.seed_db import seed_plan_master
from app.database import SessionLocal

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_plan_master(db)
    finally:
        db.close()
    reset_job = DBResetJob()
    reset_job.start()
    yield
    reset_job.stop()


app = FastAPI(title="電力プラン自動提案API", lifespan=lifespan)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(submit.router)
app.include_router(result.router)
app.include_router(admin.router)
