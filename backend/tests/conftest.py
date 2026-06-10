import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models.plan import PlanMaster

TEST_DATABASE_URL = "sqlite:///./test_electricity.db"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(test_engine):
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_plan() -> PlanMaster:
    return PlanMaster(
        id=1,
        plan_code="TEPCO_STD",
        company_name="東京電力エナジーパートナー",
        plan_name="従量電灯B（30A）",
        region="tokyo",
        ampere=30,
        base_fee=858.00,
        unit_price_1=29.80,
        threshold_1=120.0,
        unit_price_2=36.40,
        threshold_2=300.0,
        unit_price_3=40.69,
        has_time_based=0,
        night_discount_rate=0.0,
        bank_discount=55.0,
        renewable_surcharge=1,
        notes=None,
    )


@pytest.fixture
def time_based_plan() -> PlanMaster:
    return PlanMaster(
        id=4,
        plan_code="TEPCO_SMART",
        company_name="東京電力エナジーパートナー",
        plan_name="スマートライフS",
        region="tokyo",
        ampere=60,
        base_fee=1716.00,
        unit_price_1=26.48,
        threshold_1=120.0,
        unit_price_2=26.48,
        threshold_2=300.0,
        unit_price_3=26.48,
        has_time_based=1,
        night_discount_rate=0.20,
        bank_discount=55.0,
        renewable_surcharge=1,
        notes=None,
    )


@pytest.fixture
def seed_plans(db):
    import json
    import os
    from app.config import settings

    with open(os.path.join(settings.SEED_DATA_DIR, "plan_master.json"), "r") as f:
        plans_data = json.load(f)

    existing = db.query(PlanMaster).count()
    if existing == 0:
        for p in plans_data:
            db.add(PlanMaster(**p))
        db.commit()

    yield db.query(PlanMaster).all()
