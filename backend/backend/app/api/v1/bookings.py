from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db
from app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingOut,
    DriverLocationUpdate,
    DriverLoginRequest,
)
from app.services.booking_service import change_status, submit_booking

router = APIRouter(prefix="/bookings", tags=["bookings"])


class DriverStatusUpdate(BaseModel):
    status: str = Field(pattern="^(Vehicle Assigned|In Transit|Delivered)$")
    driver_name: Optional[str] = "Driver"
    note: Optional[str] = None
    location: Optional[str] = None


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    return submit_booking(db, payload)


@router.get("/track")
def track_booking(reference: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    clean_ref = reference.strip()
    booking = crud.booking.get_booking_by_ref(db, clean_ref)
    if not booking:
        import re
        from sqlalchemy import select
        from app.models.booking import Booking
        digits = re.sub(r"[^\d]", "", clean_ref)
        if len(digits) >= 10:
            last_10 = digits[-10:]
            booking = db.scalars(
                select(Booking).where(Booking.phone.contains(last_10)).order_by(Booking.created_at.desc())
            ).first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail=f"No shipment found matching reference or phone '{reference}'."
        )
    return {
        "data": {
            "id": booking.id,
            "reference": booking.ref_code,
            "status": booking.status,
            "customerName": booking.contact_person or booking.company_name,
            "phone": booking.phone,
            "pickupLocation": booking.pickup_city + (f", {booking.pickup_address}" if booking.pickup_address else ""),
            "deliveryLocation": booking.delivery_city + (f", {booking.delivery_address}" if booking.delivery_address else ""),
            "pickupCity": booking.pickup_city,
            "pickupAddress": booking.pickup_address,
            "deliveryCity": booking.delivery_city,
            "deliveryAddress": booking.delivery_address,
            "customerNotes": booking.notes,
            "driverNotes": booking.driver_notes,
            "materialType": booking.material or "General Cargo",
            "quantity": f"{booking.weight_tons} Tons" if booking.weight_tons else "Standard",
            "vehicleType": booking.vehicle_type or booking.load_type,
            "pickupDate": (
                booking.pickup_date.strftime("%Y-%m-%d")
                if booking.pickup_date
                else booking.created_at.strftime("%Y-%m-%d")
            ),
            "totalAmount": float(booking.total_amount) if booking.total_amount else None,
            "driverName": booking.driver_name,
            "driverPhone": booking.driver_phone,
            "vehicleNumber": booking.vehicle_number,
            "currentLocation": booking.current_location,
            "lastLocationUpdate": booking.last_location_update.isoformat() if booking.last_location_update else None,
            "createdAt": booking.created_at.isoformat(),
            "history": [
                {
                    "toStatus": h.new_status,
                    "note": h.note,
                    "createdAt": h.created_at.isoformat(),
                }
                for h in booking.history
            ],
        }
    }


# Driver Portal Authentication & Trip Access via Registered Mobile Number
@router.post("/driver/login")
def driver_login(payload: DriverLoginRequest, db: Session = Depends(get_db)):
    from app.crud.driver import get_driver_by_phone, get_driver_capacity_info, get_available_orders_for_capacity

    driver = get_driver_by_phone(db, payload.phone)
    bookings = crud.booking.get_bookings_by_driver_phone(db, payload.phone)

    if not driver and not bookings:
        raise HTTPException(
            status_code=404,
            detail=f"Mobile number {payload.phone} is not registered in the driver fleet or assigned to any bookings. Please ask admin to add your driver profile.",
        )

    driver_name = driver.name if driver else (bookings[0].driver_name or "Driver")
    total_cap = float(driver.capacity_tons) if driver else 15.0
    cap_info = get_driver_capacity_info(db, payload.phone, total_cap)
    
    # Available open orders that can fit within driver's remaining capacity
    available_orders = get_available_orders_for_capacity(db, cap_info["remaining_capacity_tons"])

    items = [BookingDetail.model_validate(b) for b in bookings]
    return {
        "success": True,
        "phone": payload.phone,
        "driverName": driver_name,
        "driverProfile": {
            "name": driver_name,
            "vehicle_number": driver.vehicle_number if driver else (bookings[0].vehicle_number if bookings else "Assigned"),
            "vehicle_type": driver.vehicle_type if driver else "Truck",
            "capacity_tons": total_cap,
            "current_load_tons": cap_info["current_load_tons"],
            "remaining_capacity_tons": cap_info["remaining_capacity_tons"],
            "status": driver.status if driver else "Available",
        },
        "trips": items,
        "availableOrders": [BookingDetail.model_validate(o) for o in available_orders],
    }


@router.get("/driver/available-orders")
def get_driver_available_orders(phone: str = Query(...), db: Session = Depends(get_db)):
    from app.crud.driver import get_driver_by_phone, get_driver_capacity_info, get_available_orders_for_capacity

    driver = get_driver_by_phone(db, phone)
    total_cap = float(driver.capacity_tons) if driver else 15.0
    cap_info = get_driver_capacity_info(db, phone, total_cap)
    orders = get_available_orders_for_capacity(db, cap_info["remaining_capacity_tons"])
    return {
        "success": True,
        "remaining_capacity_tons": cap_info["remaining_capacity_tons"],
        "orders": [BookingDetail.model_validate(o) for o in orders],
    }


from app.schemas.driver import ClaimOrderRequest


@router.post("/driver/claim-order")
def driver_claim_order(payload: ClaimOrderRequest, db: Session = Depends(get_db)):
    from app.crud.driver import get_driver_by_phone, get_driver_capacity_info

    req = payload
    driver = get_driver_by_phone(db, req.phone)
    if not driver:
        driver_phone = req.phone
        driver_name = "Driver"
        vehicle_num = "Assigned"
        total_cap = 15.0
    else:
        driver_phone = driver.phone
        driver_name = driver.name
        vehicle_num = driver.vehicle_number
        total_cap = float(driver.capacity_tons)

    if req.booking_id_or_ref.isdigit():
        booking = crud.booking.get_booking(db, int(req.booking_id_or_ref))
    else:
        booking = crud.booking.get_booking_by_ref(db, req.booking_id_or_ref)

    if not booking:
        raise HTTPException(status_code=404, detail="Order not found")

    if booking.driver_phone and booking.driver_phone != driver_phone:
        raise HTTPException(status_code=400, detail="This order has already been assigned to another driver.")

    # Check capacity fit
    cap_info = get_driver_capacity_info(db, driver_phone, total_cap)
    order_weight = float(booking.weight_tons) if booking.weight_tons is not None else 5.0
    if order_weight > cap_info["remaining_capacity_tons"]:
        raise HTTPException(
            status_code=400,
            detail=f"This order ({order_weight}T) exceeds your remaining truck capacity ({cap_info['remaining_capacity_tons']}T left).",
        )

    # Assign order to driver
    updated = crud.booking.assign_driver(
        db,
        booking,
        driver_name=driver_name,
        driver_phone=driver_phone,
        vehicle_number=vehicle_num,
        driver_notes=req.note or f"Claimed directly by driver {driver_name} (Space remaining: {cap_info['remaining_capacity_tons'] - order_weight:.1f}T)",
        changed_by=driver_name,
    )

    if driver and driver.status == "Available":
        driver.status = "On Trip"
        db.commit()

    return {
        "success": True,
        "message": f"Order {booking.ref_code} assigned to your truck! You can now start the trip or post checkpoints.",
        "booking": BookingDetail.model_validate(updated),
    }


@router.get("/driver/trips")
def get_driver_trips(phone: str = Query(...), db: Session = Depends(get_db)):
    bookings = crud.booking.get_bookings_by_driver_phone(db, phone)
    return {
        "success": True,
        "trips": [BookingDetail.model_validate(b) for b in bookings],
    }


@router.post("/driver/update-location")
def driver_update_location(payload: DriverLocationUpdate, db: Session = Depends(get_db)):
    bookings = crud.booking.get_bookings_by_driver_phone(db, payload.phone)
    if not bookings:
        raise HTTPException(status_code=404, detail="No booking found for this driver phone.")

    target_booking = None
    if payload.booking_id_or_ref:
        for b in bookings:
            if str(b.id) == str(payload.booking_id_or_ref) or b.ref_code == payload.booking_id_or_ref.upper():
                target_booking = b
                break
    if not target_booking:
        target_booking = bookings[0]

    updated = crud.booking.update_driver_location(
        db,
        target_booking,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status=payload.status,
        note=payload.note,
        driver_name=target_booking.driver_name or "Driver",
    )

    return {
        "success": True,
        "message": f"Location updated to '{payload.location}'" + (f" and status moved to {payload.status}" if payload.status else ""),
        "booking": BookingDetail.model_validate(updated),
    }


@router.post("/{booking_id_or_ref}/driver-update", response_model=BookingDetail)
def driver_update_status(
    booking_id_or_ref: str,
    payload: DriverStatusUpdate,
    db: Session = Depends(get_db),
):
    if booking_id_or_ref.isdigit():
        booking = crud.booking.get_booking(db, int(booking_id_or_ref))
    else:
        booking = crud.booking.get_booking_by_ref(db, booking_id_or_ref)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    note_text = payload.note or f"Updated by driver ({payload.driver_name})"
    if payload.location:
        note_text += f" • Location: {payload.location}"
    return change_status(db, booking.id, payload.status, note_text, payload.driver_name or "Driver")


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    if booking_id.isdigit():
        booking = crud.booking.get_booking(db, int(booking_id))
    else:
        booking = crud.booking.get_booking_by_ref(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
