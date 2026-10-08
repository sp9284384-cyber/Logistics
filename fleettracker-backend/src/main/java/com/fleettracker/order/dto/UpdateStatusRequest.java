package com.fleettracker.order.dto;

import com.fleettracker.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull OrderStatus status) {}
