package com.ganraj.logistics.util

object Validators {

    fun required(value: String, label: String): String? =
        if (value.isBlank()) "$label is required" else null

    /** Accepts 10-digit Indian mobile numbers with optional +91 / 91 prefix. */
    fun phone(value: String): String? {
        val digits = value.filter { it.isDigit() }
        val normalized = when {
            digits.length == 12 && digits.startsWith("91") -> digits.drop(2)
            digits.length == 11 && digits.startsWith("0") -> digits.drop(1)
            else -> digits
        }
        return when {
            normalized.isEmpty() -> "Phone number is required"
            normalized.length != 10 -> "Enter a valid 10-digit mobile number"
            normalized.first() !in '6'..'9' -> "Enter a valid Indian mobile number"
            else -> null
        }
    }
}
