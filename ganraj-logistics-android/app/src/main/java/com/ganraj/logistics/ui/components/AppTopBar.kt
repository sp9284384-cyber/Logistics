package com.ganraj.logistics.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.util.Constants
import com.ganraj.logistics.util.IntentHelper

/** Header with the brand on the left and a Call button on the right. */
@Composable
fun AppTopBar(
    title: String = Constants.COMPANY_NAME,
    showBack: Boolean = false,
    onBack: (() -> Unit)? = null,
    action: (@Composable () -> Unit)? = null
) {
    val context = LocalContext.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.primary)
            .padding(horizontal = 8.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (showBack && onBack != null) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onPrimary)
            }
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onPrimary,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.weight(1f)
        )
        action?.invoke() ?: IconButton(
            onClick = { IntentHelper.dial(context) },
            modifier = Modifier
                .background(MaterialTheme.colorScheme.secondary, CircleShape)
                .size(38.dp)
        ) {
            Icon(
                Icons.Default.Call,
                contentDescription = "Call now",
                tint = MaterialTheme.colorScheme.onSecondary,
                modifier = Modifier.size(20.dp)
            )
        }
        Spacer(Modifier.width(4.dp))
    }
}
