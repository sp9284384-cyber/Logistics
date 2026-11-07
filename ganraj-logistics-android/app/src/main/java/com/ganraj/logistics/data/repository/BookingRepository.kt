package com.ganraj.logistics.data.repository

import com.ganraj.logistics.data.mapper.toDomain
import com.ganraj.logistics.data.remote.ApiService
import com.ganraj.logistics.data.remote.dto.BookingListDto
import com.ganraj.logistics.data.remote.dto.BookingRequestDto
import com.ganraj.logistics.data.remote.dto.ValidationErrorDto
import com.ganraj.logistics.domain.model.Booking
import com.ganraj.logistics.domain.model.BookingStatus
import com.google.gson.Gson
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException

sealed interface AppResult<out T> {
    data class Success<T>(val data: T) : AppResult<T>
    /** field -> error message map, parsed from a FastAPI 422 body (empty for non-validation failures). */
    data class ValidationError(val fieldErrors: Map<String, String>, val message: String) : AppResult<Nothing>
    data class AuthError(val message: String) : AppResult<Nothing>
    data class RateLimited(val message: String) : AppResult<Nothing>
    data class NetworkError(val message: String) : AppResult<Nothing>
}

@Singleton
class BookingRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun submit(request: BookingRequestDto): AppResult<Booking> =
        withContext(Dispatchers.IO) {
            runCatching {
                val created = api.createBooking(request)
                // Reload the full detail so the domain model carries status + history.
                val detail = api.getBooking(created.id)
                AppResult.Success(detail.toDomain())
            }.getOrElse { it.toAppResult(defaultMsg = "Could not submit the booking.") }
        }

    suspend fun list(status: BookingStatus?, search: String?, page: Int): AppResult<BookingListDto> =
        withContext(Dispatchers.IO) {
            runCatching {
                AppResult.Success(
                    api.getBookings(status = status?.label, search = search?.ifBlank { null }, page = page)
                )
            }.getOrElse { it.toAppResult(defaultMsg = "Could not load bookings.") }
        }

    suspend fun get(id: Int): AppResult<Booking> =
        withContext(Dispatchers.IO) {
            runCatching { AppResult.Success(api.getBooking(id).toDomain()) }
                .getOrElse { it.toAppResult(defaultMsg = "Could not load this booking.") }
        }

    suspend fun updateStatus(id: Int, status: BookingStatus): AppResult<Booking> =
        withContext(Dispatchers.IO) {
            runCatching {
                AppResult.Success(api.updateStatus(id, com.ganraj.logistics.data.remote.dto.StatusUpdateDto(status.label)).toDomain())
            }.getOrElse { it.toAppResult(defaultMsg = "Could not update the status.") }
        }
}

/** Translates backend responses into user-friendly results. */
fun <T> Throwable.toAppResult(defaultMsg: String): AppResult<T> = when (this) {
    is HttpException -> when (code()) {
        401 -> AppResult.AuthError("Your session has expired. Please sign in again.")
        422 -> {
            val fieldErrors = parse422(this)
            AppResult.ValidationError(fieldErrors, fieldErrors.values.firstOrNull() ?: "Please check the form.")
        }
        429 -> AppResult.RateLimited("Too many attempts. Please try again shortly.")
        else -> AppResult.NetworkError(defaultMsg)
    }
    else -> AppResult.NetworkError(defaultMsg)   // timeouts, no internet, 5xx via converter, etc.
}

private fun parse422(e: HttpException): Map<String, String> {
    return runCatching {
        val body = e.response()?.errorBody()?.string() ?: return emptyMap()
        val parsed = Gson().fromJson(body, ValidationErrorDto::class.java)
        parsed.detail.associate { err ->
            // FastAPI loc looks like ["body", "phone"] — keep the field name only.
            val field = err.loc.lastOrNull() ?: "form"
            field to err.msg
        }
    }.getOrDefault(emptyMap())
}
