package com.ganraj.logistics.driver.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UpdateStatusRequest(val status: OrderStatus)
