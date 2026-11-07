def test_login_success(client, admin_headers):
    assert "Authorization" in admin_headers


def test_login_wrong_password(client, db_session):
    from app.crud.admin import create_admin

    create_admin(db_session, "user2", "u2@example.com", "password456")
    resp = client.post(
        "/api/v1/admin/login",
        json={"username": "user2", "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_admin_endpoints_require_token(client):
    assert client.get("/api/v1/admin/bookings").status_code == 401


def test_list_bookings(client, admin_headers, sample_payload):
    client.post("/api/v1/bookings", json=sample_payload)
    resp = client.get("/api/v1/admin/bookings", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_status_flow_and_history(client, admin_headers, sample_payload):
    created = client.post("/api/v1/bookings", json=sample_payload).json()
    bid = created["id"]

    # valid transition New -> Quoted
    resp = client.patch(
        f"/api/v1/admin/bookings/{bid}/status",
        json={"status": "Quoted", "note": "Rate shared"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Quoted"

    # invalid transition: Quoted -> Delivered (must go through In Transit)
    resp = client.patch(
        f"/api/v1/admin/bookings/{bid}/status",
        json={"status": "Delivered"},
        headers=admin_headers,
    )
    assert resp.status_code == 400

    # history records both changes
    history = client.get(
        f"/api/v1/admin/bookings/{bid}/history", headers=admin_headers
    ).json()
    assert history[0]["new_status"] == "New"
    assert history[1]["old_status"] == "New"
    assert history[1]["new_status"] == "Quoted"
    assert history[1]["changed_by"] == "tester"
