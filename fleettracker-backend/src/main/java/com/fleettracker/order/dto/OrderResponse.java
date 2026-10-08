package com.fleettracker.order.dto;

import java.time.Instant;

import com.fleettracker.order.Order;
import com.fleettracker.order.OrderStatus;

public record OrderResponse(
    Long id,
    String referenceNumber,
    String pickupAddress,
    Double pickupLat,
    Double pickupLng,
    String dropAddress,
    Double dropLat,
    Double dropLng,
    String customerName,
    String customerPhone,
    String itemDescription,
    OrderStatus status,
    Long createdById,
    Long assignedDriverId,
    Instant createdAt,
    Instant updatedAt
) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
            order.getId(),
            order.getReferenceNumber(),
            order.getPickupAddress(),
            order.getPickupLat(),
            order.getPickupLng(),
            order.getDropAddress(),
            order.getDropLat(),
            order.getDropLng(),
            order.getCustomerName(),
            order.getCustomerPhone(),
            order.getItemDescription(),
            order.getStatus(),
            order.getCreatedBy() != null ? order.getCreatedBy().getId() : null,
            order.getAssignedDriver() != null ? order.getAssignedDriver().getId() : null,
            order.getCreatedAt(),
            order.getUpdatedAt()
        );
    }
}
