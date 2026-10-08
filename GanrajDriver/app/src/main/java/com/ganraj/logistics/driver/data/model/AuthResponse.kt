package com.ganraj.logistics.driver.data.model

import kotlinx.serialization.Serializable

@Serializable
data class AuthResponse(
    val token: String,
    val role: String,
    val userId: Long,
    val name: String
)
