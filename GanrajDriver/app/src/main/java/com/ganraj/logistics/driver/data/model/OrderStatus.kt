package com.ganraj.logistics.driver.data.model

import kotlinx.serialization.Serializable

/** Must match the backend enum and the dashboard constants exactly. */
@Serializable
enum class OrderStatus(val label: String) {
    CREATED("Created"),
    ASSIGNED("Assigned"),
    PICKED_UP("Picked up"),
    IN_TRANSIT("In transit"),
    DELIVERED("Delivered"),
    CANCELLED("Cancelled");

    /** The only status a driver may move to from here, or null when nothing more can be done. */
    fun next(): OrderStatus? = when (this) {
        ASSIGNED -> PICKED_UP
        PICKED_UP -> IN_TRANSIT
        IN_TRANSIT -> DELIVERED
        else -> null
    }

    val isFinal: Boolean get() = this == DELIVERED || this == CANCELLED

    /** True while the phone should be sharing its location. */
    val isTracking: Boolean get() = this == PICKED_UP || this == IN_TRANSIT
}
