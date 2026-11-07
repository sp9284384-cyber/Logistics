package com.ganraj.logistics.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.ui.components.PrimaryButton
import com.ganraj.logistics.ui.theme.Green600
import com.ganraj.logistics.util.Constants

@Composable
fun BookingSuccessScreen(reference: String, onDone: () -> Unit) {
    Scaffold(topBar = { AppTopBar() }) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = null,
                tint = Green600,
                modifier = Modifier.height(72.dp)
            )
            Spacer(Modifier.height(16.dp))
            Text("Booking Submitted", style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            Text(
                "Thank you! ${Constants.COMPANY_NAME} will contact you shortly with a transportation quote.",
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(Modifier.height(16.dp))
            Text("Booking Reference", style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(reference, style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.height(28.dp))
            PrimaryButton(text = "Back to Home", onClick = onDone)
        }
    }
}
