package com.ganraj.logistics.driver.data.repository

import android.content.Context
import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.network.ApiService
import com.ganraj.logistics.driver.core.network.safeApiCall
import com.ganraj.logistics.driver.data.model.DeviceTokenRequest
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DeviceTokenRepository @Inject constructor(
    private val api: ApiService,
    @ApplicationContext private val context: Context
) {
    /** True when google-services.json was added and Firebase started. Without it, push is simply off. */
    private fun firebaseReady(): Boolean = FirebaseApp.getApps(context).isNotEmpty()

    /** Fetches the current FCM token and sends it to the backend. Safe to call any time. */
    suspend fun registerCurrent(): Boolean {
        if (!firebaseReady()) return false
        val token = runCatching { FirebaseMessaging.getInstance().token.await() }.getOrNull() ?: return false
        return register(token)
    }

    suspend fun register(token: String): Boolean =
        safeApiCall { api.registerDeviceToken(DeviceTokenRequest(token)) } is ApiResult.Success
}
