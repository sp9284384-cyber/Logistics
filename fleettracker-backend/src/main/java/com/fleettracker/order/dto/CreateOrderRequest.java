package com.fleettracker.order.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(
    @NotBlank @Size(max = 500) String pickupAddress,
    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double pickupLat,
    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double pickupLng,
    @NotBlank @Size(max = 500) String dropAddress,
    @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double dropLat,
    @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double dropLng,
    @NotBlank @Size(max = 100) String customerName,
    @Pattern(regexp = "^[0-9+\\-\\s]{7,20}$", message = "Invalid phone number") String customerPhone,
    @Size(max = 500) String itemDescription
) {}
