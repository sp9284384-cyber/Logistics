package com.ganraj.logistics.driver.data.repository

import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.network.ApiService
import com.ganraj.logistics.driver.core.network.safeApiCall
import com.ganraj.logistics.driver.core.util.Constants
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.model.OrderStatus
import com.ganraj.logistics.driver.data.model.PageResponse
import com.ganraj.logistics.driver.data.model.UpdateStatusRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepository @Inject constructor(private val api: ApiService) {

    suspend fun getMyOrders(page: Int, status: OrderStatus? = null): ApiResult<PageResponse<Order>> =
        safeApiCall { api.getMyOrders(page, Constants.PAGE_SIZE, status?.name) }

    suspend fun getOrder(id: Long): ApiResult<Order> = safeApiCall { api.getOrder(id) }

    suspend fun updateStatus(id: Long, status: OrderStatus): ApiResult<Order> =
        safeApiCall { api.updateStatus(id, UpdateStatusRequest(status)) }
}
