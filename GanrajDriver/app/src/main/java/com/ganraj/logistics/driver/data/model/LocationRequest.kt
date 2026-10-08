package com.ganraj.logistics.driver.data.model

import kotlinx.serialization.Serializable

/** Body of POST /api/locations. [recordedAt] is ISO-8601 UTC. */
@Serializable
data class LocationRequest(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float? = null,
    val recordedAt: String
)

@Serializable
data class DeviceTokenRequest(val fcmToken: String)
