package com.fleettracker.order.dto;

import jakarta.validation.constraints.NotNull;

public record AssignOrderRequest(@NotNull Long driverId) {}
