package com.ganraj.logistics.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.ui.components.PrimaryButton
import com.ganraj.logistics.ui.components.WhatsAppFab
import com.ganraj.logistics.ui.navigation.Routes
import com.ganraj.logistics.ui.theme.Navy900
import com.ganraj.logistics.ui.theme.Orange100
import com.ganraj.logistics.util.Constants
import com.ganraj.logistics.util.IntentHelper

private data class Service(val icon: String, val title: String, val desc: String)

private val services = listOf(
    Service("FTL", "Full Truck Load (FTL)", "Transportation for bulk and commercial shipments."),
    Service("LTL", "Part Load / LTL", "Cost-effective solutions for smaller shipments."),
    Service("IND", "Industrial Transport", "Transportation support for manufacturers and factories."),
    Service("DIST", "Distribution", "Movement of goods between factory, warehouse, distributor and customer."),
    Service("VEH", "Vehicle Arrangement", "We coordinate suitable vehicles for your shipment."),
    Service("ALL", "All India Transportation", "Transportation coordination for routes across India.")
)

private val whyUs = listOf(
    "Reliable Coordination" to "Proper communication between customer, vehicle owner and driver.",
    "Competitive Rates" to "Practical transportation solutions at competitive market rates.",
    "Timely Service" to "We respect pickup and delivery schedules.",
    "Customer Support" to "Regular updates on your transportation movement.",
    "Pan India Network" to "GPS-tracked movement across the country.",
    "24x7 Support" to "We are reachable whenever your cargo is moving."
)

private val steps = listOf(
    "Share Your Requirement" to "Pickup + delivery location, material, quantity, vehicle need.",
    "Get Transportation Quote" to "We check the requirement and provide the applicable rate.",
    "Vehicle Arrangement" to "After confirmation, we coordinate a suitable vehicle.",
    "Pickup" to "The vehicle reaches the pickup location as scheduled.",
    "Delivery" to "Goods are transported safely to the destination.",
    "Delivery Update" to "You are updated at every stage until handover."
)

@Composable
fun HomeScreen(onRequestQuote: () -> Unit, onNavigate: (String) -> Unit) {
    val context = LocalContext.current
    Scaffold(
        topBar = { AppTopBar() },
        floatingActionButton = { WhatsAppFab() }
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            // ---- Hero ----
            Column(
                Modifier
                    .fillMaxWidth()
                    .background(Navy900)
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    Constants.COMPANY_NAME,
                    style = MaterialTheme.typography.displaySmall,
                    color = MaterialTheme.colorScheme.onPrimary,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "Reliable Transport & Logistics Solutions Across India",
                    style = MaterialTheme.typography.titleMedium,
                    color = Orange100,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    Constants.TAGLINE,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f),
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(20.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    androidx.compose.material3.Button(
                        onClick = { IntentHelper.dial(context) },
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.secondary
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.height(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Call Now")
                    }
                    androidx.compose.material3.OutlinedButton(
                        onClick = { IntentHelper.whatsApp(context) },
                        shape = RoundedCornerShape(10.dp),
                        colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    ) { Text("WhatsApp Us") }
                }
                Spacer(Modifier.height(12.dp))
                PrimaryButton(text = "Request a Quote", onClick = onRequestQuote)
            }

            // ---- Quick nav ----
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                listOf("About Us" to Routes.ABOUT, "Services" to Routes.SERVICES, "Contact" to Routes.CONTACT)
                    .forEach { (label, route) ->
                        TextButton(onClick = { onNavigate(route) }) {
                            Text(label, color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.Bold)
                        }
                    }
            }

            SectionTitle("Moving Your Goods. Connecting Your Business.")
            SectionBody(
                "${Constants.COMPANY_NAME} provides transportation and logistics coordination for " +
                "businesses, manufacturers, traders, distributors and other commercial requirements. " +
                "Our focus is reliable vehicle arrangements, timely pickup, safe transportation and " +
                "professional coordination."
            )

            SectionTitle("Our Services")
            services.chunked(2).forEach { row ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    row.forEach { service ->
                        ServiceCard(service, Modifier.weight(1f))
                    }
                }
                Spacer(Modifier.height(12.dp))
            }

            SectionTitle("Why Choose Us?")
            Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                whyUs.forEach { (title, desc) -> InfoRow(title, desc) }
            }
            Spacer(Modifier.height(16.dp))

            SectionTitle("How It Works")
            Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                steps.forEachIndexed { index, (title, desc) ->
                    InfoRow("Step ${index + 1} — $title", desc)
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.headlineMedium,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
    )
}

@Composable
private fun SectionBody(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(horizontal = 16.dp)
    )
}

@Composable
private fun ServiceCard(service: Service, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(
                service.icon,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary
            )
            Spacer(Modifier.height(6.dp))
            Text(service.title, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(4.dp))
            Text(service.desc, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun InfoRow(title: String, desc: String) {
    Row {
        Icon(
            Icons.Default.Place,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.secondary,
            modifier = Modifier.padding(top = 2.dp)
        )
        Spacer(Modifier.width(8.dp))
        Column {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(desc, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
