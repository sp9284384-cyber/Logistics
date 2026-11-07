package com.ganraj.logistics.util

import android.content.Context
import android.content.Intent
import android.net.Uri

object IntentHelper {

    fun dial(context: Context, phone: String = Constants.PHONE_NUMBER) {
        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
    }

    fun whatsApp(context: Context, message: String = defaultQuoteMessage()) {
        val uri = Uri.parse(
            "https://wa.me/${Constants.WHATSAPP_NUMBER}?text=" + Uri.encode(message)
        )
        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
    }

    fun email(context: Context) {
        val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:${Constants.EMAIL}"))
        context.startActivity(intent)
    }

    fun defaultQuoteMessage(): String =
        "Hello GANRAJ LOGISTICS SERVICE, I need a transport quotation."
}
