package com.ganraj.logistics.ui.admin.detail

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.data.repository.AppResult
import com.ganraj.logistics.data.repository.BookingRepository
import com.ganraj.logistics.domain.model.Booking
import com.ganraj.logistics.domain.model.BookingStatus
import com.ganraj.logistics.util.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class BookingDetailViewModel @Inject constructor(
    private val bookingRepository: BookingRepository
) : ViewModel() {

    var uiState by mutableStateOf<UiState<Booking>>(UiState.Loading)
        private set
    var selectedStatus by mutableStateOf(BookingStatus.NEW)
        private set
    var updating by mutableStateOf(false)
        private set
    var updateError by mutableStateOf<String?>(null)
        private set

    fun load(id: Int) {
        viewModelScope.launch {
            uiState = UiState.Loading
            when (val result = bookingRepository.get(id)) {
                is AppResult.Success -> {
                    uiState = UiState.Success(result.data)
                    selectedStatus = result.data.status
                }
                else -> uiState = UiState.Error("Could not load this booking.")
            }
        }
    }

    fun onStatusSelected(status: BookingStatus) {
        selectedStatus = status
        updateError = null
    }

    fun confirmStatusChange() {
        val current = (uiState as? UiState.Success)?.data ?: return
        if (selectedStatus == current.status) return
        updating = true
        updateError = null
        viewModelScope.launch {
            when (val result = bookingRepository.updateStatus(current.id, selectedStatus)) {
                is AppResult.Success -> {
                    uiState = UiState.Success(result.data)
                    selectedStatus = result.data.status
                }
                else -> updateError = "Could not update the status. Please try again."
            }
            updating = false
        }
    }
}
