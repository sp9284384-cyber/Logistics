package com.ganraj.logistics.driver

import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.model.OrderStatus
import com.ganraj.logistics.driver.data.model.PageResponse
import com.ganraj.logistics.driver.data.repository.OrderRepository
import com.ganraj.logistics.driver.ui.orders.OrdersViewModel
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class OrdersViewModelTest {

    private val order = Order(
        id = 1, reference = "GLS-1", status = OrderStatus.ASSIGNED,
        pickupAddress = "A", dropAddress = "B", customerName = "C"
    )

    @Before fun setUp() = Dispatchers.setMain(UnconfinedTestDispatcher())
    @After fun tearDown() = Dispatchers.resetMain()

    @Test fun loads_first_page_on_start() {
        val repo = mockk<OrderRepository>()
        coEvery { repo.getMyOrders(0) } returns
            ApiResult.Success(PageResponse(listOf(order), page = 0, size = 20, totalItems = 1, totalPages = 1))
        val vm = OrdersViewModel(repo)
        assertEquals(listOf(order), vm.state.value.orders)
        assertFalse(vm.state.value.isLoading)
        assertFalse(vm.state.value.canLoadMore)
    }

    @Test fun shows_error_when_first_load_fails() {
        val repo = mockk<OrderRepository>()
        coEvery { repo.getMyOrders(0) } returns ApiResult.Error("No connection.")
        val vm = OrdersViewModel(repo)
        assertEquals("No connection.", vm.state.value.error)
        assertTrue(vm.state.value.orders.isEmpty())
    }

    @Test fun loadMore_appends_the_next_page() {
        val repo = mockk<OrderRepository>()
        val second = order.copy(id = 2, reference = "GLS-2")
        coEvery { repo.getMyOrders(0) } returns
            ApiResult.Success(PageResponse(listOf(order), page = 0, size = 1, totalItems = 2, totalPages = 2))
        coEvery { repo.getMyOrders(1) } returns
            ApiResult.Success(PageResponse(listOf(second), page = 1, size = 1, totalItems = 2, totalPages = 2))
        val vm = OrdersViewModel(repo)
        assertTrue(vm.state.value.canLoadMore)
        vm.loadMore()
        assertEquals(listOf(order, second), vm.state.value.orders)
        assertFalse(vm.state.value.canLoadMore)
    }
}
