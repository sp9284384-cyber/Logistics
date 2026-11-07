package com.ganraj.logistics.data.mapper

import com.ganraj.logistics.data.remote.dto.BookingDetailDto
import com.ganraj.logistics.data.remote.dto.BookingListItemDto
import com.ganraj.logistics.data.remote.dto.StatusHistoryDto
import com.ganraj.logistics.domain.model.Booking
import com.ganraj.logistics.domain.model.BookingStatus
import com.ganraj.logistics.domain.model.StatusHistory
import java.time.LocalDate

fun BookingListItemDto.toDomain(): Booking = Booking(
    id = id,
    reference = reference,
    pickupLocation = pickupLocation,
    deliveryLocation = deliveryLocation,
    material = material,
    quantity = quantity,
    vehicleType = vehicleType,
    pickupDate = pickupDate?.let { runCatching { LocalDate.parse(it.take(10)) }.getOrNull() },
    customerName = customerName,
    phone = phone,
    status = BookingStatus.fromBackend(status),
    createdAt = createdAt
)

fun BookingDetailDto.toDomain(): Booking = Booking(
    id = id,
    reference = reference,
    pickupLocation = pickupLocation,
    deliveryLocation = deliveryLocation,
    material = material,
    quantity = quantity,
    vehicleType = vehicleType,
    pickupDate = pickupDate?.let { runCatching { LocalDate.parse(it.take(10)) }.getOrNull() },
    customerName = customerName,
    phone = phone,
    status = BookingStatus.fromBackend(status),
    createdAt = createdAt,
    history = history.map { it.toDomain() }
)

fun StatusHistoryDto.toDomain(): StatusHistory = StatusHistory(
    oldStatus = oldStatus,
    newStatus = newStatus,
    changedAt = changedAt,
    adminName = adminName
)
