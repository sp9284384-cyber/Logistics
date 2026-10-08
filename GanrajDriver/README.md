# Ganraj Driver (Android)

Native driver app for **Ganraj Logistics Service**: Kotlin, Jetpack Compose, MVVM, Hilt, Retrofit,
Fused Location + Maps Compose, WorkManager, Firebase Cloud Messaging. Package: `com.ganraj.logistics.driver`.

Screen flow: **Login -> Orders list -> Order detail (status, navigate, tracking) -> Map**

## Run it (2 minutes)

1. Open this folder in **Android Studio** (Ladybug or newer, JDK 17). Let it sync (it creates the Gradle wrapper; Gradle 8.9+).
2. Run the `app` configuration on an emulator or phone (API 26+).
3. Log in with the **demo account** (also shown on the login screen in debug builds):

| Email | Password |
| --- | --- |
| `driver@ganraj.demo` | `Driver@123` |

These exist only inside the app's offline **demo mode** (`DemoApiService`). The real backend does not know them.
Demo mode is on by default in debug builds and is always off in release builds.

## Use the real backend

Copy `local.properties.example` to `local.properties` and set:

```
DEMO_MODE=false
API_BASE_URL=http://10.0.2.2:8080/        # emulator -> your PC. Real phone: your PC's LAN IP
API_BASE_URL_RELEASE=https://api.yourdomain.com/
MAPS_API_KEY=your-key
```

Then log in with a **DRIVER** user that exists in your MySQL `users` table (seed one with a BCrypt hash; see the
overview's deployment section). A DISPATCHER account is rejected by this app on purpose.

The app talks to the shared API contract in the overview doc (endpoints #1, #3, #4, #6, #7, #10).
For pushes, the backend must send FCM **data** field `orderId` so a tapped notification opens that order.

## Optional extras

- **Push notifications:** put `google-services.json` in `app/`. Without it, push is simply off and nothing crashes.
- **Map tiles:** need `MAPS_API_KEY` (billing-enabled Google Cloud project; restrict the key to the package name + SHA-1).
- **Release build:** needs your own signing config. Never commit keystores or `local.properties`.

## Structure

```
GanrajDriver/
├── settings.gradle.kts, build.gradle.kts, gradle.properties, local.properties.example, .gitignore
├── gradle/libs.versions.toml                 version catalog
└── app/
    ├── build.gradle.kts, proguard-rules.pro
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml
        │   ├── java/com/ganraj/logistics/driver/
        │   │   ├── GanrajApp.kt              @HiltAndroidApp, WorkManager + notification channels
        │   │   ├── MainActivity.kt           single activity, handles push taps
        │   │   ├── di/                       NetworkModule, StorageModule, LocationModule
        │   │   ├── core/
        │   │   │   ├── network/              ApiService, AuthInterceptor, ApiResult, DemoApiService
        │   │   │   ├── storage/              TokenStorage (encrypted), PendingLocationStore
        │   │   │   └── util/                 Constants, DateFormatters, ContactActions, OrderEvents
        │   │   ├── data/
        │   │   │   ├── model/                LoginRequest, AuthResponse, Order, OrderStatus, ...
        │   │   │   └── repository/           Auth, Order, Location, DeviceToken
        │   │   ├── ui/
        │   │   │   ├── navigation/           AppNavGraph, Routes, SessionViewModel
        │   │   │   ├── theme/                Color, Type, Theme (navy / orange / white)
        │   │   │   ├── auth/                 LoginScreen, LoginViewModel
        │   │   │   ├── orders/               list, detail, ViewModels, components/ (OrderCard, StatusChip, StatusActionButton)
        │   │   │   ├── map/                  MapScreen, MapViewModel
        │   │   │   └── components/           LoadingView, ErrorView, EmptyView
        │   │   ├── location/                 LocationTrackingService, LocationClient, LocationUploadWorker, PermissionHelper
        │   │   └── notification/             GanrajMessagingService, NotificationHelper
        │   └── res/                          strings, colors, theme, logo (gls_logo.png), launcher icon, network config
        ├── debug/res/xml/network_security_config.xml   allows http for the emulator (debug only)
        ├── test/                             OrderStatus, LoginViewModel, OrdersViewModel, OrderRepository (MockWebServer)
        └── androidTest/                      LoginScreenTest
```

## Behaviour notes

- Token is stored in EncryptedSharedPreferences. Any 401 clears it and the app returns to login.
- Drivers only move forward: Assigned -> Picked up -> In transit -> Delivered (the backend enforces it too).
- Live tracking (foreground service) starts when an order becomes Picked up / In transit and stops on Delivered / Cancelled,
  posting every 8 seconds. Failed posts are saved and retried by WorkManager when the phone is online again.
- For tracking with the screen off, the driver should set location to "Allow all the time" (the order screen prompts for it).
- Support phone/WhatsApp number is `support_phone` in `strings.xml` (currently the banner's 8108767159).
