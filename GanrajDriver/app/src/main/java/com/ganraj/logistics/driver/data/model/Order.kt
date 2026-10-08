package com.ganraj.logistics.driver.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Order(
    val id: Long,
    val reference: String,
    val status: OrderStatus,
    val pickupAddress: String,
    val pickupLat: Double? = null,
    val pickupLng: Double? = null,
    val dropAddress: String,
    val dropLat: Double? = null,
    val dropLng: Double? = null,
    val customerName: String,
    val customerPhone: String? = null,
    val itemDescription: String? = null,
    val driverId: Long? = null,
    val driverName: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
