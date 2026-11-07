package com.ganraj.logistics.ui.admin.detail

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.domain.model.BookingStatus
import com.ganraj.logistics.ui.components.DropdownField
import com.ganraj.logistics.ui.components.PrimaryButton

/** Status dropdown + confirm button. */
@Composable
fun StatusUpdater(
    current: BookingStatus,
    selected: BookingStatus,
    updating: Boolean,
    onSelected: (BookingStatus) -> Unit,
    onConfirm: () -> Unit
) {
    Column(Modifier.fillMaxWidth()) {
        Text("Update Status", style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(10.dp))
        DropdownField(
            label = "New status",
            options = BookingStatus.entries.map { it.label },
            selected = selected.label,
            onSelected = { label ->
                BookingStatus.entries.firstOrNull { it.label == label }?.let(onSelected)
            }
        )
        Spacer(Modifier.height(12.dp))
        PrimaryButton(
            text = when {
                updating -> "Updating…"
                selected == current -> "Status is already "${current.label}""
                else -> "Update to "${selected.label}""
            },
            onClick = onConfirm,
            enabled = !updating && selected != current
        )
    }
}
