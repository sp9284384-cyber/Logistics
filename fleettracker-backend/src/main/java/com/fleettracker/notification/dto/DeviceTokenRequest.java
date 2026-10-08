package com.fleettracker.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeviceTokenRequest(
    @NotBlank @Size(max = 255) String token
) {}
