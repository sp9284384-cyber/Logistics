import re
from datetime import datetime
from typing import Any, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    computed_field,
    field_validator,
    model_validator,
)

from app.schemas.status_history import StatusHistoryOut
from app.utils.constants import STATUSES


class BookingCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    name: Optional[str] = None
    phone: str = Field(min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    pickup_city: Optional[str] = None
    pickupLocation: Optional[str] = None
    pickup_address: Optional[str] = None
    delivery_city: Optional[str] = None
    deliveryLocation: Optional[str] = None
    delivery_address: Optional[str] = None
    load_type: Optional[str] = Field(default=None, pattern="^(FTL|Part Load)$")
    vehicle_type: Optional[str] = None
    vehicleType: Optional[str] = None
    weight_tons: Optional[float] = Field(default=None, ge=0.1, le=100)
    quantity: Optional[str] = None
    material: Optional[str] = None
    materialType: Optional[str] = None
    pickup_date: Optional[datetime] = None
    pickupDate: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="before")
    @classmethod
    def harmonize_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        d = dict(data)

        # 1. Name / Company
        raw_name = (d.get("name") or d.get("contact_person") or d.get("company_name") or "Customer").strip()
        d.setdefault("contact_person", raw_name)
        d.setdefault("company_name", d.get("company_name") or raw_name)

        # 2. Pickup
        pickup = (d.get("pickupLocation") or d.get("pickup_city") or "").strip()
        if pickup:
            city = pickup.split(",")[0].strip()
            d.setdefault("pickup_city", city)
            if "," in pickup and not d.get("pickup_address"):
                d["pickup_address"] = pickup

        # 3. Delivery
        delivery = (d.get("deliveryLocation") or d.get("delivery_city") or "").strip()
        if delivery:
            city = delivery.split(",")[0].strip()
            d.setdefault("delivery_city", city)
            if "," in delivery and not d.get("delivery_address"):
                d["delivery_address"] = delivery

        # 4. Vehicle & Load type
        vehicle = (d.get("vehicleType") or d.get("vehicle_type") or "").strip()
        if vehicle:
            d.setdefault("vehicle_type", vehicle)
        load = (d.get("load_type") or "").strip()
        if not load:
            if "part" in vehicle.lower() or "mini" in vehicle.lower() or "ace" in vehicle.lower():
                d["load_type"] = "Part Load"
            else:
                d["load_type"] = "FTL"

        # 5. Material
        mat = (d.get("materialType") or d.get("material") or "").strip()
        if mat:
            d.setdefault("material", mat)

        # 6. Quantity / Weight
        qty = d.get("quantity")
        if qty and not d.get("weight_tons"):
            m = re.search(r"(\d+(?:\.\d+)?)", str(qty))
            if m:
                try:
                    val = float(m.group(1))
                    if 0.1 <= val <= 100:
                        d["weight_tons"] = val
                except Exception:
                    pass

        # 7. Pickup date
        p_date = d.get("pickupDate") or d.get("pickup_date")
        if p_date and isinstance(p_date, str):
            try:
                d["pickup_date"] = datetime.fromisoformat(p_date.replace("Z", "+00:00"))
            except Exception:
                try:
                    d["pickup_date"] = datetime.strptime(p_date[:10], "%Y-%m-%d")
                except Exception:
                    pass

        return d

    @field_validator("phone")
    @classmethod
    def phone_digits(cls, v: str) -> str:
        if not re.fullmatch(r"[+]?[0-9\s-]{10,15}", v):
            raise ValueError("phone must be 10-15 digits")
        return v.strip()

    @field_validator("pickup_city", "delivery_city")
    @classmethod
    def strip_city(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            return "All India"
        return v.strip().title()


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    ref_code: str
    company_name: str
    contact_person: str
    phone: str
    email: Optional[str] = None
    pickup_city: str
    delivery_city: str
    load_type: str
    vehicle_type: Optional[str] = None
    status: str
    created_at: datetime

    @computed_field
    @property
    def reference(self) -> str:
        return self.ref_code

    @computed_field
    @property
    def name(self) -> str:
        return self.contact_person or self.company_name

    @computed_field
    @property
    def pickupLocation(self) -> str:
        return self.pickup_city

    @computed_field
    @property
    def deliveryLocation(self) -> str:
        return self.delivery_city

    @computed_field
    @property
    def createdAt(self) -> str:
        return self.created_at.isoformat()


class BookingDetail(BookingOut):
    pickup_address: Optional[str] = None
    delivery_address: Optional[str] = None
    weight_tons: Optional[float] = None
    material: Optional[str] = None
    pickup_date: Optional[datetime] = None
    notes: Optional[str] = None
    history: list[StatusHistoryOut] = []

    # Invoice fields
    total_amount: Optional[float] = None
    invoice_notes: Optional[str] = None
    invoice_sent_at: Optional[datetime] = None

    # Driver fields
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_notes: Optional[str] = None
    assigned_at: Optional[datetime] = None

    # Live tracking fields
    current_location: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    last_location_update: Optional[datetime] = None

    @computed_field
    @property
    def materialType(self) -> str:
        return self.material or "General Goods"

    @computed_field
    @property
    def quantity(self) -> str:
        if self.weight_tons:
            return f"{self.weight_tons} Tons"
        return "Standard Load"

    @computed_field
    @property
    def vehicleType(self) -> str:
        return self.vehicle_type or self.load_type

    @computed_field
    @property
    def pickupDate(self) -> str:
        if self.pickup_date:
            return self.pickup_date.strftime("%Y-%m-%d")
        return self.created_at.strftime("%Y-%m-%d")

    @computed_field
    @property
    def totalAmount(self) -> Optional[float]:
        return float(self.total_amount) if self.total_amount is not None else None

    @computed_field
    @property
    def invoiceNotes(self) -> Optional[str]:
        return self.invoice_notes

    @computed_field
    @property
    def invoiceSentAt(self) -> Optional[str]:
        return self.invoice_sent_at.isoformat() if self.invoice_sent_at else None

    @computed_field
    @property
    def driverName(self) -> Optional[str]:
        return self.driver_name

    @computed_field
    @property
    def driverPhone(self) -> Optional[str]:
        return self.driver_phone

    @computed_field
    @property
    def vehicleNumber(self) -> Optional[str]:
        return self.vehicle_number

    @computed_field
    @property
    def driverNotes(self) -> Optional[str]:
        return self.driver_notes

    @computed_field
    @property
    def assignedAt(self) -> Optional[str]:
        return self.assigned_at.isoformat() if self.assigned_at else None

    @computed_field
    @property
    def currentLocation(self) -> Optional[str]:
        return self.current_location

    @computed_field
    @property
    def pickupLocation(self) -> str:
        return f"{self.pickup_city}, {self.pickup_address}" if self.pickup_address else self.pickup_city

    @computed_field
    @property
    def deliveryLocation(self) -> str:
        return f"{self.delivery_city}, {self.delivery_address}" if self.delivery_address else self.delivery_city

    @computed_field
    @property
    def pickupAddress(self) -> Optional[str]:
        return self.pickup_address

    @computed_field
    @property
    def deliveryAddress(self) -> Optional[str]:
        return self.delivery_address

    @computed_field
    @property
    def customerNotes(self) -> Optional[str]:
        return self.notes

    @computed_field
    @property
    def lastLocationUpdate(self) -> Optional[str]:
        return self.last_location_update.isoformat() if self.last_location_update else None


class StatusUpdate(BaseModel):
    status: str = Field(pattern="^(" + "|".join(STATUSES) + ")$")
    note: Optional[str] = Field(default=None, max_length=255)


class SendInvoiceRequest(BaseModel):
    total_amount: float = Field(..., gt=0, description="Total quoted/invoice amount in INR")
    advance_amount: Optional[float] = Field(default=None, ge=0)
    tax_percent: Optional[float] = Field(default=18.0, ge=0)
    invoice_notes: Optional[str] = Field(default=None, max_length=1000)
    payment_terms: Optional[str] = Field(default="50% Advance on loading, 50% on delivery", max_length=500)


class AssignDriverRequest(BaseModel):
    driver_name: str = Field(..., min_length=2, max_length=100)
    driver_phone: str = Field(..., min_length=10, max_length=15)
    vehicle_number: str = Field(..., min_length=4, max_length=30)
    driver_notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("driver_phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        digits = re.sub(r"[^\d+]", "", v)
        if len(digits) < 10:
            raise ValueError("Driver phone must be at least 10 digits")
        return digits


class DriverLoginRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class DriverLocationUpdate(BaseModel):
    phone: str
    booking_id_or_ref: Optional[str] = None
    location: str
    status: Optional[str] = Field(default=None, pattern="^(In Transit|Delivered)$")
    note: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
