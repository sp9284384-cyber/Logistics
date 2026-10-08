package com.ganraj.logistics.driver.core.network

import com.ganraj.logistics.driver.core.storage.TokenStorage
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/** Adds the JWT to every call. A 401 on a protected call clears the session, so the app returns to login. */
class AuthInterceptor @Inject constructor(private val tokens: TokenStorage) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val isLogin = chain.request().url.encodedPath.endsWith("auth/login")
        val request = chain.request().newBuilder().apply {
            if (!isLogin) tokens.getToken()?.let { header("Authorization", "Bearer $it") }
        }.build()
        val response = chain.proceed(request)
        if (response.code == 401 && !isLogin) tokens.clear()
        return response
    }
}
