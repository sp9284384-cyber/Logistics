import math
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, require_admin
from app.schemas.admin import AdminLogin, AdminUserOut, TokenOut
from app.schemas.booking import (
    AssignDriverRequest,
    BookingDetail,
    SendInvoiceRequest,
    StatusUpdate,
)
from app.schemas.status_history import StatusHistoryOut
from app.schemas.driver import DriverCreate, DriverUpdate
from app.services.auth_service import login as admin_login
from app.services.booking_service import change_status
from app.services.notification_service import send_invoice_email
from app.utils.constants import STATUSES

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=TokenOut)
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    identifier = payload.username or payload.email or ""
    admin_user, token = admin_login(db, identifier, payload.password)
    return TokenOut(
        access_token=token,
        token_type="bearer",
        admin=AdminUserOut(
            id=str(admin_user.id),
            username=admin_user.username,
            email=admin_user.email,
            name=admin_user.username,
        ),
    )


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    admin_username: str = Depends(require_admin),
):
    admin_user = crud.admin.get_admin_by_username(db, admin_username)
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {
        "admin": {
            "id": str(admin_user.id),
            "username": admin_user.username,
            "email": admin_user.email,
            "name": admin_user.username,
        }
    }


@router.post("/logout")
def logout(admin_username: str = Depends(require_admin)):
    return {"message": "Logged out successfully"}


@router.get("/bookings")
def list_bookings(
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: Optional[int] = Query(default=None, ge=1),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
) -> Any:
    if page is not None:
        actual_skip = (page - 1) * limit
    else:
        actual_skip = skip

    bookings, total = crud.booking.list_bookings(
        db, status=status, search=search, skip=actual_skip, limit=limit
    )

    items = [BookingDetail.model_validate(b) for b in bookings]

    if page is not None or search is not None:
        total_pages = max(1, math.ceil(total / limit)) if limit > 0 else 1
        return {
            "data": items,
            "pagination": {
                "page": page or 1,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
            },
            "statuses": STATUSES,
        }

    return items


@router.get("/bookings/{booking_id}", response_model=BookingDetail)
def get_booking_detail(
    booking_id: str,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    if booking_id.isdigit():
        booking = crud.booking.get_booking(db, int(booking_id))
    else:
        booking = crud.booking.get_booking_by_ref(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.patch("/bookings/{booking_id}/status", response_model=BookingDetail)
def update_booking_status(
    booking_id: str,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    if booking_id.isdigit():
        booking = crud.booking.get_booking(db, int(booking_id))
    else:
        booking = crud.booking.get_booking_by_ref(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return change_status(db, booking.id, payload.status, payload.note, admin)


@router.post("/bookings/{booking_id}/send-invoice")
def send_invoice(
    booking_id: str,
    payload: SendInvoiceRequest,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    if booking_id.isdigit():
        booking = crud.booking.get_booking(db, int(booking_id))
    else:
        booking = crud.booking.get_booking_by_ref(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    updated = crud.booking.set_invoice(
        db,
        booking,
        total_amount=payload.total_amount,
        invoice_notes=payload.invoice_notes,
        changed_by=admin,
    )

    email_result = send_invoice_email(
        booking=updated,
        total_amount=payload.total_amount,
        advance_amount=payload.advance_amount,
        tax_percent=payload.tax_percent,
        notes=payload.invoice_notes,
        payment_terms=payload.payment_terms,
    )

    return {
        "success": True,
        "message": f"Invoice of ₹{payload.total_amount:,.2f} recorded and dispatched to customer.",
        "booking": BookingDetail.model_validate(updated),
        "email_info": email_result,
    }


@router.post("/bookings/{booking_id}/assign-driver")
def assign_driver(
    booking_id: str,
    payload: AssignDriverRequest,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    if booking_id.isdigit():
        booking = crud.booking.get_booking(db, int(booking_id))
    else:
        booking = crud.booking.get_booking_by_ref(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    updated = crud.booking.assign_driver(
        db,
        booking,
        driver_name=payload.driver_name,
        driver_phone=payload.driver_phone,
        vehicle_number=payload.vehicle_number,
        driver_notes=payload.driver_notes,
        changed_by=admin,
    )

    return {
        "success": True,
        "message": f"Driver {payload.driver_name} assigned successfully. Driver can now login at /driver using mobile {payload.driver_phone}.",
        "booking": BookingDetail.model_validate(updated),
    }


@router.get(
    "/bookings/{booking_id}/history", response_model=list[StatusHistoryOut]
)
def get_booking_history(
    booking_id: str,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    if booking_id.isdigit():
        booking = crud.booking.get_booking(db, int(booking_id))
    else:
        booking = crud.booking.get_booking_by_ref(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking.history


# ---------------- DRIVER FLEET & CAPACITY MANAGEMENT ----------------
@router.get("/drivers")
def list_fleet_drivers(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    from app.crud.driver import list_drivers, get_driver_capacity_info

    drivers = list_drivers(db, status=status)
    results = []
    for d in drivers:
        cap_info = get_driver_capacity_info(db, d.phone, d.capacity_tons)
        results.append({
            "id": d.id,
            "name": d.name,
            "phone": d.phone,
            "vehicle_number": d.vehicle_number,
            "vehicle_type": d.vehicle_type,
            "capacity_tons": float(d.capacity_tons),
            "status": d.status,
            "license_number": d.license_number,
            "notes": d.notes,
            "current_location": d.current_location,
            "current_latitude": float(d.current_latitude) if d.current_latitude else None,
            "current_longitude": float(d.current_longitude) if d.current_longitude else None,
            "last_location_update": d.last_location_update.isoformat() if d.last_location_update else None,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "active_orders_count": cap_info["active_orders_count"],
            "current_load_tons": cap_info["current_load_tons"],
            "remaining_capacity_tons": cap_info["remaining_capacity_tons"],
        })
    return {"success": True, "drivers": results}


@router.post("/drivers")
def create_fleet_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    from app.crud.driver import get_driver_by_phone, create_driver, get_driver_capacity_info

    data = payload
    existing = get_driver_by_phone(db, data.phone)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Driver with mobile number {data.phone} is already registered in the fleet.",
        )
    driver = create_driver(db, data)
    cap_info = get_driver_capacity_info(db, driver.phone, driver.capacity_tons)
    return {
        "success": True,
        "message": f"Driver {driver.name} ({driver.vehicle_number}) added to fleet.",
        "driver": {
            "id": driver.id,
            "name": driver.name,
            "phone": driver.phone,
            "vehicle_number": driver.vehicle_number,
            "vehicle_type": driver.vehicle_type,
            "capacity_tons": float(driver.capacity_tons),
            "status": driver.status,
            "license_number": driver.license_number,
            "notes": driver.notes,
            "active_orders_count": cap_info["active_orders_count"],
            "current_load_tons": cap_info["current_load_tons"],
            "remaining_capacity_tons": cap_info["remaining_capacity_tons"],
        },
    }


@router.patch("/drivers/{driver_id}")
def update_fleet_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    from app.crud.driver import get_driver, update_driver, get_driver_capacity_info

    data = payload
    driver = get_driver(db, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    updated = update_driver(db, driver, data)
    cap_info = get_driver_capacity_info(db, updated.phone, updated.capacity_tons)
    return {
        "success": True,
        "message": f"Driver {updated.name} updated.",
        "driver": {
            "id": updated.id,
            "name": updated.name,
            "phone": updated.phone,
            "vehicle_number": updated.vehicle_number,
            "vehicle_type": updated.vehicle_type,
            "capacity_tons": float(updated.capacity_tons),
            "status": updated.status,
            "license_number": updated.license_number,
            "notes": updated.notes,
            "active_orders_count": cap_info["active_orders_count"],
            "current_load_tons": cap_info["current_load_tons"],
            "remaining_capacity_tons": cap_info["remaining_capacity_tons"],
        },
    }


@router.delete("/drivers/{driver_id}")
def delete_fleet_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(require_admin),
):
    from app.crud.driver import get_driver, delete_driver

    driver = get_driver(db, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    delete_driver(db, driver)
    return {"success": True, "message": f"Driver {driver.name} removed from fleet."}
