package com.ganraj.logistics.ui.services

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.ui.components.AppTopBar

private data class Detail(val title: String, val desc: String, val points: List<String>)

private val details = listOf(
    Detail(
        "Full Truck Load – FTL",
        "For customers who require an entire vehicle for their shipment.",
        listOf("Factory dispatches", "Bulk goods", "Industrial materials", "Large commercial shipments")
    ),
    Detail(
        "Part Load – LTL",
        "For smaller shipments where a full truck may not be required.",
        listOf("Small consignments", "Cost sharing", "Flexible schedules")
    ),
    Detail(
        "Industrial Transportation",
        "Transportation coordination for factories, manufacturing units and industrial businesses.",
        listOf("Raw material in", "Finished goods out", "Regular routes")
    ),
    Detail(
        "Distribution Transportation",
        "Movement of goods from factory to customer.",
        listOf("Factory → Warehouse", "Warehouse → Distributor", "Distributor → Customer")
    ),
    Detail(
        "Vehicle Placement",
        "We arrange suitable vehicles according to your requirement.",
        listOf("Pickup location", "Delivery location", "Material type", "Quantity", "Vehicle requirement")
    ),
    Detail(
        "All India Transportation",
        "Transportation coordination for different routes across India.",
        listOf("Pan India service", "GPS tracking", "24x7 support")
    )
)

@Composable
fun ServicesScreen(onBack: () -> Unit) {
    Scaffold(topBar = { AppTopBar(title = "Services", showBack = true, onBack = onBack) }) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            details.forEach { item ->
                Card(
                    Modifier.fillMaxWidth(),
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text(item.title, style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.height(6.dp))
                        Text(item.desc, style = MaterialTheme.typography.bodyLarge)
                        Spacer(Modifier.height(8.dp))
                        item.points.forEach { point ->
                            Text("•  $point", style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}
