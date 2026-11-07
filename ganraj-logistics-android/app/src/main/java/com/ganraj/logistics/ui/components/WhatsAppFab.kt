package com.ganraj.logistics.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.util.IntentHelper

/** Floating WhatsApp button on public screens. */
@Composable
fun WhatsAppFab() {
    val context = LocalContext.current
    FloatingActionButton(
        onClick = { IntentHelper.whatsApp(context) },
        containerColor = MaterialTheme.colorScheme.secondary,
        contentColor = MaterialTheme.colorScheme.onSecondary,
        shape = CircleShape
    ) {
        Icon(Icons.Default.Share, contentDescription = "WhatsApp us", modifier = Modifier.size(26.dp))
    }
}
