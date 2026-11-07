package com.ganraj.logistics.data.remote

import com.ganraj.logistics.data.remote.dto.AdminDto
import com.ganraj.logistics.data.remote.dto.BookingDetailDto
import com.ganraj.logistics.data.remote.dto.BookingListDto
import com.ganraj.logistics.data.remote.dto.BookingRequestDto
import com.ganraj.logistics.data.remote.dto.BookingResponseDto
import com.ganraj.logistics.data.remote.dto.LoginRequestDto
import com.ganraj.logistics.data.remote.dto.StatusUpdateDto
import com.ganraj.logistics.data.remote.dto.TokenResponseDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("bookings")
    suspend fun createBooking(@Body body: BookingRequestDto): BookingResponseDto

    @POST("admin/login")
    suspend fun login(@Body body: LoginRequestDto): TokenResponseDto

    @GET("admin/me")
    suspend fun me(): AdminDto

    @GET("admin/bookings")
    suspend fun getBookings(
        @Query("status") status: String? = null,
        @Query("search") search: String? = null,
        @Query("page") page: Int = 1
    ): BookingListDto

    @GET("admin/bookings/{id}")
    suspend fun getBooking(@Path("id") id: Int): BookingDetailDto

    @PATCH("admin/bookings/{id}/status")
    suspend fun updateStatus(
        @Path("id") id: Int,
        @Body body: StatusUpdateDto
    ): BookingDetailDto
}
