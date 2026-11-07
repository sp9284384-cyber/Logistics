from datetime import datetime

from sqlalchemy import DateTime, Enum, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.constants import STATUSES


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    ref_code: Mapped[str] = mapped_column(
        String(12), unique=True, index=True
    )
    company_name: Mapped[str] = mapped_column(String(150))
    contact_person: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(15), index=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    pickup_city: Mapped[str] = mapped_column(String(100))
    pickup_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_city: Mapped[str] = mapped_column(String(100))
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    load_type: Mapped[str] = mapped_column(
        Enum("FTL", "Part Load", name="load_type"), index=True
    )
    vehicle_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    weight_tons: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    material: Mapped[str | None] = mapped_column(String(150), nullable=True)
    pickup_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(*STATUSES, name="booking_status"),
        default="New",
        server_default="New",
        index=True,
    )

    # Quotation & Invoice details
    total_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    invoice_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Assigned Driver details
    driver_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    driver_phone: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    vehicle_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    driver_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Real-time automated location tracking
    current_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_latitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    last_location_update: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    history = relationship(
        "StatusHistory", back_populates="booking",
        order_by="StatusHistory.id", cascade="all, delete-orphan",
    )
