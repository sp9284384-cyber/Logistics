package com.ganraj.logistics.ui.admin.dashboard

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.data.mapper.toDomain
import com.ganraj.logistics.data.repository.AdminRepository
import com.ganraj.logistics.data.repository.AppResult
import com.ganraj.logistics.data.repository.BookingRepository
import com.ganraj.logistics.domain.model.Booking
import com.ganraj.logistics.domain.model.BookingStatus
import com.ganraj.logistics.util.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val bookingRepository: BookingRepository,
    private val adminRepository: AdminRepository
) : ViewModel() {

    var uiState by mutableStateOf<UiState<List<Booking>>>(UiState.Loading)
        private set
    var statusFilter by mutableStateOf<BookingStatus?>(null)
        private set
    var searchQuery by mutableStateOf("")
        private set
    var currentPage by mutableStateOf(1)
        private set
    var totalPages by mutableStateOf(1)
        private set

    private var searchJob: Job? = null

    init { load() }

    fun setStatusFilter(status: BookingStatus?) {
        statusFilter = status
        currentPage = 1
        load()
    }

    fun onSearchChange(query: String) {
        searchQuery = query
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(350)   // debounce
            currentPage = 1
            load()
        }
    }

    fun nextPage() { if (currentPage < totalPages) { currentPage++; load() } }
    fun prevPage() { if (currentPage > 1) { currentPage--; load() } }

    fun refresh() = load()

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            adminRepository.logout()
            onLoggedOut()
        }
    }

    private fun load() {
        viewModelScope.launch {
            uiState = UiState.Loading
            when (val result = bookingRepository.list(statusFilter, searchQuery, currentPage)) {
                is AppResult.Success -> {
                    totalPages = result.data.pages.coerceAtLeast(1)
                    uiState = UiState.Success(result.data.items.map { it.toDomain() })
                }
                is AppResult.AuthError -> {
                    adminRepository.logout()
                    uiState = UiState.Error("Session expired. Please sign in again.", retryable = false)
                }
                else -> uiState = UiState.Error("Could not load bookings.")
            }
        }
    }
}
