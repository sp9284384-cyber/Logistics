# Ganraj Logistics Service — Platform

> **Reliable Transport. On Time. Every Time.**

A production-ready, three-part platform for **Ganraj Logistics Service** — a full-truck-load and part-load transport provider operating across India.

| Part | Technology | Purpose |
|------|-----------|---------|
| `frontend/` | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui | Public website + Admin booking panel |
| `fleettracker-backend/` | Java 21, Spring Boot 3, MySQL 8, Flyway, JWT | Fleet management REST API |
| `GanrajDriver/` | Kotlin, Jetpack Compose, Hilt, Retrofit, WorkManager | Driver mobile app (Android) |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend — Website and Admin Panel](#frontend--website-and-admin-panel)
3. [Backend — Fleet Tracker API](#backend--fleet-tracker-api)
4. [Android Driver App](#android-driver-app)
5. [API Contract](#api-contract)
6. [Database Schema](#database-schema)
7. [Local Development Setup](#local-development-setup)
8. [Environment Variables Reference](#environment-variables-reference)
9. [AWS Deployment Guide](#aws-deployment-guide)
10. [CI/CD with GitHub Actions](#cicd-with-github-actions)
11. [Security Checklist](#security-checklist)

---

## Architecture Overview

```
+---------------------+    HTTPS + JWT     +------------------------------+
|  Public Website     |-----------------> |                              |
|  (Next.js / Vercel) |                   |  Spring Boot 3 API           |
|  /#admin panel      |-----------------> |  (EC2 / Docker / Nginx)      |<--JPA--> MySQL 8 (RDS)
+---------------------+                   |  api.yourdomain.com          |
                                          |                              |
+---------------------+    HTTPS + JWT    |                              |
|  Ganraj Driver App  |-----------------> |                              |
|  (Android / Kotlin) |                   +------------------------------+
|  Background GPS     |                                 |
|  location posts     |<--------------------------------+
+---------------------+    FCM push (new order assigned)
```

**Key design decisions**

- The public website is statically deployable (Vercel/Netlify) and only contacts the backend for booking requests.
- The fleet API uses stateless JWT; `ddl-auto: validate` means Flyway owns the schema exclusively.
- The Android app uses a **demo mode** (in-memory fake server) so it works out of the box without any backend.
- Background GPS tracking uses a foreground service + WorkManager retry so location fixes are never silently lost.

---

## Frontend — Website and Admin Panel

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui

**Location:** `frontend/`

### Pages and sections

| Route | Description |
|-------|-------------|
| `/` | Public site — Hero, About, Services, Why Us, How It Works, Contact |
| `/#book` | Booking request form (name, phone, route, vehicle, pickup date) |
| `/#admin` | Dispatcher admin panel — login, booking list, status updates, timeline |

The admin panel is hash-routed inside the same Next.js app so no separate deployment is needed. It authenticates against the backend JWT and rejects any user whose role is not `DISPATCHER`.

### Key files

```
frontend/src/
├── app/
│   ├── layout.tsx          Root layout (Inter font, brand meta tags)
│   ├── page.tsx            Shell — toggles between public site and admin view
│   └── api/
│       ├── admin/auth/     Admin login / me / logout Next.js API routes
│       ├── admin/bookings/ Booking CRUD (proxies to Spring Boot backend)
│       └── bookings/       Public booking submission
├── components/
│   ├── site/               Hero, About, Services, Header, Footer, sections
│   ├── booking/            Booking form with vehicle picker
│   ├── admin/              admin-view.tsx — full dispatcher dashboard
│   └── ui/                 shadcn/ui primitives
├── hooks/
│   ├── use-admin.ts        Admin session management
│   └── use-mobile.ts       Responsive breakpoint hook
└── lib/
    ├── api-client.ts       Typed fetch wrappers for all backend calls
    └── constants.ts        Company info, booking statuses, vehicle types, services
```

### Admin credentials (development only)

| Email | Password |
|-------|----------|
| `admin@ganrajlogistics.in` | `ganraj@123` |

> **Production:** seed a real dispatcher row in MySQL with a BCrypt hash and remove the demo hint from `LoginView`.

### Brand colours (from Banner.pdf)

| Token | Hex | Usage |
|-------|-----|-------|
| Navy | `#001c42` | Headers, primary backgrounds |
| Orange | `#ed6f00` | CTAs, accents, highlights |
| Cloud gray | `#ced1d7` | Subtle section backgrounds |

---

## Backend — Fleet Tracker API

**Stack:** Java 21 · Spring Boot 3.4.3 · Spring Security · Spring Data JPA · MySQL 8 · Flyway · JJWT · Firebase Admin SDK

**Location:** `fleettracker-backend/`

### Module overview

| Package | Responsibility |
|---------|---------------|
| `auth/` | Login endpoint — issues JWT (subject = userId, claim = role) |
| `user/` | User management; driver listing for dispatchers |
| `order/` | Order lifecycle state machine |
| `delivery/` | Delivery timestamps per milestone |
| `location/` | Rate-limited GPS fix storage; `drivers/latest` aggregation |
| `notification/` | FCM token registry; push on assignment |
| `config/` | Security (JWT filter, CORS, role matchers), WebSocket (optional), Firebase |
| `common/` | GlobalExceptionHandler, PageResponse, error DTOs |

### Order status flow

```
CREATED --> ASSIGNED --> PICKED_UP --> IN_TRANSIT --> DELIVERED
    \--------------------------------------------------> CANCELLED
```

Only a **DISPATCHER** can create orders and assign drivers.
Only the **driver assigned to an order** can update its status — enforced in `OrderService`, not just by role.

### Flyway migrations

| Script | Creates |
|--------|---------|
| `V1__create_users.sql` | `users` |
| `V2__create_orders.sql` | `orders` (indexes on status, assigned driver) |
| `V3__create_deliveries.sql` | `deliveries` |
| `V4__create_location_updates.sql` | `location_updates` (index on driver_id, recorded_at) |
| `V5__create_device_tokens.sql` | `device_tokens` |

`LocationService` runs a nightly `@Scheduled` purge that removes rows older than `LOCATION_RETENTION_DAYS` (default: 7 days).

---

## Android Driver App

**Stack:** Kotlin · Jetpack Compose · MVVM · Hilt · Retrofit 2 + kotlinx.serialization · Fused Location · Maps Compose · WorkManager · Firebase Cloud Messaging

**Location:** `GanrajDriver/`

See [`GanrajDriver/README.md`](GanrajDriver/README.md) for the full standalone guide.

### Screen flow

```
Login --> Orders List --> Order Detail --> Map
              ^                |
              +------ FCM push-+   (tapping a push notification opens the order)
```

### Demo mode (no server needed)

`DemoApiService` is a fully in-memory fake server. It is active when `DEMO_MODE=true` in `local.properties` (the default for debug builds).

| Email | Password |
|-------|----------|
| `driver@ganraj.demo` | `Driver@123` |

Set `DEMO_MODE=false` and `API_BASE_URL=http://10.0.2.2:8080/` to use the real local backend.

### Key packages

| Package | Contents |
|---------|---------|
| `di/` | NetworkModule, StorageModule, LocationModule |
| `core/network/` | ApiService (Retrofit), AuthInterceptor, ApiResult, DemoApiService |
| `core/storage/` | TokenStorage (EncryptedSharedPreferences), PendingLocationStore |
| `data/model/` | Order, OrderStatus (+ next-status helper), AuthResponse, LocationRequest |
| `data/repository/` | Auth, Order, Location, DeviceToken |
| `ui/auth/` | LoginScreen + LoginViewModel |
| `ui/orders/` | OrdersListScreen, OrderDetailScreen, ViewModels, OrderCard, StatusChip, StatusActionButton |
| `ui/map/` | MapScreen (Maps Compose), MapViewModel |
| `location/` | LocationTrackingService (foreground), LocationClient (Flow), LocationUploadWorker (retry) |
| `notification/` | GanrajMessagingService (FCM), NotificationHelper |

---

## API Contract

Base URL: `https://api.yourdomain.com`
All protected endpoints require: `Authorization: Bearer <jwt>`

| # | Method | URL | Role | Used by |
|---|--------|-----|------|---------|
| 1 | `POST` | `/api/auth/login` | Any | Both |
| 2 | `POST` | `/api/orders` | Dispatcher | Web admin |
| 3 | `GET` | `/api/orders?page=&size=&status=` | Dispatcher (all) / Driver (own) | Both |
| 4 | `GET` | `/api/orders/{id}` | Dispatcher / assigned driver | Both |
| 5 | `PATCH` | `/api/orders/{id}/assign` | Dispatcher | Web admin |
| 6 | `PATCH` | `/api/orders/{id}/status` | Driver (own order) | Android |
| 7 | `POST` | `/api/locations` | Driver | Android |
| 8 | `GET` | `/api/locations/drivers/latest` | Dispatcher | Web admin |
| 9 | `GET` | `/api/users/drivers` | Dispatcher | Web admin |
| 10 | `POST` | `/api/devices/token` | Driver | Android |

### Error shape

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": { "phone": "must not be blank" }
}
```

Status codes: `400` validation · `401` bad/expired token · `403` wrong role or not your order · `404` not found · `409` invalid status transition

---

## Database Schema

```sql
-- All tables managed exclusively by Flyway
users          (id, name, email, password_hash, role, phone, active, created_at)

orders         (id, reference, pickup_address, pickup_lat, pickup_lng,
                drop_address, drop_lat, drop_lng, customer_name, customer_phone,
                item_description, status, created_by, assigned_driver_id,
                created_at, updated_at)

deliveries     (id, order_id, driver_id, assigned_at, picked_up_at, delivered_at)

location_updates (id, driver_id, latitude, longitude, accuracy, speed, recorded_at)

device_tokens  (id, user_id, fcm_token, created_at)
```

---

## Local Development Setup

### Prerequisites

- **Node.js 20+** and **npm 10+** — frontend
- **JDK 21** — backend
- **MySQL 8** locally, or via Docker:
  ```bash
  docker run -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=fleet_tracker -p 3306:3306 mysql:8
  ```
- **Android Studio Ladybug or newer** — Android app

### 1 — Start the backend

```bash
cd fleettracker-backend
cp .env.example .env          # Edit DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET
./mvnw spring-boot:run        # Flyway runs migrations on startup
curl http://localhost:8080/actuator/health
```

Default dev values (no `.env` file needed for a quick try):

| Variable | Default |
|----------|---------|
| `DB_URL` | `jdbc:mysql://localhost:3306/fleet_tracker` |
| `DB_USER` | `fleet` |
| `DB_PASSWORD` | `fleet` |

### 2 — Seed first users

```sql
-- Replace the BCrypt hash with your own generated value
INSERT INTO users (name, email, password_hash, role, phone, active) VALUES
  ('Admin',       'admin@ganrajlogistics.in', '$2a$10$HASH', 'DISPATCHER', '8108767159', true),
  ('Test Driver', 'driver@ganrajlogistics.in','$2a$10$HASH', 'DRIVER',     '9987051430', true);
```

Generate a hash: `echo -n "yourpassword" | htpasswd -bnBC 10 "" - | tr -d ':\n'`

### 3 — Start the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### 4 — Run the Android app

1. Open `GanrajDriver/` in Android Studio and let Gradle sync.
2. Run on an emulator (API 26+) or a real phone.
3. App starts in **demo mode** — login with `driver@ganraj.demo` / `Driver@123`.

To connect to the local backend, edit `GanrajDriver/local.properties`:
```
DEMO_MODE=false
API_BASE_URL=http://10.0.2.2:8080/
```

---

## Environment Variables Reference

### Backend

| Variable | Description |
|----------|-------------|
| `DB_URL` | JDBC URL — e.g. `jdbc:mysql://<rds>:3306/fleettracker?useSSL=true&serverTimezone=UTC` |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | 64+ random characters (`openssl rand -base64 64`) |
| `JWT_EXPIRY_MS` | Token lifetime in milliseconds (default `86400000` = 24 h) |
| `ALLOWED_ORIGINS` | CORS origin — e.g. `https://your-app.vercel.app` |
| `FIREBASE_ENABLED` | `true` to enable FCM push |
| `FIREBASE_CREDENTIALS` | Path to Firebase service account JSON |
| `LOCATION_RETENTION_DAYS` | Days before location rows are purged (default `7`) |
| `SPRING_PROFILES_ACTIVE` | Set to `prod` in production |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (lands in browser bundle — no secrets here) |
| `ADMIN_JWT_SECRET` | Server-only secret for the admin session cookie |

### Android (local.properties)

| Variable | Description |
|----------|-------------|
| `DEMO_MODE` | `true` = offline demo; `false` = real backend |
| `API_BASE_URL` | Debug build URL (`http://10.0.2.2:8080/` for emulator) |
| `API_BASE_URL_RELEASE` | Release build URL (`https://api.yourdomain.com/`) |
| `MAPS_API_KEY` | Google Maps SDK key — restrict to package name + SHA-1 fingerprint |

---

## AWS Deployment Guide

### Target architecture

```
Android App ---+
               +--> https://api.yourdomain.com --> EC2 (Nginx :443 -> Docker :8080) --> RDS MySQL
Next.js -------+                                                      |
(Vercel)                                                              +--> Firebase FCM --> Android
```

### Account safety (do first)

- Enable **MFA** on root; create an IAM admin user, stop using root.
- **Billing → Budgets**: $5 budget with email alerts at 50%, 80%, 100%.
- Enable **Free Tier usage alerts** and billing alerts.
- Pick one region (`ap-south-1` Mumbai for India) and stay there.

### Security groups

| Group | Rule | Source |
|-------|------|--------|
| `sg-ec2` | 22 SSH | Your IP only — never 0.0.0.0/0 |
| `sg-ec2` | 80, 443 | `0.0.0.0/0` |
| `sg-rds` | 3306 | `sg-ec2` only |

### RDS MySQL 8

- Template: **Free tier / Dev-Test**, single-AZ, `db.t4g.micro` or `db.t3.micro`
- Storage: gp3, 20 GB, autoscaling **off**
- Public access: **No**
- Automated backups on, 7-day retention; deletion protection on

SSH tunnel to inspect the DB from your laptop:
```bash
ssh -i key.pem -L 3307:<rds-endpoint>:3306 ubuntu@<ec2-ip>
# then: mysql -h 127.0.0.1 -P 3307 -u fleet_app -p
```

Create the app user after the instance is ready:
```sql
CREATE DATABASE fleettracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fleet_app'@'%' IDENTIFIED BY '<long-random-password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON fleettracker.* TO 'fleet_app'@'%';
```

### EC2 instance

- **AMI:** Ubuntu 24.04 LTS
- **Size:** `t3.small` (2 GB) recommended; `t3.micro` requires swap + `-Xmx384m`
- Allocate an **Elastic IP** so the address survives reboots

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
sudo usermod -aG docker ubuntu
sudo mkdir -p /opt/fleet && sudo chown ubuntu /opt/fleet
```

### Dockerfile (multi-stage)

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx384m", "-jar", "app.jar"]
```

### /opt/fleet/docker-compose.yml

```yaml
services:
  backend:
    image: ghcr.io/<your-github-user>/fleet-backend:latest
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - ./firebase.json:/run/secrets/firebase.json:ro
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health"]
      interval: 30s
      retries: 3
```

### Nginx + HTTPS

```nginx
server {
    server_name api.yourdomain.com;
    client_max_body_size 1m;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fleet /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Vercel (frontend)

1. Import repo → root directory: `frontend` → framework: **Next.js**
2. Set env vars: `NEXT_PUBLIC_API_URL`, `ADMIN_JWT_SECRET`
3. Copy the Vercel URL → backend `ALLOWED_ORIGINS` → redeploy backend

### Android release build

```
# GanrajDriver/local.properties
API_BASE_URL_RELEASE=https://api.yourdomain.com/
MAPS_API_KEY=<restrict to package + release SHA-1>
```

- Add release SHA-1 to Firebase → re-download `google-services.json`
- Never commit `local.properties`, keystore files, or `google-services.json`

### Deployment order checklist

- [ ] MFA on root, IAM admin user, billing budgets
- [ ] Security groups, then RDS, create DB and app user
- [ ] Launch EC2, attach Elastic IP, install Docker + Nginx
- [ ] Domain A record, Nginx config, run certbot
- [ ] Place `.env` and `firebase.json` in `/opt/fleet/`
- [ ] First deploy: `docker compose up -d` — watch Flyway logs
- [ ] Seed dispatcher and driver users
- [ ] Deploy frontend to Vercel, set `ALLOWED_ORIGINS`
- [ ] Build release Android APK against HTTPS URL, test end-to-end

---

## CI/CD with GitHub Actions

`.github/workflows/backend.yml`:

```yaml
name: Backend CI/CD
on:
  push:
    branches: [main]
    paths: ["fleettracker-backend/**"]
jobs:
  test-build-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 21, cache: maven }
      - run: mvn -q -f fleettracker-backend/pom.xml test
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: fleettracker-backend
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/fleet-backend:latest
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /opt/fleet
            docker compose pull
            docker compose up -d
            docker image prune -f
```

**Required repository secrets:** `EC2_HOST`, `EC2_SSH_KEY`

---

## Security Checklist

- [ ] RDS has public access **off**; `sg-rds` allows only `sg-ec2`
- [ ] EC2 SSH limited to your IP; key-only auth (`PasswordAuthentication no`)
- [ ] `JWT_SECRET` and `DB_PASSWORD` only in `/opt/fleet/.env` — never in git or Docker image
- [ ] Firebase service account JSON at `/opt/fleet/firebase.json` (chmod 600) — never in git
- [ ] `GanrajDriver/local.properties`, keystore files, `google-services.json` in `.gitignore`
- [ ] Google Maps API key restricted to package name + release SHA-1
- [ ] `ddl-auto: validate` — Flyway owns schema; Hibernate never modifies it
- [ ] Rate limiting on `/api/auth/login` and `/api/locations`
- [ ] Driver-order ownership enforced in `OrderService` (not just by role annotation)
- [ ] Docker log rotation (`max-size: 10m`, `max-file: 3`)
- [ ] CloudWatch alarms on EC2 CPU, RDS free storage, and instance status checks
- [ ] External uptime monitor pinging `/actuator/health` every 5 minutes

---

## Common Problems

| Symptom | Likely cause |
|---------|-------------|
| Backend can't reach MySQL | `sg-rds` missing `sg-ec2` rule, or wrong endpoint/password |
| Browser blocked, Postman works | CORS origin mismatch, or HTTP vs HTTPS (mixed content) |
| Container keeps restarting | OOM on t3.micro — add swap and lower `-Xmx`; or missing env var |
| Flyway fails on startup | Schema mismatch from a manual edit, or app user lacks DDL privileges |
| Push notifications don't arrive | Missing service account JSON, wrong Firebase project, or notification permission denied on Android 13+ |
| Times off by 5.5 hours | Mixed timezones — store UTC everywhere, convert only in the UI |
| Android app can't connect | Using `localhost` instead of `10.0.2.2`, or cleartext blocked in release build |

---

## Contact

**Ganraj Logistics Service**
- Phone: 8108767159 / 99870 51430
- Email: ganrajlogisticsservice@gmail.com

*This is a private production codebase. Do not publish API keys, credentials, or customer data.*
