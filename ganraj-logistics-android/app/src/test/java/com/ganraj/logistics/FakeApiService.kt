package com.ganraj.logistics

import com.ganraj.logistics.data.remote.ApiService
import com.ganraj.logistics.data.remote.dto.AdminDto
import com.ganraj.logistics.data.remote.dto.BookingDetailDto
import com.ganraj.logistics.data.remote.dto.BookingListDto
import com.ganraj.logistics.data.remote.dto.BookingListItemDto
import com.ganraj.logistics.data.remote.dto.BookingRequestDto
import com.ganraj.logistics.data.remote.dto.BookingResponseDto
import com.ganraj.logistics.data.remote.dto.LoginRequestDto
import com.ganraj.logistics.data.remote.dto.StatusUpdateDto
import com.ganraj.logistics.data.remote.dto.TokenResponseDto

/** In-memory fake for unit tests. */
class FakeApiService(
    private val bookingId: Int = 42,
    private val reference: String = "GLS-2026-00042"
) : ApiService {

    var lastCreateRequest: BookingRequestDto? = null
    var failWith: Throwable? = null

    private fun maybeFail() { failWith?.let { throw it } }

    override suspend fun createBooking(body: BookingRequestDto): BookingResponseDto {
        maybeFail()
        lastCreateRequest = body
        return BookingResponseDto(id = bookingId, reference = reference)
    }

    override suspend fun login(body: LoginRequestDto): TokenResponseDto {
        maybeFail()
        return TokenResponseDto(access_token = "fake-token")
    }

    override suspend fun me(): AdminDto = AdminDto(id = 1, email = "admin@ganrajlogistics.in", name = "Trilok")

    override suspend fun getBookings(status: String?, search: String?, page: Int): BookingListDto =
        BookingListDto(
            items = listOf(
                BookingListItemDto(
                    id = bookingId, reference = reference,
                    pickupLocation = "Badlapur", deliveryLocation = "Pune",
                    material = "Plastic", quantity = "5 tonnes",
                    vehicleType = "Container Truck", pickupDate = "2026-11-01",
                    customerName = "Test Customer", phone = "8108767159",
                    status = "New", createdAt = "2026-10-16T10:00:00"
                )
            ),
            total = 1, page = 1, pages = 1
        )

    override suspend fun getBooking(id: Int): BookingDetailDto = BookingDetailDto(
        id = bookingId, reference = reference,
        pickupLocation = "Badlapur", deliveryLocation = "Pune",
        material = "Plastic", quantity = "5 tonnes",
        vehicleType = "Container Truck", pickupDate = "2026-11-01",
        customerName = "Test Customer", phone = "8108767159",
        status = "New", createdAt = "2026-10-16T10:00:00", history = emptyList()
    )

    override suspend fun updateStatus(id: Int, body: StatusUpdateDto): BookingDetailDto =
        getBooking(id).copy(status = body.status)
}
