package com.ganraj.logistics.driver.data.repository

import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.network.ApiService
import com.ganraj.logistics.driver.core.network.safeApiCall
import com.ganraj.logistics.driver.core.storage.PendingLocationStore
import com.ganraj.logistics.driver.core.storage.TokenStorage
import com.ganraj.logistics.driver.data.model.AuthResponse
import com.ganraj.logistics.driver.data.model.LoginRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val tokens: TokenStorage,
    private val pendingLocations: PendingLocationStore
) {
    suspend fun login(email: String, password: String): ApiResult<AuthResponse> {
        val result = safeApiCall { api.login(LoginRequest(email.trim(), password)) }
        if (result is ApiResult.Success) {
            // This app is for drivers only. Dispatchers use the web dashboard.
            if (!result.data.role.equals("DRIVER", ignoreCase = true)) {
                return ApiResult.Error("This app is for drivers only. Dispatchers please use the web dashboard.")
            }
            tokens.save(result.data)
        }
        return result
    }

    fun logout() {
        pendingLocations.clear()
        tokens.clear()
    }

    fun isLoggedIn(): Boolean = tokens.getToken() != null
    fun driverName(): String? = tokens.getName()
}
