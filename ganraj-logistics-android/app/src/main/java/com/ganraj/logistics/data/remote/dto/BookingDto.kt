package com.ganraj.logistics.data.remote.dto

import com.google.gson.annotations.SerializedName

data class BookingRequestDto(
    @SerializedName("pickup_location") val pickupLocation: String,
    @SerializedName("delivery_location") val deliveryLocation: String,
    @SerializedName("material") val material: String,
    @SerializedName("quantity") val quantity: String,
    @SerializedName("vehicle_type") val vehicleType: String,
    @SerializedName("pickup_date") val pickupDate: String?,   // ISO date, e.g. "2026-11-01"
    @SerializedName("customer_name") val customerName: String,
    @SerializedName("phone") val phone: String
)

data class BookingResponseDto(
    @SerializedName("id") val id: Int,
    @SerializedName("reference") val reference: String
)

data class BookingListItemDto(
    @SerializedName("id") val id: Int,
    @SerializedName("reference") val reference: String,
    @SerializedName("pickup_location") val pickupLocation: String,
    @SerializedName("delivery_location") val deliveryLocation: String,
    @SerializedName("material") val material: String,
    @SerializedName("quantity") val quantity: String,
    @SerializedName("vehicle_type") val vehicleType: String,
    @SerializedName("pickup_date") val pickupDate: String?,
    @SerializedName("customer_name") val customerName: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("status") val status: String,
    @SerializedName("created_at") val createdAt: String
)

data class BookingListDto(
    @SerializedName("items") val items: List<BookingListItemDto> = emptyList(),
    @SerializedName("total") val total: Int = 0,
    @SerializedName("page") val page: Int = 1,
    @SerializedName("pages") val pages: Int = 1
)

data class StatusHistoryDto(
    @SerializedName("old_status") val oldStatus: String?,
    @SerializedName("new_status") val newStatus: String,
    @SerializedName("changed_at") val changedAt: String,
    @SerializedName("admin_name") val adminName: String? = null
)

data class BookingDetailDto(
    @SerializedName("id") val id: Int,
    @SerializedName("reference") val reference: String,
    @SerializedName("pickup_location") val pickupLocation: String,
    @SerializedName("delivery_location") val deliveryLocation: String,
    @SerializedName("material") val material: String,
    @SerializedName("quantity") val quantity: String,
    @SerializedName("vehicle_type") val vehicleType: String,
    @SerializedName("pickup_date") val pickupDate: String?,
    @SerializedName("customer_name") val customerName: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("status") val status: String,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("history") val history: List<StatusHistoryDto> = emptyList()
)

data class StatusUpdateDto(
    @SerializedName("status") val status: String
)

/** Maps "field" -> list of error messages from a FastAPI 422 body. */
data class ValidationErrorDto(
    @SerializedName("detail") val detail: List<FieldError>
) {
    data class FieldError(
        @SerializedName("loc") val loc: List<String>,
        @SerializedName("msg") val msg: String
    )
}
