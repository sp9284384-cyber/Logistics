package com.ganraj.logistics.driver.core.network

import com.ganraj.logistics.driver.data.model.AuthResponse
import com.ganraj.logistics.driver.data.model.DeviceTokenRequest
import com.ganraj.logistics.driver.data.model.LocationRequest
import com.ganraj.logistics.driver.data.model.LoginRequest
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.model.OrderStatus
import com.ganraj.logistics.driver.data.model.PageResponse
import com.ganraj.logistics.driver.data.model.UpdateStatusRequest
import kotlinx.coroutines.delay
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import retrofit2.HttpException
import retrofit2.Response
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Offline stand-in for the Spring Boot backend, used only when BuildConfig.DEMO_MODE is true (debug builds).
 * It lets the whole app (login, orders, status changes, tracking) be tried with no server.
 * These credentials are demo-only; they are NOT accepted by the real backend.
 */
@Singleton
class DemoApiService @Inject constructor() : ApiService {

    companion object {
        const val DEMO_EMAIL = "driver@ganraj.demo"
        const val DEMO_PASSWORD = "Driver@123"
    }

    private val lock = Any()
    private val orders = mutableListOf(
        demo(1001, "GLS-1001", OrderStatus.ASSIGNED,
            "Kharvai MIDC, Badlapur, Thane", 19.1667, 73.2333,
            "Bhiwandi Warehouse Complex, Thane", 19.2967, 73.0631,
            "Shree Traders", "9876500001", "Packed cartons, 18 tonnes", 2),
        demo(1002, "GLS-1002", OrderStatus.PICKED_UP,
            "Turbhe MIDC, Navi Mumbai", 19.0745, 73.0169,
            "Chakan Industrial Area, Pune", 18.7603, 73.8630,
            "Om Industries", "9876500002", "Machine parts, 9 tonnes", 5),
        demo(1003, "GLS-1003", OrderStatus.DELIVERED,
            "Taloja MIDC, Navi Mumbai", 19.0647, 73.1225,
            "Ambad MIDC, Nashik", 19.9975, 73.7898,
            "Sai Distributors", "9876500003", "FMCG goods, 12 tonnes", 30)
    )

    override suspend fun login(body: LoginRequest): AuthResponse {
        delay(600)
        if (body.email.trim().equals(DEMO_EMAIL, ignoreCase = true) && body.password == DEMO_PASSWORD) {
            return AuthResponse(token = "demo-token", role = "DRIVER", userId = 1, name = "Demo Driver")
        }
        throw httpError(401, "Invalid email or password.")
    }

    override suspend fun getMyOrders(page: Int, size: Int, status: String?): PageResponse<Order> {
        delay(400)
        return synchronized(lock) {
            val filtered = orders.filter { status == null || it.status.name == status }
            val from = (page * size).coerceAtMost(filtered.size)
            val to = (from + size).coerceAtMost(filtered.size)
            PageResponse(
                items = filtered.subList(from, to).toList(),
                page = page,
                size = size,
                totalItems = filtered.size.toLong(),
                totalPages = if (filtered.isEmpty()) 0 else (filtered.size + size - 1) / size
            )
        }
    }

    override suspend fun getOrder(id: Long): Order {
        delay(250)
        return synchronized(lock) { orders.firstOrNull { it.id == id } } ?: throw httpError(404, "Order not found.")
    }

    override suspend fun updateStatus(id: Long, body: UpdateStatusRequest): Order {
        delay(400)
        val result: Result<Order> = synchronized(lock) {
            val index = orders.indexOfFirst { it.id == id }
            if (index < 0) {
                Result.failure(httpError(404, "Order not found."))
            } else if (orders[index].status.next() != body.status) {
                Result.failure(httpError(409, "Cannot move from ${orders[index].status.label} to ${body.status.label}."))
            } else {
                val updated = orders[index].copy(status = body.status, updatedAt = Instant.now().toString())
                orders[index] = updated
                Result.success(updated)
            }
        }
        return result.getOrThrow()
    }

    override suspend fun postLocation(body: LocationRequest): Response<Unit> = Response.success(Unit)

    override suspend fun registerDeviceToken(body: DeviceTokenRequest): Response<Unit> = Response.success(Unit)

    private fun httpError(code: Int, message: String): HttpException {
        val json = """{"status":$code,"error":"Error","message":"$message"}"""
        return HttpException(Response.error<Any>(code, json.toResponseBody("application/json".toMediaType())))
    }

    private fun demo(
        id: Long, ref: String, status: OrderStatus,
        pickup: String, pLat: Double, pLng: Double,
        drop: String, dLat: Double, dLng: Double,
        customer: String, phone: String, item: String, hoursAgo: Long
    ) = Order(
        id = id, reference = ref, status = status,
        pickupAddress = pickup, pickupLat = pLat, pickupLng = pLng,
        dropAddress = drop, dropLat = dLat, dropLng = dLng,
        customerName = customer, customerPhone = phone, itemDescription = item,
        driverId = 1, driverName = "Demo Driver",
        createdAt = Instant.now().minusSeconds(hoursAgo * 3600).toString(),
        updatedAt = Instant.now().minusSeconds(hoursAgo * 1800).toString()
    )
}
