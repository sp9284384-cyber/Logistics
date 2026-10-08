<div align="center">

<img src="https://img.shields.io/badge/Ganraj_Logistics_Service-001c42?style=for-the-badge&logoColor=white" alt="Ganraj Logistics Service" height="40"/>

# 🚛 Ganraj Logistics Service

### *Reliable Transport. On Time. Every Time.*

**Full-stack production platform for a pan-India truck-load logistics provider.**  
Handles online booking, dispatcher management, live driver tracking, and push-notification-driven delivery workflows.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=flat-square&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL_8-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Android](https://img.shields.io/badge/Android-34A853?style=flat-square&logo=android&logoColor=white)](https://developer.android.com/)
[![AWS](https://img.shields.io/badge/AWS-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

| 📞 **8108767159** | 📞 **99870 51430** | ✉️ **ganrajlogisticsservice@gmail.com** |
|:-:|:-:|:-:|

</div>

---

## 📋 Table of Contents

- [Platform Overview](#-platform-overview)
- [Architecture](#-architecture)
- [Frontend — Website & Admin Panel](#-frontend--website--admin-panel)
- [Backend — Fleet Tracker API](#-backend--fleet-tracker-api)
- [Android Driver App](#-android-driver-app)
- [API Contract](#-api-contract)
- [Database Schema](#-database-schema)
- [Local Development](#-local-development)
- [Environment Variables](#-environment-variables)
- [AWS Deployment Guide](#-aws-deployment-guide)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Security Checklist](#-security-checklist)
- [Troubleshooting](#-troubleshooting)

---

## 🗂 Platform Overview

This monorepo contains three production-ready components that work together as a single logistics management platform:

| Component | Stack | Role |
|-----------|-------|------|
| [`frontend/`](#-frontend--website--admin-panel) | Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui | Public website + Dispatcher admin panel |
| [`fleettracker-backend/`](#-backend--fleet-tracker-api) | Java 21 · Spring Boot 3 · MySQL 8 · Flyway · JWT | Fleet management REST API |
| [`GanrajDriver/`](#-android-driver-app) | Kotlin · Jetpack Compose · Hilt · Retrofit · WorkManager | Native Android driver app |

### Business flow

```
Customer fills booking form  →  Dispatcher reviews & assigns driver  →
Driver gets push notification →  Driver marks Picked Up / In Transit / Delivered  →
Live GPS tracked on dispatcher map  →  Customer gets delivery update
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌──────────────────────┐          ┌──────────────────────────┐    │
│  │   Public Website     │          │   Ganraj Driver App      │    │
│  │   + Admin Panel      │          │   (Android / Kotlin)     │    │
│  │   Next.js on Vercel  │          │   Background GPS upload  │    │
│  └──────────┬───────────┘          └────────────┬─────────────┘    │
└─────────────┼────────────────────────────────────┼─────────────────┘
              │  HTTPS + JWT                       │  HTTPS + JWT
              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER  (EC2)                            │
│                                                                     │
│   Nginx :443  →  Docker :8080  →  Spring Boot 3 Fleet Tracker API  │
│                                                                     │
│   • Stateless JWT auth       • Role-based access (DISPATCHER/DRIVER)│
│   • Flyway schema mgmt       • Rate-limited GPS ingestion           │
│   • FCM push notifications   • Nightly location data purge          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │  JPA / JDBC
                                ▼
              ┌─────────────────────────────────────┐
              │   RDS MySQL 8  (private subnet)      │
              │   users · orders · deliveries        │
              │   location_updates · device_tokens   │
              └─────────────────────────────────────┘
                                │
                                │  FCM
                                ▼
              ┌─────────────────────────────────────┐
              │   Firebase Cloud Messaging           │
              │   "New order assigned" push →        │
              │   Driver's Android device            │
              └─────────────────────────────────────┘
```

> **Key principles**
> - `ddl-auto: validate` — Flyway is the sole owner of the MySQL schema; Hibernate never modifies it.
> - JWT is stateless and server-side; the secret never leaves the server's environment.
> - Driver-order ownership is enforced in `OrderService` — hiding a button in the UI is not security.
> - The Android app ships with an offline **demo mode** (in-memory server) so it runs without any backend.

---

## 🌐 Frontend — Website & Admin Panel

> **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · next/font  
> **Location:** `frontend/`

### Pages

| URL / Section | Purpose |
|---------------|---------|
| `/` | Public marketing site — Hero, About, Services, Why Us, How It Works, Contact |
| `/#book` | Booking request form (name, phone, route, vehicle type, pickup date) |
| `/#admin` | Dispatcher admin panel — login, paginated booking list, status updates, timeline |

The admin panel is **hash-routed inside the same Next.js app** — no separate deployment, no additional hosting cost. It authenticates against the backend JWT and rejects any user whose role is not `DISPATCHER`.

### Brand palette

| | Token | Hex | Usage |
|-|-------|-----|-------|
| 🟦 | Navy | `#001c42` | Headers, primary backgrounds |
| 🟧 | Orange | `#ed6f00` | CTAs, accents, highlights |
| ⬜ | Cloud gray | `#ced1d7` | Subtle section backgrounds |

> All colours are derived from the official Ganraj Logistics banner document. No other colours are used without client approval.

### Key source files

```
frontend/src/
├── app/
│   ├── layout.tsx                  Root layout (Inter, brand meta, OG tags)
│   ├── page.tsx                    Shell — toggles public site ↔ admin view
│   └── api/
│       ├── admin/auth/             JWT-protected admin login / me / logout
│       ├── admin/bookings/         Booking CRUD — proxies to Spring Boot
│       └── bookings/               Public booking form submission
├── components/
│   ├── site/                       Hero · About · Services · Header · Footer
│   ├── booking/                    Booking form with vehicle picker
│   ├── admin/admin-view.tsx        Full dispatcher dashboard (813 lines)
│   └── ui/                         shadcn/ui component library
├── hooks/
│   ├── use-admin.ts                Admin session state
│   └── use-mobile.ts               Responsive breakpoint
└── lib/
    ├── api-client.ts               Typed fetch wrappers for every backend call
    └── constants.ts                Company info · booking statuses · vehicle types
```

### Admin panel (development credentials)

> ⚠️ **Remove the demo hint from `LoginView` before going live and seed a real BCrypt-hashed row in MySQL.**

| Email | Password |
|-------|----------|
| `admin@ganrajlogistics.in` | `ganraj@123` |

---

## ⚙️ Backend — Fleet Tracker API

> **Stack:** Java 21 · Spring Boot 3.4.3 · Spring Security · Spring Data JPA · MySQL 8 · Flyway · JJWT · Firebase Admin SDK  
> **Location:** `fleettracker-backend/`

### Module responsibilities

| Package | What it does |
|---------|-------------|
| `auth/` | POST `/api/auth/login` → validates credentials → returns signed JWT |
| `user/` | Dispatcher-only: list active drivers for the assign dropdown |
| `order/` | Full order lifecycle state machine with role and ownership checks |
| `delivery/` | Separate delivery record tracking assignment / pickup / delivered timestamps |
| `location/` | Rate-limited GPS fix ingestion; `drivers/latest` aggregation query |
| `notification/` | FCM token registry; sends "New order assigned" push after commit |
| `config/` | SecurityConfig · CorsConfig · WebSocketConfig (optional) · FirebaseConfig |
| `common/` | `GlobalExceptionHandler` · `PageResponse<T>` · typed error DTOs |

### Order lifecycle

```
  ┌─────────┐   Dispatcher    ┌──────────┐   Driver     ┌───────────┐
  │ CREATED │ ─────assign───► │ ASSIGNED │ ─pickup tap─► │ PICKED_UP │
  └─────────┘                 └──────────┘               └─────┬─────┘
                                                               │
                        ┌──────────────┐    Driver             │
                        │  DELIVERED   │ ◄───tap───────────────┘
                        └──────────────┘    (via IN_TRANSIT)

  Any state ──── Dispatcher ───► CANCELLED
```

> Only the **dispatcher** can create and assign orders.  
> Only the **driver assigned to that specific order** can advance its status — checked in the service layer, not just by role annotation.

### Flyway migrations

| Script | Table created | Notable indexes |
|--------|---------------|----------------|
| `V1__create_users.sql` | `users` | unique email |
| `V2__create_orders.sql` | `orders` | `(status)`, `(assigned_driver_id)` |
| `V3__create_deliveries.sql` | `deliveries` | FK to orders and users |
| `V4__create_location_updates.sql` | `location_updates` | `(driver_id, recorded_at)` |
| `V5__create_device_tokens.sql` | `device_tokens` | unique (user_id, fcm_token) |

> `location_updates` grows at ~1 row per 8 seconds per active driver. A `@Scheduled` nightly job deletes rows older than `LOCATION_RETENTION_DAYS` (default 7 days).

---

## 📱 Android Driver App

> **Stack:** Kotlin · Jetpack Compose · MVVM · Hilt · Retrofit 2 · kotlinx.serialization · Fused Location · Maps Compose · WorkManager · Firebase Cloud Messaging  
> **Location:** `GanrajDriver/`  
> **Package:** `com.ganraj.logistics.driver`  
> See also: [`GanrajDriver/README.md`](GanrajDriver/README.md)

### Screen flow

```
  Login
    │
    ▼
  Orders List ◄──── FCM push (new order) opens Order Detail directly
    │
    ▼
  Order Detail
    ├── Status action button  (Assigned → Picked Up → In Transit → Delivered)
    ├── Navigate button       (opens Google Maps with drop address)
    └── Tracking starts automatically on Picked Up, stops on Delivered
    │
    ▼
  Map Screen  (Fused Location live position + pickup/drop markers)
```

### Demo mode — no server required

The app ships with `DemoApiService`, a fully in-memory fake server. It is the default in all debug builds.

| Email | Password |
|-------|----------|
| `driver@ganraj.demo` | `Driver@123` |

Set `DEMO_MODE=false` in `GanrajDriver/local.properties` to connect to the real backend.

### Package map

| Package | Key files |
|---------|-----------|
| `di/` | `NetworkModule` · `StorageModule` · `LocationModule` |
| `core/network/` | `ApiService` · `AuthInterceptor` · `ApiResult` · `DemoApiService` |
| `core/storage/` | `TokenStorage` (EncryptedSharedPreferences) · `PendingLocationStore` |
| `data/model/` | `Order` · `OrderStatus` (+ `nextStatus()` helper) · `AuthResponse` · `LocationRequest` |
| `data/repository/` | Auth · Order · Location · DeviceToken |
| `ui/auth/` | `LoginScreen` · `LoginViewModel` |
| `ui/orders/` | `OrdersListScreen` · `OrderDetailScreen` · ViewModels · `OrderCard` · `StatusChip` · `StatusActionButton` |
| `ui/map/` | `MapScreen` (Maps Compose) · `MapViewModel` |
| `location/` | `LocationTrackingService` (foreground) · `LocationClient` (Flow) · `LocationUploadWorker` (WorkManager retry) |
| `notification/` | `GanrajMessagingService` · `NotificationHelper` |

### Behaviour notes

- JWT is stored in `EncryptedSharedPreferences`. Any 401 clears it and the app returns to login.
- Drivers can only move forward: Assigned → Picked Up → In Transit → Delivered. The backend enforces this too.
- GPS tracking starts automatically when an order becomes Picked Up / In Transit and stops on Delivered or Cancelled.
- Failed GPS posts are saved locally and retried by WorkManager when the network comes back — no positions are lost.
- For tracking with the screen off, the driver must set location permission to **"Allow all the time"** (the order screen prompts for it).

---

## 📡 API Contract

> **Base URL (production):** `https://api.yourdomain.com`  
> **Auth header (all protected routes):** `Authorization: Bearer <jwt>`

| # | Method | Endpoint | Role | Client |
|---|--------|----------|------|--------|
| 1 | `POST` | `/api/auth/login` | — | Both |
| 2 | `POST` | `/api/orders` | DISPATCHER | Web admin |
| 3 | `GET` | `/api/orders?page=&size=&status=` | DISPATCHER (all) / DRIVER (own) | Both |
| 4 | `GET` | `/api/orders/{id}` | DISPATCHER / assigned DRIVER | Both |
| 5 | `PATCH` | `/api/orders/{id}/assign` | DISPATCHER | Web admin |
| 6 | `PATCH` | `/api/orders/{id}/status` | DRIVER (own order only) | Android |
| 7 | `POST` | `/api/locations` | DRIVER | Android |
| 8 | `GET` | `/api/locations/drivers/latest` | DISPATCHER | Web admin |
| 9 | `GET` | `/api/users/drivers` | DISPATCHER | Web admin |
| 10 | `POST` | `/api/devices/token` | DRIVER | Android |

### Standard error response

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "You are not assigned to this order",
  "fieldErrors": {}
}
```

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Validation failure — `fieldErrors` populated |
| `401` | Missing or expired JWT |
| `403` | Wrong role, or driver accessing another driver's order |
| `404` | Resource not found |
| `409` | Invalid status transition (e.g. re-delivering an order) |

---

## 🗄 Database Schema

> All tables are created and managed exclusively by **Flyway**. Hibernate never alters the schema in production (`ddl-auto: validate`).

```sql
users (
  id BIGINT PK, name VARCHAR(100), email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255), role VARCHAR(20),
  phone VARCHAR(20), active BOOLEAN, created_at DATETIME(6)
)

orders (
  id BIGINT PK, reference VARCHAR(20) UNIQUE,
  pickup_address TEXT, pickup_lat DOUBLE, pickup_lng DOUBLE,
  drop_address TEXT, drop_lat DOUBLE, drop_lng DOUBLE,
  customer_name VARCHAR(100), customer_phone VARCHAR(20),
  item_description TEXT, status VARCHAR(20),
  created_by BIGINT FK→users, assigned_driver_id BIGINT FK→users,
  created_at DATETIME(6), updated_at DATETIME(6)
)

deliveries (
  id BIGINT PK, order_id BIGINT FK→orders, driver_id BIGINT FK→users,
  assigned_at DATETIME(6), picked_up_at DATETIME(6), delivered_at DATETIME(6)
)

location_updates (
  id BIGINT PK, driver_id BIGINT FK→users,
  latitude DOUBLE, longitude DOUBLE,
  accuracy DOUBLE, speed DOUBLE, recorded_at DATETIME(6)
  -- INDEX (driver_id, recorded_at)
)

device_tokens (
  id BIGINT PK, user_id BIGINT FK→users,
  fcm_token VARCHAR(512), created_at DATETIME(6)
)
```

---

## 💻 Local Development

### Prerequisites

| Tool | Version | For |
|------|---------|-----|
| Node.js + npm | 20+ / 10+ | `frontend/` |
| JDK | 21 | `fleettracker-backend/` |
| MySQL | 8 | Backend database |
| Android Studio | Ladybug or newer | `GanrajDriver/` |

> **MySQL via Docker (quickest):**
> ```bash
> docker run --name ganraj-mysql \
>   -e MYSQL_ROOT_PASSWORD=root \
>   -e MYSQL_DATABASE=fleet_tracker \
>   -p 3306:3306 -d mysql:8
> ```

---

### Step 1 — Backend

```bash
cd fleettracker-backend

# Copy and configure environment
cp .env.example .env
# Minimum required: DB_URL, DB_USER, DB_PASSWORD, JWT_SECRET

# Start — Flyway runs all migrations automatically on first boot
./mvnw spring-boot:run

# Confirm it's healthy
curl http://localhost:8080/actuator/health
# → {"status":"UP"}
```

**Default local values (no `.env` needed for a first run):**

| Variable | Default |
|----------|---------|
| `DB_URL` | `jdbc:mysql://localhost:3306/fleet_tracker` |
| `DB_USER` | `fleet` |
| `DB_PASSWORD` | `fleet` |
| `JWT_SECRET` | dev placeholder (change before production) |

---

### Step 2 — Seed users

Connect to MySQL and insert at least one dispatcher and one driver:

```sql
-- Generate a real BCrypt hash first:
-- htpasswd -bnBC 10 "" yourpassword | tr -d ':\n'

INSERT INTO users (name, email, password_hash, role, phone, active) VALUES
  ('Ganraj Admin',  'admin@ganrajlogistics.in', '$2a$10$REPLACE_WITH_REAL_HASH', 'DISPATCHER', '8108767159', true),
  ('Test Driver',   'driver@ganrajlogistics.in','$2a$10$REPLACE_WITH_REAL_HASH', 'DRIVER',     '9987051430', true);
```

---

### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
# Admin panel: http://localhost:3000/#admin
```

---

### Step 4 — Android app

1. Open `GanrajDriver/` in **Android Studio** and let Gradle sync (~2 min first time).
2. Run the `app` target on an emulator or a phone running Android 8+ (API 26+).
3. The app starts in **demo mode** — log in with `driver@ganraj.demo` / `Driver@123`.

To connect to the local backend, edit `GanrajDriver/local.properties`:

```properties
DEMO_MODE=false
API_BASE_URL=http://10.0.2.2:8080/      # emulator → your PC
# API_BASE_URL=http://192.168.x.x:8080/ # real phone → your PC's LAN IP
MAPS_API_KEY=your-google-maps-key
```

---

## 🔐 Environment Variables

### Backend (`fleettracker-backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URL` | ✅ | JDBC URL — e.g. `jdbc:mysql://<host>:3306/fleettracker?useSSL=true&serverTimezone=UTC` |
| `DB_USER` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |
| `JWT_SECRET` | ✅ | 64+ random chars — `openssl rand -base64 64` |
| `JWT_EXPIRY_MS` | ✅ | Token lifetime ms — `86400000` = 24 h |
| `ALLOWED_ORIGINS` | ✅ | CORS origin(s) — e.g. `https://your-app.vercel.app` |
| `FIREBASE_ENABLED` | ⬜ | `true` to enable FCM push |
| `FIREBASE_CREDENTIALS` | ⬜ | Path to service account JSON — `/run/secrets/firebase.json` |
| `LOCATION_RETENTION_DAYS` | ⬜ | Purge GPS rows older than N days — default `7` |
| `SPRING_PROFILES_ACTIVE` | ✅ prod | Set to `prod` on the server |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL — appears in browser bundle, no secrets here |
| `ADMIN_JWT_SECRET` | ✅ | Server-only secret for the admin session cookie |

### Android (`GanrajDriver/local.properties`)

| Variable | Description |
|----------|-------------|
| `DEMO_MODE` | `true` = offline demo; `false` = real backend |
| `API_BASE_URL` | Debug URL — `http://10.0.2.2:8080/` for emulator |
| `API_BASE_URL_RELEASE` | Release URL — `https://api.yourdomain.com/` |
| `MAPS_API_KEY` | Google Maps SDK key (restrict to package + SHA-1) |

> ⚠️ `local.properties`, `*.jks` keystores, and `google-services.json` are in `.gitignore` and must **never** be committed.

---

## ☁️ AWS Deployment Guide

### Architecture on AWS

```
  Android App ──┐
                ├──► https://api.yourdomain.com ──► EC2 t3.small
Next.js/Vercel ─┘    (Nginx :443 → Docker :8080)    └──► RDS MySQL (private)
                                │
                                └──► Firebase FCM ──► Android devices
```

---

### 1 — Account safety (do this before anything else)

- Enable **MFA** on the root account; create an IAM admin user and stop using root daily.
- **Billing → Budgets**: set a $5 budget with email alerts at 50%, 80%, 100%.
- Enable **Free Tier usage alerts** and billing alerts.
- Pick one region and stay there — `ap-south-1` (Mumbai) for lowest latency in India.
- Set a calendar reminder for when the free plan / credits expire.

---

### 2 — Security groups

| Group | Port | Source | Purpose |
|-------|------|--------|---------|
| `sg-ec2` | 22 | **Your IP only** | SSH — never open to the internet |
| `sg-ec2` | 80, 443 | `0.0.0.0/0` | Web traffic |
| `sg-rds` | 3306 | `sg-ec2` | MySQL — never publicly accessible |

To inspect the database from your laptop, use an SSH tunnel:
```bash
ssh -i key.pem -L 3307:<rds-endpoint>:3306 ubuntu@<ec2-ip>
mysql -h 127.0.0.1 -P 3307 -u fleet_app -p fleettracker
```

---

### 3 — RDS MySQL 8

- Template: **Free tier / Dev-Test** · single-AZ · `db.t4g.micro` or `db.t3.micro`
- Storage: gp3, 20 GB, autoscaling **off**
- Public access: **No** · Subnet group in the same VPC as EC2
- Automated backups: on, 7-day retention · Deletion protection: on

Create the database and restricted app user:
```sql
CREATE DATABASE fleettracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fleet_app'@'%' IDENTIFIED BY '<long-random-password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON fleettracker.* TO 'fleet_app'@'%';
```

---

### 4 — EC2 instance

- **AMI:** Ubuntu 24.04 LTS
- **Size:** `t3.small` (2 GB RAM) recommended — Spring Boot is memory-hungry
  - If using `t3.micro`: add 1–2 GB swap and pass `-Xmx384m` to the JVM
- Allocate an **Elastic IP** so the address survives reboots (released when you tear down)

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
sudo usermod -aG docker ubuntu
sudo mkdir -p /opt/fleet && sudo chown ubuntu /opt/fleet
```

---

### 5 — Dockerfile

```dockerfile
# fleettracker-backend/Dockerfile
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

---

### 6 — `/opt/fleet/docker-compose.yml` on the server

```yaml
services:
  backend:
    image: ghcr.io/<your-github-user>/fleet-backend:latest
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:8080:8080"       # only Nginx on the same host can reach it
    volumes:
      - ./firebase.json:/run/secrets/firebase.json:ro
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/actuator/health"]
      interval: 30s
      retries: 3
```

---

### 7 — Nginx + HTTPS

> A domain name is **required** — browsers block HTTP API calls from an HTTPS page (Vercel). Use Route 53, any registrar, or a free subdomain from DuckDNS. Let's Encrypt cannot issue certificates for bare IPs.

```nginx
# /etc/nginx/sites-available/fleet
server {
    server_name api.yourdomain.com;
    client_max_body_size 1m;
    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fleet /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com    # HTTPS + auto-renewal
```

---

### 8 — First deploy (manual)

```bash
cd /opt/fleet
# Pull and start
docker compose pull && docker compose up -d
# Watch Flyway create all 5 tables on first start
docker compose logs -f backend
# Confirm healthy
curl https://api.yourdomain.com/actuator/health
```

---

### 9 — Vercel (frontend)

1. **Import** repository → Root directory: `frontend` → Framework: **Next.js**
2. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL  =  https://api.yourdomain.com
   ADMIN_JWT_SECRET     =  <64-char random string>
   ```
3. After deploy, copy the Vercel URL → backend `ALLOWED_ORIGINS` env var → redeploy backend

---

### 10 — Android release build

```properties
# GanrajDriver/local.properties
API_BASE_URL_RELEASE=https://api.yourdomain.com/
MAPS_API_KEY=<your-key — restrict to package + release SHA-1>
```

- Add the release SHA-1 to your Firebase project settings
- Re-download `google-services.json` and rebuild
- Create a release keystore, back it up securely, and never commit it
- Test login, push notifications, and live GPS on a **real phone** before shipping

---

### Deployment order

```
[ ] 1. MFA, IAM admin user, billing budget
[ ] 2. Create security groups
[ ] 3. Create RDS instance, create DB + app user
[ ] 4. Launch EC2, allocate Elastic IP
[ ] 5. Install Docker + Nginx on EC2
[ ] 6. Domain A record pointing to Elastic IP
[ ] 7. Nginx config + certbot HTTPS
[ ] 8. Place .env and firebase.json in /opt/fleet/
[ ] 9. docker compose up -d — verify Flyway and health check
[ ] 10. Seed dispatcher and driver users
[ ] 11. Enable GitHub Actions (add EC2_HOST and EC2_SSH_KEY secrets)
[ ] 12. Deploy frontend to Vercel, set ALLOWED_ORIGINS
[ ] 13. Build Android release APK — test end-to-end on a real device
[ ] 14. Monitor: CloudWatch alarms, UptimeRobot health check ping
```

---

## ⚡ CI/CD Pipeline

### Backend (`.github/workflows/backend.yml`)

Triggers on any push to `main` that changes `fleettracker-backend/`:

```
push → maven test → docker build → push to GHCR → SSH deploy to EC2
```

```yaml
name: Backend CI/CD
on:
  push:
    branches: [main]
    paths: ["fleettracker-backend/**"]
jobs:
  test-build-deploy:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 21, cache: maven }
      - run: mvn -q -f fleettracker-backend/pom.xml test
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
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
            docker compose pull && docker compose up -d --remove-orphans
            docker image prune -f
```

**Required repository secrets:** `EC2_HOST` · `EC2_SSH_KEY`

### Frontend (`.github/workflows/frontend.yml`)

Triggers on pushes that change `frontend/` — runs ESLint and Next.js type-check build.

---

## 🔒 Security Checklist

> Check every item before going live.

| | Item |
|-|------|
| ☐ | RDS public access is **off**; `sg-rds` allows only `sg-ec2` |
| ☐ | EC2 SSH port 22 limited to your IP; key-only auth (`PasswordAuthentication no`) |
| ☐ | `JWT_SECRET` and `DB_PASSWORD` only in `/opt/fleet/.env` — never in git |
| ☐ | Firebase service account JSON at `/opt/fleet/firebase.json` chmod 600 — never in git or Docker image |
| ☐ | `local.properties`, keystore files, `google-services.json` confirmed in `.gitignore` |
| ☐ | Google Maps API key restricted to package name + release SHA-1 fingerprint |
| ☐ | `ddl-auto: validate` — Flyway owns the schema exclusively |
| ☐ | Rate limiting on `/api/auth/login` and `/api/locations` |
| ☐ | Driver-order ownership enforced in `OrderService` (service layer, not just role) |
| ☐ | Docker log rotation configured (`max-size: 10m`, `max-file: 3`) |
| ☐ | CloudWatch alarms on EC2 CPU, RDS free storage, and status checks |
| ☐ | External uptime monitor pinging `/actuator/health` every 5 minutes |
| ☐ | Demo credentials removed from the admin login screen |
| ☐ | Production dispatcher user seeded with a strong, unique password |

---

## 🛠 Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Backend can't reach MySQL | `sg-rds` missing rule from `sg-ec2`, or wrong endpoint | Check security groups; verify endpoint in `.env` |
| Browser blocked, Postman works | CORS origin mismatch, or HTTP vs HTTPS (mixed content) | Set `ALLOWED_ORIGINS` to exact Vercel URL; ensure backend has a domain + cert |
| Container keeps restarting | OOM on t3.micro, or missing env var | Add swap; pass `-Xmx384m`; check `docker compose logs` |
| Flyway fails on startup | Schema mismatch from a manual edit, or app user lacks DDL grants | Re-check migrations; verify `GRANT CREATE, ALTER` to `fleet_app` |
| Push notifications don't arrive | Missing/wrong service account JSON, wrong Firebase project, or Android 13+ permission denied | Verify path in `FIREBASE_CREDENTIALS`; re-download `google-services.json`; check notification permission on device |
| Times off by 5.5 hours | Mixed UTC/IST timezones | Pass `?serverTimezone=UTC` in JDBC URL; store all times in UTC; convert in UI |
| Android app can't connect | `localhost` instead of `10.0.2.2` for emulator, or cleartext blocked in release | Use `10.0.2.2` for emulator; ensure release network config requires HTTPS |
| Driver can't update order status | 403 — driver not assigned to that order | Check `assigned_driver_id` in the orders table; re-assign if needed |

---

<div align="center">

---

**Ganraj Logistics Service**

*Reliable Transport. On Time. Every Time.*

📞 8108767159 &nbsp;·&nbsp; 📞 99870 51430 &nbsp;·&nbsp; ✉️ ganrajlogisticsservice@gmail.com

---

*This is a private, production codebase built for a real client.*  
*Do not publish API keys, credentials, database contents, or customer data.*

</div>
