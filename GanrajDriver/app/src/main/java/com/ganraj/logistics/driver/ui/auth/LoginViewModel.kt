package com.ganraj.logistics.driver.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()

    /** On success the token is saved; the navigation graph sees it and moves to the orders list. */
    fun login(email: String, password: String) {
        if (_state.value.isLoading) return
        if (email.isBlank() || password.isBlank()) {
            _state.update { it.copy(error = "Enter your email and password.") }
            return
        }
        _state.update { LoginUiState(isLoading = true) }
        viewModelScope.launch {
            when (val result = authRepository.login(email, password)) {
                is ApiResult.Success -> _state.update { LoginUiState() }
                is ApiResult.Error -> _state.update { LoginUiState(error = result.message) }
                ApiResult.Loading -> Unit
            }
        }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
