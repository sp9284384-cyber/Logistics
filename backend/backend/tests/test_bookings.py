def test_create_booking(client, sample_payload):
    resp = client.post("/api/v1/bookings", json=sample_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["ref_code"].startswith("GLS-")
    assert data["status"] == "New"
    assert data["pickup_city"] == "Pune"  # title-cased by validator


def test_create_booking_invalid_phone(client, sample_payload):
    sample_payload["phone"] = "123"
    resp = client.post("/api/v1/bookings", json=sample_payload)
    assert resp.status_code == 422


def test_create_booking_bad_load_type(client, sample_payload):
    sample_payload["load_type"] = "Bike"
    resp = client.post("/api/v1/bookings", json=sample_payload)
    assert resp.status_code == 422


def test_get_booking(client, sample_payload):
    created = client.post("/api/v1/bookings", json=sample_payload).json()
    resp = client.get(f"/api/v1/bookings/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["ref_code"] == created["ref_code"]


def test_get_booking_not_found(client):
    assert client.get("/api/v1/bookings/9999").status_code == 404
