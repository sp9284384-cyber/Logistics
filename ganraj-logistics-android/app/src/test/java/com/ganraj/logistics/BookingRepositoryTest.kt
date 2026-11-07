package com.ganraj.logistics

import com.ganraj.logistics.data.repository.AppResult
import com.ganraj.logistics.data.repository.BookingRepository
import com.ganraj.logistics.data.remote.dto.BookingRequestDto
import com.ganraj.logistics.domain.model.BookingStatus
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BookingRepositoryTest {

    private val request = BookingRequestDto(
        pickupLocation = "Badlapur", deliveryLocation = "Pune",
        material = "Plastic", quantity = "5 tonnes",
        vehicleType = "Container Truck", pickupDate = "2026-11-01",
        customerName = "Test", phone = "8108767159"
    )

    @Test
    fun `submit returns created booking with status New`() = runTest {
        val repo = BookingRepository(FakeApiService())
        val result = repo.submit(request)
        assertTrue(result is AppResult.Success)
        assertEquals("GLS-2026-00042", (result as AppResult.Success).data.reference)
        assertEquals(BookingStatus.NEW, result.data.status)
    }

    @Test
    fun `submit maps network failure to NetworkError`() = runTest {
        val api = FakeApiService().apply { failWith = java.io.IOException("no internet") }
        val result = BookingRepository(api).submit(request)
        assertTrue(result is AppResult.NetworkError)
    }

    @Test
    fun `updateStatus returns booking with new status`() = runTest {
        val repo = BookingRepository(FakeApiService())
        val result = repo.updateStatus(42, BookingStatus.IN_TRANSIT)
        assertTrue(result is AppResult.Success)
        assertEquals(BookingStatus.IN_TRANSIT, (result as AppResult.Success).data.status)
    }

    @Test
    fun `list returns mapped items`() = runTest {
        val result = BookingRepository(FakeApiService()).list(null, null, 1)
        assertTrue(result is AppResult.Success)
        assertEquals(1, (result as AppResult.Success).data.items.size)
    }
}
