package com.ganraj.logistics.driver.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.driver.core.storage.TokenStorage
import com.ganraj.logistics.driver.data.repository.AuthRepository
import com.ganraj.logistics.driver.data.repository.DeviceTokenRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Activity-wide login state. A cleared token (logout or 401) sends the app back to the login screen. */
@HiltViewModel
class SessionViewModel @Inject constructor(
    tokenStorage: TokenStorage,
    private val authRepository: AuthRepository,
    private val deviceTokens: DeviceTokenRepository
) : ViewModel() {

    val token: StateFlow<String?> = tokenStorage.token

    init {
        // Every time a driver logs in (or the app opens already logged in), give the backend the FCM token.
        viewModelScope.launch {
            token.filterNotNull().collect { runCatching { deviceTokens.registerCurrent() } }
        }
    }

    fun logout() = authRepository.logout()
}
