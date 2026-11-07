package com.ganraj.logistics.domain.model

data class StatusHistory(
    val oldStatus: String?,
    val newStatus: String,
    val changedAt: String,
    val adminName: String? = null
)
