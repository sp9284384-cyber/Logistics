package com.ganraj.logistics.driver.core.network

import com.ganraj.logistics.driver.data.model.AuthResponse
import com.ganraj.logistics.driver.data.model.DeviceTokenRequest
import com.ganraj.logistics.driver.data.model.LocationRequest
import com.ganraj.logistics.driver.data.model.LoginRequest
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.model.PageResponse
import com.ganraj.logistics.driver.data.model.UpdateStatusRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/** The driver endpoints of the shared API contract (#1, #3, #4, #6, #7, #10). */
interface ApiService {

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @GET("api/orders")
    suspend fun getMyOrders(
        @Query("page") page: Int,
        @Query("size") size: Int = 20,
        @Query("status") status: String? = null
    ): PageResponse<Order>

    @GET("api/orders/{id}")
    suspend fun getOrder(@Path("id") id: Long): Order

    @PATCH("api/orders/{id}/status")
    suspend fun updateStatus(@Path("id") id: Long, @Body body: UpdateStatusRequest): Order

    @POST("api/locations")
    suspend fun postLocation(@Body body: LocationRequest): Response<Unit>

    @POST("api/devices/token")
    suspend fun registerDeviceToken(@Body body: DeviceTokenRequest): Response<Unit>
}
