# Gson model classes keep their field names so the JSON mapping never breaks.
-keepclassmembers class com.ganraj.logistics.data.remote.dto.** {
    <fields>;
}
-keep class com.ganraj.logistics.data.remote.dto.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**
