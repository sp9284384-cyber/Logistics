package com.ganraj.logistics.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.domain.model.BookingStatus
import com.ganraj.logistics.ui.theme.Amber600
import com.ganraj.logistics.ui.theme.Green600
import com.ganraj.logistics.ui.theme.GreyText
import com.ganraj.logistics.ui.theme.Navy500
import com.ganraj.logistics.ui.theme.Orange600
import com.ganraj.logistics.ui.theme.Red600
import com.ganraj.logistics.ui.theme.Sky600
import com.ganraj.logistics.ui.theme.Slate600

/** Coloured status label. */
@Composable
fun StatusBadge(status: BookingStatus) {
    val (bg, fg) = when (status) {
        BookingStatus.NEW -> Navy500 to Color.White
        BookingStatus.QUOTED -> Amber600 to Color.White
        BookingStatus.VEHICLE_ASSIGNED -> Sky600 to Color.White
        BookingStatus.IN_TRANSIT -> Orange600 to Color.White
        BookingStatus.DELIVERED -> Green600 to Color.White
        BookingStatus.CANCELLED -> Red600 to Color.White
    }
    Text(
        text = status.label,
        style = MaterialTheme.typography.labelLarge,
        color = fg,
        modifier = Modifier
            .background(bg, RoundedCornerShape(8.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    )
}
