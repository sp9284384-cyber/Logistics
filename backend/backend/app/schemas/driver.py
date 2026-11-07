from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DriverBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    vehicle_number: str = Field(..., min_length=4, max_length=30)
    vehicle_type: str = Field(default="32ft Multi-Axle", max_length=50)
    capacity_tons: float = Field(default=15.0, gt=0.0, le=100.0)
    status: str = Field(default="Available", max_length=30)
    license_number: Optional[str] = None
    notes: Optional[str] = None


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    capacity_tons: Optional[float] = None
    status: Optional[str] = None
    license_number: Optional[str] = None
    notes: Optional[str] = None


class DriverOut(DriverBase):
    id: int
    current_location: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    last_location_update: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Computed Fleet & Capacity metrics
    active_orders_count: int = 0
    current_load_tons: float = 0.0
    remaining_capacity_tons: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class ClaimOrderRequest(BaseModel):
    phone: str
    booking_id_or_ref: str
    note: Optional[str] = None
