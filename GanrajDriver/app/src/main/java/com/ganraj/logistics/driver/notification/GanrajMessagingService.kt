package com.ganraj.logistics.driver.notification

import com.ganraj.logistics.driver.core.storage.TokenStorage
import com.ganraj.logistics.driver.core.util.Constants
import com.ganraj.logistics.driver.core.util.OrderEvents
import com.ganraj.logistics.driver.data.repository.DeviceTokenRepository
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Receives "New order assigned" pushes, shows the notification and refreshes the orders list. */
@AndroidEntryPoint
class GanrajMessagingService : FirebaseMessagingService() {

    @Inject lateinit var deviceTokens: DeviceTokenRepository
    @Inject lateinit var tokenStorage: TokenStorage

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onMessageReceived(message: RemoteMessage) {
        val orderId = message.data[Constants.EXTRA_ORDER_ID]?.toLongOrNull()
        NotificationHelper.showOrderNotification(
            context = this,
            orderId = orderId,
            title = message.notification?.title ?: message.data["title"],
            body = message.notification?.body ?: message.data["body"]
        )
        OrderEvents.notifyChanged()
    }

    override fun onNewToken(token: String) {
        // Only the logged-in driver's token is useful to the backend.
        if (tokenStorage.getToken() == null) return
        scope.launch { deviceTokens.register(token) }
    }
}
