package com.ganraj.logistics.driver.ui.orders

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ganraj.logistics.driver.R
import com.ganraj.logistics.driver.core.util.ContactActions
import com.ganraj.logistics.driver.core.util.DateFormatters
import com.ganraj.logistics.driver.data.model.Order
import com.ganraj.logistics.driver.data.model.OrderStatus
import com.ganraj.logistics.driver.location.LocationTrackingService
import com.ganraj.logistics.driver.location.PermissionHelper
import com.ganraj.logistics.driver.ui.components.ErrorView
import com.ganraj.logistics.driver.ui.components.LoadingView
import com.ganraj.logistics.driver.ui.orders.components.StatusActionButton
import com.ganraj.logistics.driver.ui.orders.components.StatusChip

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailScreen(
    onBack: () -> Unit,
    onOpenMap: () -> Unit,
    viewModel: OrderDetailViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val order = state.order
    var permissionDenied by remember { mutableStateOf(false) }
    var needsBackground by remember { mutableStateOf(PermissionHelper.needsBackgroundLocation(context)) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        if (PermissionHelper.hasLocation(context)) {
            permissionDenied = false
            needsBackground = PermissionHelper.needsBackgroundLocation(context)
            if (order?.status?.isTracking == true) LocationTrackingService.start(context)
        } else {
            permissionDenied = true
        }
    }
    val backgroundLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        needsBackground = PermissionHelper.needsBackgroundLocation(context)
    }

    // Tracking runs only while the order is PICKED_UP / IN_TRANSIT, and stops when it ends.
    LaunchedEffect(order?.status) {
        when (order?.status) {
            OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT ->
                if (PermissionHelper.hasLocation(context)) LocationTrackingService.start(context)
                else permissionLauncher.launch(PermissionHelper.runtimePermissions())
            OrderStatus.DELIVERED, OrderStatus.CANCELLED -> LocationTrackingService.stop(context)
            else -> Unit
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text(order?.reference ?: stringResource(R.string.title_order_detail)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.isLoading -> LoadingView()
                state.error != null -> ErrorView(state.error!!, onRetry = viewModel::load)
                order != null -> OrderDetailContent(
                    order = order,
                    isUpdating = state.isUpdating,
                    actionError = state.actionError,
                    permissionDenied = permissionDenied,
                    showBackgroundHint = needsBackground && order.status.isTracking,
                    onStatusClick = viewModel::updateStatus,
                    onNavigate = {
                        // Head to the pickup first, then to the drop.
                        val toPickup = order.status == OrderStatus.ASSIGNED || order.status == OrderStatus.CREATED
                        val lat = if (toPickup) order.pickupLat else order.dropLat
                        val lng = if (toPickup) order.pickupLng else order.dropLng
                        if (lat != null && lng != null) ContactActions.navigateTo(context, lat, lng)
                    },
                    onOpenMap = onOpenMap,
                    onCallCustomer = { order.customerPhone?.let { ContactActions.dial(context, it) } },
                    onAllowBackground = { backgroundLauncher.launch(Manifest.permission.ACCESS_BACKGROUND_LOCATION) }
                )
            }
        }
    }
}

@Composable
private fun OrderDetailContent(
    order: Order,
    isUpdating: Boolean,
    actionError: String?,
    permissionDenied: Boolean,
    showBackgroundHint: Boolean,
    onStatusClick: (OrderStatus) -> Unit,
    onNavigate: () -> Unit,
    onOpenMap: () -> Unit,
    onCallCustomer: () -> Unit,
    onAllowBackground: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            StatusChip(order.status)
            Spacer(Modifier.weight(1f))
            Text(
                DateFormatters.formatForDisplay(order.createdAt),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
            )
        }

        InfoCard(stringResource(R.string.pickup), order.pickupAddress)
        InfoCard(stringResource(R.string.drop), order.dropAddress)
        InfoCard(stringResource(R.string.customer), listOfNotNull(order.customerName, order.customerPhone).joinToString("  •  "))
        order.itemDescription?.takeIf { it.isNotBlank() }?.let { InfoCard(stringResource(R.string.item), it) }

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onNavigate, modifier = Modifier.weight(1f)) { Text(stringResource(R.string.navigate)) }
            OutlinedButton(onClick = onOpenMap, modifier = Modifier.weight(1f)) { Text(stringResource(R.string.view_map)) }
            if (!order.customerPhone.isNullOrBlank()) {
                OutlinedButton(onClick = onCallCustomer, modifier = Modifier.weight(1f)) {
                    Text(stringResource(R.string.call_customer))
                }
            }
        }

        if (permissionDenied) {
            Text(
                stringResource(R.string.location_permission_needed),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.labelLarge
            )
        }
        if (showBackgroundHint) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(stringResource(R.string.background_location_hint), style = MaterialTheme.typography.labelLarge)
                    Button(onClick = onAllowBackground) { Text(stringResource(R.string.allow_all_time)) }
                }
            }
        }
        if (actionError != null) {
            Text(actionError, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyLarge)
        }

        Spacer(Modifier.height(4.dp))
        StatusActionButton(current = order.status, isLoading = isUpdating, onClick = onStatusClick)
    }
}

@Composable
private fun InfoCard(label: String, value: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(
                label.uppercase(),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary
            )
            Spacer(Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.bodyLarge)
        }
    }
}
