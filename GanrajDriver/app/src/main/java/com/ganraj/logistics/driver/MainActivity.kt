package com.ganraj.logistics.driver

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.ganraj.logistics.driver.core.util.Constants
import com.ganraj.logistics.driver.ui.navigation.AppNavGraph
import com.ganraj.logistics.driver.ui.theme.GanrajDriverTheme
import dagger.hilt.android.AndroidEntryPoint

/** Single activity. Shows the navigation graph and opens the right order when a push is tapped. */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private var pendingOrderId by mutableStateOf<Long?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        pendingOrderId = intent.orderIdOrNull()
        setContent {
            GanrajDriverTheme {
                AppNavGraph(
                    pendingOrderId = pendingOrderId,
                    onPendingOrderConsumed = { pendingOrderId = null }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingOrderId = intent.orderIdOrNull()
    }

    /** Our own notifications put a Long extra; FCM tray notifications deliver data as Strings. */
    private fun Intent?.orderIdOrNull(): Long? {
        val extras = this?.extras ?: return null
        return extras.getString(Constants.EXTRA_ORDER_ID)?.toLongOrNull()
            ?: extras.getLong(Constants.EXTRA_ORDER_ID, -1L).takeIf { it > 0 }
    }
}
