package com.ganraj.logistics.driver.core.util

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri

/** Opens the phone dialer, WhatsApp and Google Maps navigation. Nothing here needs a permission. */
object ContactActions {

    fun dial(context: Context, phone: String) {
        val number = phone.filter { it.isDigit() || it == '+' }
        start(context, Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number")))
    }

    fun openWhatsApp(context: Context, phone: String, message: String) {
        val digits = phone.filter { it.isDigit() }
        // 10-digit Indian numbers get the country code
        val full = if (digits.length == 10) "91$digits" else digits
        val uri = Uri.parse("https://wa.me/$full?text=${Uri.encode(message)}")
        start(context, Intent(Intent.ACTION_VIEW, uri))
    }

    fun navigateTo(context: Context, lat: Double, lng: Double) {
        val nav = Intent(Intent.ACTION_VIEW, Uri.parse("google.navigation:q=$lat,$lng"))
            .setPackage("com.google.android.apps.maps")
        if (!start(context, nav)) {
            start(context, Intent(Intent.ACTION_VIEW, Uri.parse("geo:$lat,$lng?q=$lat,$lng")))
        }
    }

    private fun start(context: Context, intent: Intent): Boolean = try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
    } catch (_: ActivityNotFoundException) {
        false
    }
}
