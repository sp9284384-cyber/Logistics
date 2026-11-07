package com.ganraj.logistics.data.repository

import com.ganraj.logistics.data.local.TokenStore
import com.ganraj.logistics.data.remote.ApiService
import com.ganraj.logistics.data.remote.dto.LoginRequestDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdminRepository @Inject constructor(
    private val api: ApiService,
    private val tokenStore: TokenStore
) {
    /** Returns Unit on success; caller clears the token on AuthError. */
    suspend fun login(email: String, password: String): AppResult<Unit> {
        return runCatching {
            val token = api.login(LoginRequestDto(email, password))
            tokenStore.saveToken(token.accessToken)
            AppResult.Success(Unit)
        }.getOrElse { it.toAppResult("Could not sign in.") }
    }

    /** Called on app start to check the stored token is still valid. */
    suspend fun verifyToken(): AppResult<Unit> {
        val result = runCatching { api.me(); AppResult.Success(Unit) as AppResult<Unit> }
            .getOrElse { it.toAppResult<Unit>("Session check failed.") }
        if (result is AppResult.AuthError) tokenStore.clear()
        return result
    }

    suspend fun logout() = tokenStore.clear()

    suspend fun hasToken(): Boolean = tokenStore.getToken() != null
}
