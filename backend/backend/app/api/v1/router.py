from fastapi import APIRouter

from app.api.v1 import admin, bookings

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(bookings.router)
api_router.include_router(admin.router)
