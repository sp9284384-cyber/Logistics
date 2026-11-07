package com.ganraj.logistics.domain.model

/** Must match the backend status constants exactly, or PATCH will return 422. */
enum class BookingStatus(val label: String) {
    NEW("New"),
    QUOTED("Quoted"),
    VEHICLE_ASSIGNED("Vehicle Assigned"),
    IN_TRANSIT("In Transit"),
    DELIVERED("Delivered"),
    CANCELLED("Cancelled");

    companion object {
        fun fromBackend(value: String): BookingStatus =
            entries.firstOrNull { it.label.equals(value, ignoreCase = true) } ?: NEW
    }
}
