package com.ganraj.logistics.driver.core.util

object Constants {
    /** How often the driver's position is posted while an order is active. */
    const val LOCATION_INTERVAL_MS = 8_000L
    const val PAGE_SIZE = 20
    const val EXTRA_ORDER_ID = "orderId"
    const val CHANNEL_ORDERS = "orders"
    const val CHANNEL_TRACKING = "tracking"
    /** Offline positions older than this are discarded instead of being retried forever. */
    const val MAX_PENDING_LOCATIONS = 500
}
