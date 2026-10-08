package com.ganraj.logistics.driver.ui.orders.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.driver.data.model.OrderStatus
import com.ganraj.logistics.driver.ui.theme.StatusAmber
import com.ganraj.logistics.driver.ui.theme.StatusBlue
import com.ganraj.logistics.driver.ui.theme.StatusGreen
import com.ganraj.logistics.driver.ui.theme.StatusGrey
import com.ganraj.logistics.driver.ui.theme.StatusPurple
import com.ganraj.logistics.driver.ui.theme.StatusRed

fun OrderStatus.color(): Color = when (this) {
    OrderStatus.CREATED -> StatusGrey
    OrderStatus.ASSIGNED -> StatusBlue
    OrderStatus.PICKED_UP -> StatusAmber
    OrderStatus.IN_TRANSIT -> StatusPurple
    OrderStatus.DELIVERED -> StatusGreen
    OrderStatus.CANCELLED -> StatusRed
}

@Composable
fun StatusChip(status: OrderStatus, modifier: Modifier = Modifier) {
    Text(
        text = status.label,
        style = MaterialTheme.typography.labelLarge,
        color = Color.White,
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(status.color())
            .padding(horizontal = 12.dp, vertical = 4.dp)
    )
}
