package com.ganraj.logistics.ui.admin.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ganraj.logistics.domain.model.BookingStatus
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.ui.components.DropdownField
import com.ganraj.logistics.ui.components.LoadingIndicator
import com.ganraj.logistics.util.UiState

@Composable
fun DashboardScreen(
    onBack: () -> Unit,
    onOpenBooking: (Int) -> Unit,
    onLoggedOut: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    Scaffold(
        topBar = {
            AppTopBar(
                title = "Booking Requests",
                showBack = true,
                onBack = onBack,
                action = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { viewModel.refresh() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh",
                                tint = MaterialTheme.colorScheme.onPrimary)
                        }
                        IconButton(onClick = { viewModel.logout(onLoggedOut) }) {
                            Icon(Icons.Default.ExitToApp, contentDescription = "Log out",
                                tint = MaterialTheme.colorScheme.onPrimary)
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = viewModel.searchQuery,
                onValueChange = viewModel::onSearchChange,
                placeholder = { Text("Search reference, name, phone, city…") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(Modifier.height(10.dp))
            DropdownField(
                label = "Status filter",
                options = listOf("All") + BookingStatus.entries.map { it.label },
                selected = viewModel.statusFilter?.label ?: "All",
                onSelected = { label ->
                    viewModel.setStatusFilter(
                        BookingStatus.entries.firstOrNull { it.label == label }
                    )
                }
            )
            Spacer(Modifier.height(12.dp))

            when (val state = viewModel.uiState) {
                is UiState.Loading -> LoadingIndicator()
                is UiState.Error -> Column(
                    Modifier.fillMaxWidth().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(state.message, color = MaterialTheme.colorScheme.error)
                    if (state.retryable) {
                        TextButton(onClick = { viewModel.refresh() }) { Text("Retry") }
                    }
                }
                is UiState.Success -> {
                    if (state.data.isEmpty()) {
                        Text(
                            "No booking requests found.",
                            modifier = Modifier.padding(24.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(state.data, key = { it.id }) { booking ->
                                BookingCard(booking) { onOpenBooking(booking.id) }
                            }
                            item {
                                Row(
                                    Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    TextButton(
                                        onClick = { viewModel.prevPage() },
                                        enabled = viewModel.currentPage > 1
                                    ) { Text("Prev") }
                                    Spacer(Modifier.width(16.dp))
                                    Text("Page ${viewModel.currentPage} of ${viewModel.totalPages}")
                                    Spacer(Modifier.width(16.dp))
                                    TextButton(
                                        onClick = { viewModel.nextPage() },
                                        enabled = viewModel.currentPage < viewModel.totalPages
                                    ) { Text("Next") }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
