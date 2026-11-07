package com.ganraj.logistics.ui.about

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.util.Constants

@Composable
fun AboutScreen(onBack: () -> Unit) {
    Scaffold(topBar = { AppTopBar(title = "About Us", showBack = true, onBack = onBack) }) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            Text("About ${Constants.COMPANY_NAME}", style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(12.dp))
            Text(
                "${Constants.COMPANY_NAME} is a logistics and transportation service provider focused on " +
                "dependable transportation solutions for businesses. We understand that transportation " +
                "is an important part of every business — our objective is to make the movement of " +
                "goods simple, reliable and hassle-free.",
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "We coordinate transportation requirements with suitable vehicles and provide " +
                "professional communication throughout the movement.",
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(Modifier.height(20.dp))

            Text("Our Mission", style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.height(6.dp))
            Text(
                "To provide reliable, transparent and customer-focused logistics solutions that help " +
                "businesses move their goods efficiently.",
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(Modifier.height(16.dp))

            Text("Our Vision", style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.height(6.dp))
            Text(
                "To build a trusted logistics network connecting businesses and transportation " +
                "partners across India.",
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(Modifier.height(20.dp))

            Text("Owner: ${Constants.OWNER}", style = MaterialTheme.typography.titleMedium)
            Text("GST No: ${Constants.GST_NUMBER}", style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(24.dp))
        }
    }
}
