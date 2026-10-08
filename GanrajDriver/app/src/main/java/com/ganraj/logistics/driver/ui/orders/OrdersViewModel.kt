package com.ganraj.logistics.driver.ui.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.util.OrderEvents
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrdersUiState(
    val orders: List<Order> = emptyList(),
    val page: Int = 0,
    val totalPages: Int = 0,
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val isLoadingMore: Boolean = false,
    val error: String? = null
) {
    val canLoadMore: Boolean get() = page + 1 < totalPages
}

@HiltViewModel
class OrdersViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _state = MutableStateFlow(OrdersUiState())
    val state: StateFlow<OrdersUiState> = _state.asStateFlow()

    init {
        loadFirstPage(showSpinner = true)
        // A push arrived or a status changed elsewhere: reload quietly.
        viewModelScope.launch { OrderEvents.changed.collect { refresh() } }
    }

    fun refresh() = loadFirstPage(showSpinner = false)

    fun retry() = loadFirstPage(showSpinner = true)

    fun loadMore() {
        val s = _state.value
        if (s.isLoading || s.isRefreshing || s.isLoadingMore || !s.canLoadMore) return
        _state.update { it.copy(isLoadingMore = true) }
        viewModelScope.launch {
            when (val result = orderRepository.getMyOrders(s.page + 1)) {
                is ApiResult.Success -> _state.update {
                    it.copy(
                        orders = it.orders + result.data.items,
                        page = result.data.page,
                        totalPages = result.data.totalPages,
                        isLoadingMore = false
                    )
                }
                is ApiResult.Error -> _state.update { it.copy(isLoadingMore = false) }
                ApiResult.Loading -> Unit
            }
        }
    }

    private fun loadFirstPage(showSpinner: Boolean) {
        _state.update {
            if (showSpinner) it.copy(isLoading = true, error = null) else it.copy(isRefreshing = true)
        }
        viewModelScope.launch {
            when (val result = orderRepository.getMyOrders(0)) {
                is ApiResult.Success -> _state.update {
                    it.copy(
                        orders = result.data.items,
                        page = result.data.page,
                        totalPages = result.data.totalPages,
                        isLoading = false,
                        isRefreshing = false,
                        error = null
                    )
                }
                is ApiResult.Error -> _state.update {
                    // keep showing the old list on a failed refresh; only show the error screen when empty
                    it.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = if (it.orders.isEmpty()) result.message else null
                    )
                }
                ApiResult.Loading -> Unit
            }
        }
    }
}
