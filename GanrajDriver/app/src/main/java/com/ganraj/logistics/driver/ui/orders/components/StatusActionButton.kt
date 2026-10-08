package com.ganraj.logistics.driver.ui.orders.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ganraj.logistics.driver.data.model.OrderStatus

/** Shows only the next valid step (Picked Up, then In Transit, then Delivered). Hidden when there is none. */
@Composable
fun StatusActionButton(
    current: OrderStatus,
    isLoading: Boolean,
    onClick: (OrderStatus) -> Unit,
    modifier: Modifier = Modifier
) {
    val next = current.next() ?: return
    Button(
        onClick = { onClick(next) },
        enabled = !isLoading,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.secondary,
            contentColor = MaterialTheme.colorScheme.onSecondary
        ),
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onSecondary
            )
        } else {
            Text("Mark as ${next.label}".uppercase())
        }
    }
}
