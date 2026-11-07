package com.ganraj.logistics.domain.model

import java.time.LocalDate

data class Booking(
    val id: Int,
    val reference: String,
    val pickupLocation: String,
    val deliveryLocation: String,
    val material: String,
    val quantity: String,
    val vehicleType: String,
    val pickupDate: LocalDate?,
    val customerName: String,
    val phone: String,
    val status: BookingStatus,
    val createdAt: String,
    val history: List<StatusHistory> = emptyList()
)
