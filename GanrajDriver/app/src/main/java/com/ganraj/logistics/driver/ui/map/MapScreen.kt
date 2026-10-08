package com.ganraj.logistics.driver.ui.map

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ganraj.logistics.driver.R
import com.ganraj.logistics.driver.location.PermissionHelper
import com.ganraj.logistics.driver.ui.components.ErrorView
import com.ganraj.logistics.driver.ui.components.LoadingView
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import com.google.maps.android.compose.rememberMarkerState

/** Driver's live position plus the pickup and drop markers. Needs a Maps API key to draw tiles. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(onBack: () -> Unit, viewModel: MapViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        if (PermissionHelper.hasLocation(context)) viewModel.startLocationUpdates()
    }
    LaunchedEffect(Unit) {
        if (PermissionHelper.hasLocation(context)) viewModel.startLocationUpdates()
        else permissionLauncher.launch(PermissionHelper.runtimePermissions())
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.order?.reference ?: stringResource(R.string.title_map)) },
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
                else -> RouteMap(state)
            }
        }
    }
}

@Composable
private fun RouteMap(state: MapUiState) {
    val pickup = state.pickup
    val drop = state.drop
    val driver = state.driver
    val cameraState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(pickup ?: drop ?: LatLng(19.0760, 72.8777), 9f) // Mumbai fallback
    }
    var mapLoaded by remember { mutableStateOf(false) }

    // Fit the camera to everything we know about once the map is ready.
    LaunchedEffect(mapLoaded, pickup, drop, driver != null) {
        if (!mapLoaded) return@LaunchedEffect
        val points = listOfNotNull(pickup, drop, driver)
        when {
            points.size >= 2 -> {
                val bounds = LatLngBounds.builder().apply { points.forEach { include(it) } }.build()
                cameraState.animate(CameraUpdateFactory.newLatLngBounds(bounds, 150))
            }
            points.size == 1 -> cameraState.animate(CameraUpdateFactory.newLatLngZoom(points.first(), 13f))
        }
    }

    // MarkerState only reads its starting position, so keep one state per marker and move it ourselves.
    val pickupMarker = remember(pickup) { MarkerState(position = pickup ?: LatLng(0.0, 0.0)) }
    val dropMarker = remember(drop) { MarkerState(position = drop ?: LatLng(0.0, 0.0)) }
    val driverMarker = rememberMarkerState(key = "driver")
    LaunchedEffect(driver) { driver?.let { driverMarker.position = it } }

    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraState,
        onMapLoaded = { mapLoaded = true }
    ) {
        if (pickup != null) {
            Marker(
                state = pickupMarker,
                title = "Pickup",
                snippet = state.order?.pickupAddress,
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)
            )
        }
        if (drop != null) {
            Marker(
                state = dropMarker,
                title = "Drop",
                snippet = state.order?.dropAddress,
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
            )
        }
        if (driver != null) {
            Marker(
                state = driverMarker,
                title = "You",
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_ORANGE)
            )
        }
    }
}
