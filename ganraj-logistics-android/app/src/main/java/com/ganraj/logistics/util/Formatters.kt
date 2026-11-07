package com.ganraj.logistics.util

import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

object Formatters {

    private val apiDate = DateTimeFormatter.ISO_LOCAL_DATE
    private val displayDate = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH)

    /** "2026-11-01" -> "01 Nov 2026" */
    fun formatDate(iso: String?): String =
        iso?.let { runCatching { LocalDate.parse(it.take(10), apiDate).format(displayDate) }.getOrNull() }
            ?: "Not set"

    fun formatDate(date: LocalDate?): String = date?.format(displayDate) ?: "Not set"

    fun inr(amount: Double): String =
        "₹" + NumberFormat.getNumberInstance(Locale("en", "IN")).format(amount)
}
