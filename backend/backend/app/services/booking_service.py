from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.models.booking import Booking
from app.schemas.booking import BookingCreate
from app.services import notification_service
from app.utils.constants import VALID_TRANSITIONS


def submit_booking(db: Session, data: BookingCreate) -> Booking:
    booking = crud.booking.create_booking(db, data)
    notification_service.notify_new_booking(
        booking.ref_code, booking.contact_person, booking.phone
    )
    return booking


def change_status(
    db: Session, booking_id: int, new_status: str, note: str | None, admin: str
) -> Booking:
    booking = crud.booking.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    allowed = VALID_TRANSITIONS.get(booking.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move booking from '{booking.status}' to '{new_status}'",
        )
    return crud.booking.update_status(db, booking, new_status, note, admin)
