package com.ganraj.logistics.ui.navigation

object Routes {
    const val HOME = "home"
    const val ABOUT = "about"
    const val SERVICES = "services"
    const val CONTACT = "contact"
    const val BOOKING = "booking"
    const val BOOKING_SUCCESS = "booking_success/{reference}"
    const val ADMIN_LOGIN = "admin_login"
    const val ADMIN_DASHBOARD = "admin_dashboard"
    const val ADMIN_DETAIL = "admin_booking/{id}"

    fun bookingSuccess(reference: String) = "booking_success/$reference"
    fun adminDetail(id: Int) = "admin_booking/$id"
}
