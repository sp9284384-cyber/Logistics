package com.ganraj.logistics.driver.ui.map

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.core.util.Constants
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.repository.OrderRepository
import com.ganraj.logistics.driver.location.LocationClient
import com.ganraj.logistics.driver.ui.navigation.Routes
import com.google.android.gms.maps.model.LatLng
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MapUiState(
    val order: Order? = null,
    val driver: LatLng? = null,
    val isLoading: Boolean = true,
    val error: String? = null
) {
    val pickup: LatLng? get() = order?.let { o -> if (o.pickupLat != null && o.pickupLng != null) LatLng(o.pickupLat, o.pickupLng) else null }
    val drop: LatLng? get() = order?.let { o -> if (o.dropLat != null && o.dropLng != null) LatLng(o.dropLat, o.dropLng) else null }
}

@HiltViewModel
class MapViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val orderRepository: OrderRepository,
    private val locationClient: LocationClient
) : ViewModel() {

    private val orderId: Long = savedStateHandle.get<Long>(Routes.ARG_ORDER_ID) ?: 0L
    private val _state = MutableStateFlow(MapUiState())
    val state: StateFlow<MapUiState> = _state.asStateFlow()
    private var locationJob: Job? = null

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

    /** Called once the screen knows location permission is granted. */
    fun startLocationUpdates() {
        if (locationJob?.isActive == true) return
        locationJob = viewModelScope.launch {
            locationClient.lastLocation()?.let { loc -> _state.update { it.copy(driver = LatLng(loc.latitude, loc.longitude)) } }
            locationClient.updates(Constants.LOCATION_INTERVAL_MS).collect { loc ->
                _state.update { it.copy(driver = LatLng(loc.latitude, loc.longitude)) }
            }
        }
    }
}
