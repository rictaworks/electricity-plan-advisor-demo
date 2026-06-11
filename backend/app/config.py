import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./electricity_advisor.db"
    SESSION_COOKIE_NAME: str = "session_id"
    SESSION_TTL_HOURS: int = 24
    UUID_V4_PATTERN: str = (
        r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    )
    RESET_HOUR_JST: int = 3
    RENEWABLE_SURCHARGE_RATE: float = 3.49
    STANDARD_PLAN_CODE: str = "TEPCO_STD"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    HONEYPOT_FIELD_NAME: str = "hp_field"
    MAX_MEMBER_COUNT: int = 8
    MIN_MEMBER_COUNT: int = 1
    MAX_KWH: float = 10000.0
    MIN_KWH: float = 0.0
    YEN_TO_KWH_APPROX_RATE: float = 30.0
    SEED_DATA_DIR: str = os.path.join(os.path.dirname(__file__), "..", "data", "seed")

    class Config:
        env_file = ".env"


settings = Settings()
