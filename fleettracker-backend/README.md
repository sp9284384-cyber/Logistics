# Fleet Tracker Backend

Transport & logistics backend: dispatchers create and assign orders, drivers update status
and stream live GPS positions, with JWT auth, FCM push notifications and Flyway-managed MySQL schema.

## Stack
Java 21 · Spring Boot 3 · Spring Data JPA · Spring Security (JWT) · MySQL 8 · Flyway · Firebase Admin (optional) · Docker

## Project layout
- `config/` - security filter chain, CORS, optional WebSocket and Firebase setup
- `security/` - JWT creation/validation, auth filter, user details service
- `auth/` - login endpoint, returns `{ token, role, name }`
- `user/` - users, roles (DISPATCHER / DRIVER), driver list for the assign dropdown
- `order/` - orders, status state machine, assignment + status updates
- `delivery/` - order ↔ driver link with assigned / picked-up / delivered timestamps
- `location/` - driver GPS updates, latest-position query, nightly retention purge
- `notification/` - FCM device tokens and push sender (skips gracefully if Firebase is off)
- `common/` - shared exceptions, error JSON, paged response wrapper

## Endpoints
| Method | URL | Who |
|---|---|---|
| POST | /api/auth/login | anyone |
| POST | /api/orders | dispatcher |
| GET | /api/orders?page=&size=&status= | dispatcher: all · driver: own |
| PATCH | /api/orders/{id}/assign | dispatcher |
| PATCH | /api/orders/{id}/status | driver (own order only) |
| POST | /api/locations | driver |
| GET | /api/locations/drivers/latest | dispatcher |
| POST | /api/devices/token | driver |
| GET | /api/users/drivers | dispatcher |
| POST | /api/users | dispatcher |

## Run locally
```bash
cp .env.example .env   # then fill in real values
mysql -e "CREATE DATABASE fleet_tracker CHARACTER SET utf8mb4;"
export $(grep -v '^#' .env | xargs)   # or set vars in your IDE
./mvnw spring-boot:run
```

Seeded dispatcher (migration V6): `admin@fleet.local` — change the password immediately after first login.

## Run with Docker
```bash
docker build -t fleet-tracker .
docker run -p 8080:8080 --env-file .env fleet-tracker
```

## Tests
```bash
./mvnw test
```

## Design notes
- `ddl-auto: validate` with Flyway — Hibernate never mutates the production schema.
- JWT secret, DB credentials and Firebase credentials come only from environment variables.
- Order status transitions are enforced centrally (`OrderStatus.canTransitionTo`); DELIVERED is final.
- A driver can only change status of an order assigned to them — checked in the service layer, not just by role.
- `location_updates` is purged nightly (default: keep 7 days, `LOCATION_RETENTION_DAYS`) — this table grows ~1 row per few seconds per driver.
- The location endpoint is called constantly: keep payloads small, and put rate limiting in front (API gateway / reverse proxy) before production.
- Push notifications degrade gracefully when `FIREBASE_ENABLED=false` (default).
- WebSocket live positions are disabled by default; the dashboard can poll `GET /api/locations/drivers/latest` until you flip `WEBSOCKET_ENABLED=true`.
