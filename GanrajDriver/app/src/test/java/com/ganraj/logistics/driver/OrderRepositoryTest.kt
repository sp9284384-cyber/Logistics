package com.ganraj.logistics.driver

import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.network.ApiService
import com.ganraj.logistics.driver.data.model.OrderStatus
import com.ganraj.logistics.driver.data.repository.OrderRepository
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

class OrderRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var repository: OrderRepository

    @Before fun setUp() {
        server = MockWebServer().also { it.start() }
        val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
        val api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(ApiService::class.java)
        repository = OrderRepository(api)
    }

    @After fun tearDown() { runCatching { server.shutdown() } }

    @Test fun updateStatus_sends_PATCH_and_parses_the_order() = runBlocking {
        server.enqueue(
            MockResponse().setBody(
                """{"id":5,"reference":"GLS-5","status":"IN_TRANSIT","pickupAddress":"A","dropAddress":"B","customerName":"C"}"""
            )
        )
        val result = repository.updateStatus(5, OrderStatus.IN_TRANSIT)
        val request = server.takeRequest()
        assertEquals("PATCH", request.method)
        assertEquals("/api/orders/5/status", request.path)
        assertTrue(request.body.readUtf8().contains("IN_TRANSIT"))
        assertEquals(OrderStatus.IN_TRANSIT, (result as ApiResult.Success).data.status)
    }

    @Test fun invalid_transition_returns_the_server_message_and_code() = runBlocking {
        server.enqueue(
            MockResponse().setResponseCode(409).setBody(
                """{"status":409,"error":"Conflict","message":"Cannot move from Assigned to Delivered."}"""
            )
        )
        val result = repository.updateStatus(5, OrderStatus.DELIVERED) as ApiResult.Error
        assertEquals(409, result.code)
        assertEquals("Cannot move from Assigned to Delivered.", result.message)
    }

    @Test fun network_failure_becomes_a_friendly_error() = runBlocking {
        server.shutdown()
        val result = repository.getOrder(1)
        assertTrue(result is ApiResult.Error)
    }
}
