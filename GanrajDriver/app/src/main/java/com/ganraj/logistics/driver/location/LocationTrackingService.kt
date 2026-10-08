package com.ganraj.logistics.driver.location

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.ganraj.logistics.driver.core.util.Constants
import com.ganraj.logistics.driver.data.repository.LocationRepository
import com.ganraj.logistics.driver.notification.NotificationHelper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.conflate
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Foreground service (type location) that keeps posting the driver's position while an order is
 * PICKED_UP or IN_TRANSIT, even with the screen off. Started and stopped from the order detail screen.
 */
@AndroidEntryPoint
class LocationTrackingService : Service() {

    @Inject lateinit var locationClient: LocationClient
    @Inject lateinit var locationRepository: LocationRepository

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var job: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!PermissionHelper.hasLocation(this)) {
            stopSelf()
            return START_NOT_STICKY
        }
        try {
            ServiceCompat.startForeground(
                this, NOTIFICATION_ID, NotificationHelper.trackingNotification(this),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } catch (e: Exception) {
            stopSelf()
            return START_NOT_STICKY
        }
        job?.cancel()
        job = scope.launch {
            locationClient.updates(Constants.LOCATION_INTERVAL_MS)
                .conflate()
                .collect { locationRepository.post(it.latitude, it.longitude, it.accuracy) }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        private const val NOTIFICATION_ID = 1001

        fun start(context: Context) {
            ContextCompat.startForegroundService(context, Intent(context, LocationTrackingService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, LocationTrackingService::class.java))
        }
    }
}
