package com.ganraj.logistics.ui.booking

import androidx.compose.foundation.layout.Arrangement
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.ui.components.DropdownField
import com.ganraj.logistics.ui.components.LabeledTextField
import com.ganraj.logistics.ui.components.PrimaryButton
import com.ganraj.logistics.util.Constants

@Composable
fun BookingScreen(
    onBack: () -> Unit,
    onSuccess: (String) -> Unit,
    viewModel: BookingViewModel = hiltViewModel()
) {
    val form = viewModel.form
    Scaffold(topBar = { AppTopBar(title = "Request a Quote", showBack = true, onBack = onBack) }) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                "Share Your Requirement",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                "Pickup Location + Delivery Location + Material + Quantity + Vehicle Requirement",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            LabeledTextField(
                label = "Pickup Location *",
                value = form.pickupLocation,
                onValueChange = { viewModel.update("pickup", it) },
                error = form.errors["pickup"],
                placeholder = "e.g. Badlapur, Thane"
            )
            LabeledTextField(
                label = "Delivery Location *",
                value = form.deliveryLocation,
                onValueChange = { viewModel.update("delivery", it) },
                error = form.errors["delivery"],
                placeholder = "e.g. Pune"
            )
            LabeledTextField(
                label = "Material *",
                value = form.material,
                onValueChange = { viewModel.update("material", it) },
                error = form.errors["material"],
                placeholder = "e.g. Plastic granules"
            )
            LabeledTextField(
                label = "Quantity *",
                value = form.quantity,
                onValueChange = { viewModel.update("quantity", it) },
                error = form.errors["quantity"],
                placeholder = "e.g. 5 tonnes"
            )
            DropdownField(
                label = "Vehicle Requirement",
                options = Constants.VEHICLE_TYPES,
                selected = form.vehicleType,
                onSelected = { viewModel.update("vehicle", it) }
            )
            LabeledTextField(
                label = "Preferred Pickup Date (yyyy-MM-dd)",
                value = form.pickupDate,
                onValueChange = { viewModel.update("date", it) },
                error = form.errors["date"],
                placeholder = "2026-11-01"
            )
            LabeledTextField(
                label = "Your Name *",
                value = form.customerName,
                onValueChange = { viewModel.update("name", it) },
                error = form.errors["name"]
            )
            LabeledTextField(
                label = "Phone Number *",
                value = form.phone,
                onValueChange = { viewModel.update("phone", it) },
                error = form.errors["phone"],
                placeholder = "10-digit mobile number"
            )

            form.submitError?.let {
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyLarge)
            }

            Spacer(Modifier.height(4.dp))
            PrimaryButton(
                text = if (form.submitting) "Submitting…" else "Submit Booking Request",
                onClick = { viewModel.submit(onSuccess) },
                enabled = !form.submitting
            )
            Spacer(Modifier.height(24.dp))
        }
    }
}
