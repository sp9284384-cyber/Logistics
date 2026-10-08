package com.ganraj.logistics.driver.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PageResponse<T>(
    val items: List<T> = emptyList(),
    val page: Int = 0,
    val size: Int = 0,
    val totalItems: Long = 0,
    val totalPages: Int = 0
)

/** Error body from the backend's GlobalExceptionHandler. */
@Serializable
data class ErrorResponse(
    val status: Int = 0,
    val error: String = "",
    val message: String = "",
    val fieldErrors: Map<String, String> = emptyMap()
)
