from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.database import Base


class PlanMaster(Base):
    __tablename__ = "plan_master"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_code: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    plan_name: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, nullable=False)
    ampere: Mapped[int] = mapped_column(Integer, nullable=False)
    base_fee: Mapped[float] = mapped_column(Float, nullable=False)
    unit_price_1: Mapped[float] = mapped_column(Float, nullable=False)
    threshold_1: Mapped[float] = mapped_column(Float, nullable=False)
    unit_price_2: Mapped[float] = mapped_column(Float, nullable=False)
    threshold_2: Mapped[float] = mapped_column(Float, nullable=False)
    unit_price_3: Mapped[float] = mapped_column(Float, nullable=False)
    has_time_based: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    night_discount_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    bank_discount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    renewable_surcharge: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
