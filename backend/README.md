# Ganraj Logistics Service — Backend

FastAPI + PostgreSQL backend for booking requests and admin management.

## Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL and SECRET_KEY
alembic upgrade head          # create tables
python -m scripts.create_admin --username admin --email you@example.com --password 'StrongPass1'
uvicorn app.main:app --reload # serves at http://localhost:8000, docs at /docs
```

## API overview

### Public
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/bookings` | Submit a booking request (rate-limited, validated) |
| GET  | `/api/v1/bookings/{id}` | Look up a booking by id |

### Admin (Bearer token from `/api/v1/admin/login`)
| Method | Endpoint | Description |
|---|---|---|
| POST  | `/api/v1/admin/login` | Login → JWT token |
| GET   | `/api/v1/admin/bookings` | List bookings, optional `?status=` filter |
| GET   | `/api/v1/admin/bookings/{id}` | Booking detail |
| PATCH | `/api/v1/admin/bookings/{id}/status` | Move status (validated transitions) |
| GET   | `/api/v1/admin/bookings/{id}/history` | Full status history |

### Booking lifecycle
`New → Quoted → Vehicle Assigned → In Transit → Delivered` (or `Cancelled` up to Vehicle Assigned).
Every change writes a `status_history` row with the admin username and a note.

## Tests

```bash
cd backend && pytest -v
```

Tests run on an in-memory SQLite database — no Postgres needed.

## Notes
- Passwords are bcrypt-hashed; JWTs expire per `ACCESS_TOKEN_EXPIRE_MINUTES`.
- `.env` is git-ignored; only `.env.example` is committed.
- Email/WhatsApp notifications are optional — configured via env vars, failures are logged, never raised.
