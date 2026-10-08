package com.ganraj.logistics.driver.core.network

import com.ganraj.logistics.driver.data.model.ErrorResponse
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import java.io.IOException

/** Every repository call returns one of these, so screens must handle every outcome. */
sealed interface ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>
    data class Error(val message: String, val code: Int? = null) : ApiResult<Nothing>
    data object Loading : ApiResult<Nothing>
}

private val errorJson = Json { ignoreUnknownKeys = true }

/** Runs [block] and converts exceptions into [ApiResult.Error] with a message fit to show the driver. */
suspend fun <T> safeApiCall(block: suspend () -> T): ApiResult<T> = try {
    ApiResult.Success(block())
} catch (e: CancellationException) {
    throw e
} catch (e: HttpException) {
    ApiResult.Error(parseHttpMessage(e), e.code())
} catch (e: IOException) {
    ApiResult.Error("No connection. Check your internet and try again.")
} catch (e: Exception) {
    ApiResult.Error(e.message ?: "Something went wrong.")
}

private fun parseHttpMessage(e: HttpException): String {
    val body = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
    val parsed = body?.let { runCatching { errorJson.decodeFromString<ErrorResponse>(it) }.getOrNull() }
    return parsed?.message?.takeIf { it.isNotBlank() } ?: when (e.code()) {
        401 -> "Invalid email or password."
        403 -> "You are not allowed to do that."
        404 -> "Not found."
        409 -> "That status change is not allowed."
        else -> "Server error (${e.code()}). Please try again."
    }
}
