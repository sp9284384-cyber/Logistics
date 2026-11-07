from datetime import datetime
from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    vehicle_number: Mapped[str] = mapped_column(String(30), index=True)
    vehicle_type: Mapped[str] = mapped_column(String(50), default="32ft Multi-Axle")
    capacity_tons: Mapped[float] = mapped_column(Numeric(8, 2), default=15.0)
    status: Mapped[str] = mapped_column(String(30), default="Available")  # Available, On Trip, Off Duty
    license_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    current_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_latitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    last_location_update: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
