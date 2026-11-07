import re
import secrets
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.status_history import StatusHistory
from app.schemas.booking import BookingCreate


def generate_ref_code() -> str:
    return "GLS-" + secrets.token_hex(3).upper()  # e.g. GLS-A3F9C1


def create_booking(db: Session, data: BookingCreate) -> Booking:
    dump = data.model_dump()
    valid_fields = {
        "company_name",
        "contact_person",
        "phone",
        "email",
        "pickup_city",
        "pickup_address",
        "delivery_city",
        "delivery_address",
        "load_type",
        "vehicle_type",
        "weight_tons",
        "material",
        "pickup_date",
        "notes",
    }
    filtered = {k: v for k, v in dump.items() if k in valid_fields}
    booking = Booking(**filtered, ref_code=generate_ref_code())
    db.add(booking)
    db.flush()
    db.add(
        StatusHistory(
            booking_id=booking.id,
            old_status=None,
            new_status="New",
            note="Booking request received",
            changed_by="customer",
        )
    )
    db.commit()
    db.refresh(booking)
    return booking


def get_booking(db: Session, booking_id: int) -> Optional[Booking]:
    return db.get(Booking, booking_id)


def get_booking_by_ref(db: Session, ref_code: str) -> Optional[Booking]:
    return db.scalars(
        select(Booking).where(Booking.ref_code == ref_code.strip().upper())
    ).first()


def list_bookings(
    db: Session,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Booking], int]:
    stmt = select(Booking)
    if status and status.lower() != "all":
        stmt = stmt.where(Booking.status == status)
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            (Booking.ref_code.ilike(term))
            | (Booking.company_name.ilike(term))
            | (Booking.contact_person.ilike(term))
            | (Booking.phone.ilike(term))
            | (Booking.pickup_city.ilike(term))
            | (Booking.delivery_city.ilike(term))
            | (Booking.driver_name.ilike(term))
            | (Booking.driver_phone.ilike(term))
            | (Booking.vehicle_number.ilike(term))
        )
    total_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(total_stmt) or 0

    stmt = stmt.order_by(Booking.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt).all()), total


def update_status(
    db: Session, booking: Booking, new_status: str, note: Optional[str], changed_by: str
) -> Booking:
    db.add(
        StatusHistory(
            booking_id=booking.id,
            old_status=booking.status,
            new_status=new_status,
            note=note,
            changed_by=changed_by,
        )
    )
    booking.status = new_status
    db.commit()
    db.refresh(booking)
    return booking


def set_invoice(
    db: Session,
    booking: Booking,
    total_amount: float,
    invoice_notes: Optional[str],
    changed_by: str,
) -> Booking:
    booking.total_amount = total_amount
    booking.invoice_notes = invoice_notes
    booking.invoice_sent_at = datetime.now()
    if booking.status == "New":
        booking.status = "Quoted"

    db.add(
        StatusHistory(
            booking_id=booking.id,
            old_status=booking.status,
            new_status=booking.status,
            note=f"Quotation / Invoice generated: ₹{total_amount:,.2f}" + (f" ({invoice_notes})" if invoice_notes else ""),
            changed_by=changed_by,
        )
    )
    db.commit()
    db.refresh(booking)
    return booking


def assign_driver(
    db: Session,
    booking: Booking,
    driver_name: str,
    driver_phone: str,
    vehicle_number: str,
    driver_notes: Optional[str],
    changed_by: str,
) -> Booking:
    booking.driver_name = driver_name
    booking.driver_phone = driver_phone
    booking.vehicle_number = vehicle_number
    booking.driver_notes = driver_notes
    booking.assigned_at = datetime.now()
    booking.status = "Vehicle Assigned"

    pickup_loc = booking.pickup_city + (f", {booking.pickup_address}" if booking.pickup_address else "")
    if not booking.current_location:
        booking.current_location = f"Loaded from Pickup: {pickup_loc}"
        booking.last_location_update = datetime.now()

    db.add(
        StatusHistory(
            booking_id=booking.id,
            old_status="Quoted" if booking.status == "Quoted" else booking.status,
            new_status="Vehicle Assigned",
            note=f"Driver Assigned: {driver_name} ({driver_phone}) • Vehicle: {vehicle_number} • Loaded from: {pickup_loc}" + (f" • Note: {driver_notes}" if driver_notes else ""),
            changed_by=changed_by,
        )
    )
    db.commit()
    db.refresh(booking)
    return booking


def get_bookings_by_driver_phone(db: Session, phone: str) -> list[Booking]:
    clean_phone = re.sub(r"[^\d]", "", phone)
    last_10 = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone

    # Search for bookings where driver_phone contains the 10 digits
    stmt = (
        select(Booking)
        .where(
            Booking.driver_phone.isnot(None),
            Booking.driver_phone.contains(last_10),
        )
        .order_by(Booking.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def resolve_place_from_coords(lat: float, lon: float) -> Optional[str]:
    import json
    import urllib.request
    # 1. Try Nominatim (OpenStreetMap)
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=16&addressdetails=1"
        req = urllib.request.Request(url, headers={"User-Agent": "GanrajLogistics/1.0", "Accept-Language": "en"})
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode())
            addr = data.get("address", {})
            locality = (
                addr.get("suburb")
                or addr.get("neighbourhood")
                or addr.get("residential")
                or addr.get("village")
                or addr.get("road")
                or addr.get("industrial")
            )
            city = (
                addr.get("city")
                or addr.get("town")
                or addr.get("county")
                or addr.get("city_district")
                or addr.get("district")
            )
            state = addr.get("state")
            parts = [p for p in [locality, city, state] if p]
            if parts:
                return ", ".join(parts)
            if data.get("display_name"):
                return ", ".join(data["display_name"].split(",")[:3]).strip()
    except Exception:
        pass

    # 2. Try BigDataCloud fallback
    try:
        url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode())
            parts = [
                data.get("locality"),
                data.get("city") if data.get("city") != data.get("locality") else None,
                data.get("principalSubdivision"),
            ]
            clean = [p for p in parts if p]
            if clean:
                return ", ".join(clean)
    except Exception:
        pass
    return None


def update_driver_location(
    db: Session,
    booking: Booking,
    location: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    status: Optional[str] = None,
    note: Optional[str] = None,
    driver_name: Optional[str] = None,
) -> Booking:
    # If location is a raw GPS string, automatically resolve to clean place name
    if (location.startswith("Live GPS:") or location.startswith("GPS:")) and latitude is not None and longitude is not None:
        resolved = resolve_place_from_coords(latitude, longitude)
        if resolved:
            location = resolved

    booking.current_location = location
    if latitude is not None:
        booking.current_latitude = latitude
    if longitude is not None:
        booking.current_longitude = longitude
    booking.last_location_update = datetime.now()

    old_status = booking.status
    if status and status in ("In Transit", "Delivered"):
        booking.status = status

    checkpoint_desc = f"Checkpoint: {location}"
    if note:
        checkpoint_desc += f" — {note}"

    db.add(
        StatusHistory(
            booking_id=booking.id,
            old_status=old_status,
            new_status=booking.status,
            note=checkpoint_desc,
            changed_by=driver_name or booking.driver_name or "Driver",
        )
    )
    db.commit()
    db.refresh(booking)
    return booking
