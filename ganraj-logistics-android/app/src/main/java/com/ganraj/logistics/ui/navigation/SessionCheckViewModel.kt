package com.ganraj.logistics.ui.navigation

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.data.repository.AdminRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class SessionCheckViewModel @Inject constructor(
    private val adminRepository: AdminRepository
) : ViewModel() {
    val checked = mutableStateOf(false)
    val hasSession = mutableStateOf(false)

    fun check() {
        viewModelScope.launch {
            hasSession.value = adminRepository.verifyToken() is com.ganraj.logistics.data.repository.AppResult.Success
            checked.value = true
        }
    }
}
