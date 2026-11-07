import re
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.booking import Booking
from app.schemas.driver import DriverCreate, DriverUpdate


def normalize_phone(phone: str) -> str:
    clean = re.sub(r"[^\d]", "", phone)
    return clean[-10:] if len(clean) >= 10 else clean


def get_driver(db: Session, driver_id: int) -> Optional[Driver]:
    return db.get(Driver, driver_id)


def get_driver_by_phone(db: Session, phone: str) -> Optional[Driver]:
    clean = normalize_phone(phone)
    stmt = select(Driver).where(Driver.phone.contains(clean))
    return db.scalars(stmt).first()


def list_drivers(db: Session, status: Optional[str] = None) -> list[Driver]:
    stmt = select(Driver)
    if status and status != "all":
        stmt = stmt.where(Driver.status == status)
    stmt = stmt.order_by(Driver.name.asc())
    return list(db.scalars(stmt).all())


def get_driver_capacity_info(db: Session, driver_phone: str, total_capacity: float) -> dict:
    clean = normalize_phone(driver_phone)
    if not clean:
        return {"active_orders_count": 0, "current_load_tons": 0.0, "remaining_capacity_tons": float(total_capacity)}

    # Active bookings currently loaded or on trip
    stmt = (
        select(Booking)
        .where(
            Booking.driver_phone.isnot(None),
            Booking.driver_phone.contains(clean),
            Booking.status.in_(["Vehicle Assigned", "In Transit"]),
        )
    )
    active_bookings = list(db.scalars(stmt).all())
    
    current_load = 0.0
    for b in active_bookings:
        if b.weight_tons is not None:
            current_load += float(b.weight_tons)
        else:
            # Estimate from load type if weight_tons is not specified
            current_load += 5.0 if b.load_type == "FTL" else 2.0

    remaining = max(0.0, float(total_capacity) - current_load)
    return {
        "active_orders_count": len(active_bookings),
        "current_load_tons": round(current_load, 2),
        "remaining_capacity_tons": round(remaining, 2),
    }


def create_driver(db: Session, data: DriverCreate) -> Driver:
    clean = normalize_phone(data.phone)
    driver = Driver(
        name=data.name.strip(),
        phone=clean,
        vehicle_number=data.vehicle_number.strip().upper(),
        vehicle_type=data.vehicle_type.strip(),
        capacity_tons=float(data.capacity_tons),
        status=data.status,
        license_number=data.license_number.strip() if data.license_number else None,
        notes=data.notes.strip() if data.notes else None,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def update_driver(db: Session, driver: Driver, data: DriverUpdate) -> Driver:
    if data.name is not None:
        driver.name = data.name.strip()
    if data.phone is not None:
        driver.phone = normalize_phone(data.phone)
    if data.vehicle_number is not None:
        driver.vehicle_number = data.vehicle_number.strip().upper()
    if data.vehicle_type is not None:
        driver.vehicle_type = data.vehicle_type.strip()
    if data.capacity_tons is not None:
        driver.capacity_tons = float(data.capacity_tons)
    if data.status is not None:
        driver.status = data.status
    if data.license_number is not None:
        driver.license_number = data.license_number.strip() if data.license_number else None
    if data.notes is not None:
        driver.notes = data.notes.strip() if data.notes else None

    db.commit()
    db.refresh(driver)
    return driver


def delete_driver(db: Session, driver: Driver) -> None:
    db.delete(driver)
    db.commit()


def get_available_orders_for_capacity(db: Session, remaining_capacity: float) -> list[Booking]:
    # Orders that are either New or Quoted and not yet assigned a driver
    stmt = (
        select(Booking)
        .where(
            Booking.status.in_(["New", "Quoted"]),
            Booking.driver_phone.is_(None),
        )
        .order_by(Booking.created_at.desc())
    )
    orders = list(db.scalars(stmt).all())
    eligible = []
    for order in orders:
        order_weight = float(order.weight_tons) if order.weight_tons is not None else 5.0
        if order_weight <= remaining_capacity:
            eligible.append(order)
    return eligible
