package com.ganraj.logistics.ui.admin.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.data.repository.AdminRepository
import com.ganraj.logistics.data.repository.AppResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val emailError: String? = null,
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val adminRepository: AdminRepository
) : ViewModel() {
    var state by mutableStateOf(LoginUiState())
        private set

    fun onEmailChange(v: String) { state = state.copy(email = v, emailError = null, error = null) }
    fun onPasswordChange(v: String) { state = state.copy(password = v, error = null) }

    fun login(onSuccess: () -> Unit) {
        if (!state.email.contains("@")) {
            state = state.copy(emailError = "Enter a valid email")
            return
        }
        if (state.password.isBlank()) {
            state = state.copy(error = "Password is required")
            return
        }
        state = state.copy(loading = true, error = null)
        viewModelScope.launch {
            when (val result = adminRepository.login(state.email.trim(), state.password)) {
                is AppResult.Success -> onSuccess()
                is AppResult.AuthError, is AppResult.ValidationError ->
                    state = state.copy(loading = false, error = "Invalid email or password.")
                is AppResult.RateLimited ->
                    state = state.copy(loading = false, error = result.message)
                is AppResult.NetworkError ->
                    state = state.copy(loading = false, error = "Could not reach the server. Try again.")
            }
        }
    }
}
