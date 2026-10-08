package com.ganraj.logistics.driver.notification

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.ganraj.logistics.driver.MainActivity
import com.ganraj.logistics.driver.R
import com.ganraj.logistics.driver.core.util.Constants

object NotificationHelper {

    /** One channel for order alerts, one (silent) for the tracking service. */
    fun createChannels(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                Constants.CHANNEL_ORDERS,
                context.getString(R.string.channel_orders),
                NotificationManager.IMPORTANCE_HIGH
            )
        )
        manager.createNotificationChannel(
            NotificationChannel(
                Constants.CHANNEL_TRACKING,
                context.getString(R.string.channel_tracking),
                NotificationManager.IMPORTANCE_LOW
            )
        )
    }

    fun trackingNotification(context: Context): Notification =
        NotificationCompat.Builder(context, Constants.CHANNEL_TRACKING)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(context.getString(R.string.tracking_title))
            .setContentText(context.getString(R.string.tracking_text))
            .setOngoing(true)
            .setContentIntent(openAppIntent(context, null))
            .build()

    fun showOrderNotification(context: Context, orderId: Long?, title: String?, body: String?) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) return

        val notification = NotificationCompat.Builder(context, Constants.CHANNEL_ORDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title ?: context.getString(R.string.new_order_title))
            .setContentText(body ?: context.getString(R.string.new_order_text))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(openAppIntent(context, orderId))
            .build()
        NotificationManagerCompat.from(context).notify((orderId ?: System.currentTimeMillis()).toInt(), notification)
    }

    /** Tapping opens the app, and the order detail when [orderId] is known. */
    private fun openAppIntent(context: Context, orderId: Long?): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            orderId?.let { putExtra(Constants.EXTRA_ORDER_ID, it) }
        }
        return PendingIntent.getActivity(
            context, (orderId ?: 0L).toInt(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
