package com.ganraj.logistics.driver

import com.ganraj.logistics.driver.data.model.OrderStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class OrderStatusTest {
    @Test fun driver_flow_is_assigned_pickedUp_inTransit_delivered() {
        assertEquals(OrderStatus.PICKED_UP, OrderStatus.ASSIGNED.next())
        assertEquals(OrderStatus.IN_TRANSIT, OrderStatus.PICKED_UP.next())
        assertEquals(OrderStatus.DELIVERED, OrderStatus.IN_TRANSIT.next())
    }

    @Test fun final_and_unassigned_statuses_have_no_next_step() {
        assertNull(OrderStatus.DELIVERED.next())
        assertNull(OrderStatus.CANCELLED.next())
        assertNull(OrderStatus.CREATED.next())
    }

    @Test fun tracking_only_while_moving_goods() {
        assertTrue(OrderStatus.PICKED_UP.isTracking)
        assertTrue(OrderStatus.IN_TRANSIT.isTracking)
        assertFalse(OrderStatus.ASSIGNED.isTracking)
        assertFalse(OrderStatus.DELIVERED.isTracking)
    }
}
