package com.ganraj.logistics.driver.core.storage

import android.content.Context
import com.ganraj.logistics.driver.core.util.Constants
import com.ganraj.logistics.driver.data.model.LocationRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/** Positions that could not be posted (no signal). LocationUploadWorker sends them later, oldest first. */
@Singleton
class PendingLocationStore @Inject constructor(@ApplicationContext context: Context) {

    private val prefs = context.getSharedPreferences("pending_locations", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val serializer = ListSerializer(LocationRequest.serializer())
    private val lock = Any()

    fun add(item: LocationRequest) = synchronized(lock) {
        val list = (read() + item).takeLast(Constants.MAX_PENDING_LOCATIONS)
        write(list)
    }

    fun peek(limit: Int): List<LocationRequest> = synchronized(lock) { read().take(limit) }

    fun removeFirst(count: Int) = synchronized(lock) { write(read().drop(count)) }

    fun clear() = synchronized(lock) { write(emptyList()) }

    fun isEmpty(): Boolean = synchronized(lock) { read().isEmpty() }

    private fun read(): List<LocationRequest> {
        val raw = prefs.getString(KEY, null) ?: return emptyList()
        return runCatching { json.decodeFromString(serializer, raw) }.getOrDefault(emptyList())
    }

    private fun write(list: List<LocationRequest>) {
        prefs.edit().putString(KEY, json.encodeToString(serializer, list)).apply()
    }

    private companion object { const val KEY = "items" }
}
