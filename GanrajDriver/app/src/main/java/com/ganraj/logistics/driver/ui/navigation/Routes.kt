package com.ganraj.logistics.driver.ui.navigation

object Routes {
    const val ARG_ORDER_ID = "orderId"

    const val LOGIN = "login"
    const val ORDERS = "orders"
    const val ORDER_DETAIL = "order/{$ARG_ORDER_ID}"
    const val MAP = "map/{$ARG_ORDER_ID}"

    fun orderDetail(id: Long) = "order/$id"
    fun map(id: Long) = "map/$id"
}
