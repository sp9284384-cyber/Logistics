# Ganraj Logistics — Android App

Native Android companion to the **Ganraj Logistics** web app (FastAPI + React).
Same backend, same endpoints — the app never touches PostgreSQL directly.

```
Android (Kotlin/Compose) ──HTTPS/JSON──► FastAPI ──SQLAlchemy──► PostgreSQL
```

## Stack
Jetpack Compose · MVVM · Retrofit (Gson) · Hilt DI · Encrypted DataStore (JWT) · Navigation Compose

## Branding
Navy `#0A1E3C` + Orange `#F97316` + white, matching the printed banner.
All company details (phone 8108767159, WhatsApp, email, GST, address) live in `util/Constants.kt`.

## Setup

1. Open the project in **Android Studio** (Ladybug or newer).
2. Copy `local.properties.example` → `local.properties` and set your SDK path.
3. Set the API URL in `app/build.gradle.kts`:
   - **debug** (emulator): `http://10.0.2.2:8000/api/v1/`
   - **real phone on same Wi-Fi**: use your computer's LAN IP (e.g. `http://192.168.1.5:8000/api/v1/`) and run the backend with `--host 0.0.0.0`
   - **release**: `https://api.ganrajlogistics.in/api/v1/`
4. Run on an emulator or device.

## Project map
| Layer | Where |
|---|---|
| Retrofit endpoints | `data/remote/ApiService.kt` |
| Auth header injection | `data/remote/AuthInterceptor.kt` |
| Encrypted JWT storage | `data/local/TokenStore.kt` (Android Keystore AES/GCM) |
| Business rules / API errors | `data/repository/` |
| App-side models | `domain/model/` |
| Hilt wiring | `di/` |
| Screens | `ui/home`, `ui/about`, `ui/services`, `ui/contact`, `ui/booking`, `ui/admin` |
| Shared UI pieces | `ui/components/` |
| Validation, intents, helpers | `util/` |

## Endpoints used
| Endpoint | Caller |
|---|---|
| `POST /bookings` | BookingViewModel → BookingRepository.submit() |
| `POST /admin/login` | LoginViewModel → AdminRepository.login() |
| `GET /admin/me` | SessionCheckViewModel (token check on app start) |
| `GET /admin/bookings?status=&search=&page=` | DashboardViewModel |
| `GET /admin/bookings/{id}` | BookingDetailViewModel |
| `PATCH /admin/bookings/{id}/status` | BookingDetailViewModel |

## Error handling
| Response | App behaviour |
|---|---|
| 201/200 | Next screen |
| 422 | Field errors shown under each form field |
| 401 | Token cleared, back to Admin Login |
| 429 | "Too many attempts" message |
| 5xx / offline | Retry message, form data preserved |

## Gotchas (from experience)
- **Trailing slash**: Retrofit `baseUrl` must end with `/`; endpoint paths must not start with `/`.
- **Emulator vs phone**: emulator → `10.0.2.2`; phone → LAN IP + backend `--host 0.0.0.0`.
- **HTTP only in debug**: `network_security_config.xml` allows cleartext for `10.0.2.2` only. Release = HTTPS only.
- **Status names**: `BookingStatus.kt` must match the backend exactly or PATCH returns 422.

## Tests
- Unit: `ValidatorsTest`, `BookingRepositoryTest` (fake ApiService), `BookingViewModelTest`
- UI: `BookingFlowTest` — fills the form and reaches the success screen

## Release build
```bash
./gradlew assembleRelease
```
Generate a signing keystore, add signing config, and use the release `API_URL` (HTTPS).
