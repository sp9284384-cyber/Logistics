package com.ganraj.logistics.driver.data.repository

import android.content.Context
import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.network.ApiService
import com.ganraj.logistics.driver.core.network.safeApiCall
import com.ganraj.logistics.driver.core.storage.PendingLocationStore
import com.ganraj.logistics.driver.core.util.DateFormatters
import com.ganraj.logistics.driver.data.model.LocationRequest
import com.ganraj.logistics.driver.location.LocationUploadWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationRepository @Inject constructor(
    private val api: ApiService,
    private val pending: PendingLocationStore,
    @ApplicationContext private val context: Context
) {
    /** Posts one position. If it can't be sent right now, it is saved and retried by WorkManager. */
    suspend fun post(latitude: Double, longitude: Double, accuracy: Float?) {
        val request = LocationRequest(latitude, longitude, accuracy, DateFormatters.nowIso())
        if (!pending.isEmpty()) {
            // keep order: older positions first
            pending.add(request)
            LocationUploadWorker.enqueue(context)
            return
        }
        when (val result = send(request)) {
            is ApiResult.Success -> Unit
            is ApiResult.Error -> if (shouldRetry(result)) {
                pending.add(request)
                LocationUploadWorker.enqueue(context)
            }
            ApiResult.Loading -> Unit
        }
    }

    /** Sends saved positions oldest-first. Returns true when nothing is left to retry. */
    suspend fun flushPending(): Boolean {
        while (true) {
            val batch = pending.peek(20)
            if (batch.isEmpty()) return true
            var sent = 0
            for (item in batch) {
                val result = send(item)
                if (result is ApiResult.Error && shouldRetry(result)) {
                    pending.removeFirst(sent)
                    return false
                }
                sent++ // success, or a rejected position that will never succeed: drop it
            }
            pending.removeFirst(sent)
        }
    }

    private suspend fun send(request: LocationRequest): ApiResult<Unit> =
        when (val r = safeApiCall { api.postLocation(request) }) {
            is ApiResult.Success ->
                if (r.data.isSuccessful) ApiResult.Success(Unit)
                else ApiResult.Error("HTTP ${r.data.code()}", r.data.code())
            is ApiResult.Error -> r
            ApiResult.Loading -> ApiResult.Loading
        }

    /** Network problems, timeouts, rate limits and 5xx are retried. Other 4xx will never succeed. */
    private fun shouldRetry(error: ApiResult.Error): Boolean {
        val code = error.code ?: return true
        return code == 408 || code == 429 || code >= 500
    }
}
