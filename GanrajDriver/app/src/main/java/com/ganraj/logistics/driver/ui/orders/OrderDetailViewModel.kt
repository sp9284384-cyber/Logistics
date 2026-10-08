package com.ganraj.logistics.driver.ui.orders

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.util.OrderEvents
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.model.OrderStatus
import com.ganraj.logistics.driver.data.repository.OrderRepository
import com.ganraj.logistics.driver.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrderDetailUiState(
    val order: Order? = null,
    val isLoading: Boolean = true,
    val isUpdating: Boolean = false,
    val error: String? = null,
    /** One-off message (for example a failed status change) shown as a toast-like text. */
    val actionError: String? = null
)

@HiltViewModel
class OrderDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val orderId: Long = savedStateHandle.get<Long>(Routes.ARG_ORDER_ID) ?: 0L

    private val _state = MutableStateFlow(OrderDetailUiState())
    val state: StateFlow<OrderDetailUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            when (val result = orderRepository.getOrder(orderId)) {
                is ApiResult.Success -> _state.update { it.copy(order = result.data, isLoading = false) }
                is ApiResult.Error -> _state.update { it.copy(isLoading = false, error = result.message) }
                ApiResult.Loading -> Unit
            }
        }
    }

    fun updateStatus(newStatus: OrderStatus) {
        if (_state.value.isUpdating) return
        _state.update { it.copy(isUpdating = true, actionError = null) }
        viewModelScope.launch {
            when (val result = orderRepository.updateStatus(orderId, newStatus)) {
                is ApiResult.Success -> {
                    _state.update { it.copy(order = result.data, isUpdating = false) }
                    OrderEvents.notifyChanged() // keep the list in sync
                }
                is ApiResult.Error -> _state.update { it.copy(isUpdating = false, actionError = result.message) }
                ApiResult.Loading -> Unit
            }
        }
    }

    fun dismissActionError() = _state.update { it.copy(actionError = null) }
}
