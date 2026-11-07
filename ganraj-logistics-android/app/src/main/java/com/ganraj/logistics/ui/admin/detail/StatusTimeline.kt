package com.ganraj.logistics.ui.admin.detail

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.domain.model.StatusHistory
import com.ganraj.logistics.ui.theme.Orange500
import com.ganraj.logistics.util.Formatters

/** Status history timeline (newest first). */
@Composable
fun StatusTimeline(history: List<StatusHistory>) {
    Column {
        Text("Status History", style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(10.dp))
        if (history.isEmpty()) {
            Text("No history yet.", color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium)
        }
        history.asReversed().forEachIndexed { index, entry ->
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Spacer(
                        Modifier
                            .width(12.dp)
                            .height(12.dp)
                            .padding(top = 4.dp)
                    )
                    androidx.compose.foundation.Canvas(
                        Modifier.width(12.dp).height(12.dp)
                    ) {
                        drawCircle(color = Orange500)
                    }
                    if (index < history.lastIndex) {
                        Spacer(
                            Modifier
                                .width(2.dp)
                                .height(28.dp)
                                .padding(top = 2.dp)
                        )
                    }
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(entry.newStatus, style = MaterialTheme.typography.titleMedium)
                    Text(
                        buildString {
                            append(Formatters.formatDate(entry.changedAt))
                            entry.oldStatus?.let { append("  (from $it)") }
                            entry.adminName?.let { append("  •  by $it") }
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            if (index < history.lastIndex) Spacer(Modifier.height(10.dp))
        }
    }
}
