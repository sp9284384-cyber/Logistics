package com.ganraj.logistics.ui.contact

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.ui.components.PrimaryButton
import com.ganraj.logistics.ui.components.WhatsAppFab
import com.ganraj.logistics.util.Constants
import com.ganraj.logistics.util.IntentHelper

@Composable
fun ContactScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    Scaffold(
        topBar = { AppTopBar(title = "Contact Us", showBack = true, onBack = onBack) },
        floatingActionButton = { WhatsAppFab() }
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp)
        ) {
            Text("Contact ${Constants.COMPANY_NAME}", style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(8.dp))
            Text(
                "Need a transport vehicle? Send us your transportation requirement and our team " +
                "will get back to you.",
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(Modifier.height(20.dp))

            ContactRow("Call / WhatsApp", Constants.PHONE_NUMBER)
            ContactRow("Email", Constants.EMAIL)
            ContactRow("Service Area", Constants.SERVICE_AREA)
            ContactRow("Owner", Constants.OWNER)
            Spacer(Modifier.height(8.dp))
            ContactRow("Registered Address", Constants.ADDRESS)
            ContactRow("GST No.", Constants.GST_NUMBER)
            Spacer(Modifier.height(16.dp))
            Text(
                "Transportation Services: FTL | LTL | Industrial Transport | Distribution | Vehicle Arrangement",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(24.dp))

            PrimaryButton(text = "Call Now", onClick = { IntentHelper.dial(context) })
            Spacer(Modifier.height(12.dp))
            PrimaryButton(text = "WhatsApp Us", onClick = { IntentHelper.whatsApp(context) })
            Spacer(Modifier.height(12.dp))
            PrimaryButton(text = "Email Us", onClick = { IntentHelper.email(context) })
        }
    }
}

@Composable
private fun ContactRow(label: String, value: String) {
    Column(Modifier.padding(vertical = 6.dp)) {
        Text(label, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.secondary)
        Spacer(Modifier.height(2.dp))
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}
