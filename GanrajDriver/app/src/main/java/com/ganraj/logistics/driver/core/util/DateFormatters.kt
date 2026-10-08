package com.ganraj.logistics.driver.core.util

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/** The API always sends and receives ISO-8601 UTC. We only convert to local time for display. */
object DateFormatters {
    private val display = DateTimeFormatter.ofPattern("dd MMM, hh:mm a", Locale.ENGLISH)
        .withZone(ZoneId.systemDefault())

    fun nowIso(): String = Instant.now().toString()

    fun formatForDisplay(iso: String?): String =
        runCatching { display.format(Instant.parse(iso)) }.getOrDefault("-")
}
