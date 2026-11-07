import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("DATABASE_URL", "sqlite://")  # required by Settings
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import admin, booking, status_history  # noqa: E402,F401

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture()
def db_session():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session, monkeypatch):
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def admin_headers(client, db_session):
    from app.crud.admin import create_admin, get_admin_by_username

    if not get_admin_by_username(db_session, "tester"):
        create_admin(db_session, "tester", "t@example.com", "supersecret123")
    resp = client.post(
        "/api/v1/admin/login",
        json={"username": "tester", "password": "supersecret123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def sample_payload():
    return {
        "company_name": "Acme Traders",
        "contact_person": "Ravi Kumar",
        "phone": "+91 9876543210",
        "email": "ravi@acme.in",
        "pickup_city": "pune",
        "delivery_city": "Mumbai",
        "load_type": "FTL",
        "vehicle_type": "Container 32ft",
        "weight_tons": 12.5,
        "material": "Packaged goods",
        "notes": "Pickup after 10 AM",
    }
