from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.crud.admin import create_admin, get_admin_by_identifier
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.middleware.rate_limit import RateLimitMiddleware


def init_db_and_admin() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        if "bookings" in inspector.get_table_names():
            existing_cols = {col["name"] for col in inspector.get_columns("bookings")}
            new_cols = [
                ("total_amount", "NUMERIC(10,2)"),
                ("invoice_notes", "TEXT"),
                ("invoice_sent_at", "TIMESTAMP"),
                ("driver_name", "VARCHAR(100)"),
                ("driver_phone", "VARCHAR(20)"),
                ("vehicle_number", "VARCHAR(30)"),
                ("driver_notes", "TEXT"),
                ("assigned_at", "TIMESTAMP"),
                ("current_location", "VARCHAR(255)"),
                ("current_latitude", "NUMERIC(10,6)"),
                ("current_longitude", "NUMERIC(10,6)"),
                ("last_location_update", "TIMESTAMP"),
            ]
            with engine.connect() as conn:
                for col_name, col_type in new_cols:
                    if col_name not in existing_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type}"))
                        except Exception:
                            pass
                conn.commit()

        # Ensure drivers table exists (created via create_all, but guard migration)
        from app.models.driver import Driver  # noqa: F401  ensures table metadata is loaded
        Base.metadata.create_all(bind=engine)  # create new tables (drivers) if not present

        db = SessionLocal()
        try:
            if not get_admin_by_identifier(db, "admin@ganrajlogistics.in"):
                create_admin(
                    db,
                    username="admin",
                    email="admin@ganrajlogistics.in",
                    password="ganraj@123",
                )
        finally:
            db.close()
    except Exception as e:
        import logging

        logging.getLogger(__name__).warning("Database init note: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_admin()
    yield


def create_app() -> FastAPI:
    setup_logging()
    settings = get_settings()

    app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    @app.get("/health")
    def health():
        return {"status": "ok", "env": settings.ENV}

    return app


app = create_app()
