package com.ganraj.logistics.driver.location

import android.annotation.SuppressLint
import android.location.Location
import android.os.Looper
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton
import com.google.android.gms.location.LocationRequest as GmsLocationRequest

/** Wraps the Fused Location Provider and exposes updates as a Flow. Callers must hold location permission. */
@Singleton
class LocationClient @Inject constructor(private val fused: FusedLocationProviderClient) {

    @SuppressLint("MissingPermission")
    fun updates(intervalMs: Long): Flow<Location> = callbackFlow {
        val request = GmsLocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, intervalMs)
            .setMinUpdateIntervalMillis(intervalMs / 2)
            .build()
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(it) }
            }
        }
        fused.requestLocationUpdates(request, callback, Looper.getMainLooper())
        awaitClose { fused.removeLocationUpdates(callback) }
    }

    @SuppressLint("MissingPermission")
    suspend fun lastLocation(): Location? = runCatching { fused.lastLocation.await() }.getOrNull()
}
