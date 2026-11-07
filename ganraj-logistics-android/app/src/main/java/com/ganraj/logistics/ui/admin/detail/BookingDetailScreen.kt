package com.ganraj.logistics.ui.admin.detail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ganraj.logistics.domain.model.Booking
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.ui.components.LoadingIndicator
import com.ganraj.logistics.ui.components.StatusBadge
import com.ganraj.logistics.util.Formatters
import com.ganraj.logistics.util.UiState

@Composable
fun BookingDetailScreen(
    id: Int,
    onBack: () -> Unit,
    viewModel: BookingDetailViewModel = hiltViewModel()
) {
    LaunchedEffect(id) { viewModel.load(id) }

    Scaffold(topBar = { AppTopBar(title = "Booking Detail", showBack = true, onBack = onBack) }) { padding ->
        when (val state = viewModel.uiState) {
            is UiState.Loading -> LoadingIndicator(Modifier.padding(padding))
            is UiState.Error -> Column(
                Modifier.fillMaxSize().padding(padding).padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(state.message, color = MaterialTheme.colorScheme.error)
                TextButton(onClick = { viewModel.load(id) }) { Text("Retry") }
            }
            is UiState.Success -> BookingDetailContent(
                booking = state.data,
                viewModel = viewModel,
                modifier = Modifier.padding(padding)
            )
        }
    }
}

@Composable
private fun BookingDetailContent(
    booking: Booking,
    viewModel: BookingDetailViewModel,
    modifier: Modifier = Modifier
) {
    Column(
        modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(booking.reference, style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary)
                Text(
                    "Created ${Formatters.formatDate(booking.createdAt)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            StatusBadge(booking.status)
        }
        HorizontalDivider()

        DetailRow("Pickup", booking.pickupLocation)
        DetailRow("Delivery", booking.deliveryLocation)
        DetailRow("Material", booking.material)
        DetailRow("Quantity", booking.quantity)
        DetailRow("Vehicle", booking.vehicleType)
        DetailRow("Pickup date", Formatters.formatDate(booking.pickupDate))
        DetailRow("Customer", booking.customerName)
        DetailRow("Phone", booking.phone)
        HorizontalDivider()

        viewModel.updateError?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyLarge)
        }
        StatusUpdater(
            current = booking.status,
            selected = viewModel.selectedStatus,
            updating = viewModel.updating,
            onSelected = viewModel::onStatusSelected,
            onConfirm = viewModel::confirmStatusChange
        )
        Spacer(Modifier.height(6.dp))
        HorizontalDivider()
        StatusTimeline(booking.history)
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth()) {
        Text(
            label,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.secondary,
            modifier = Modifier.width(110.dp)
        )
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}
