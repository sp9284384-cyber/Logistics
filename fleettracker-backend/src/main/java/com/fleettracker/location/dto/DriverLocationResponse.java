package com.fleettracker.location.dto;

import java.time.Instant;

public record DriverLocationResponse(
    Long driverId,
    String driverName,
    Double latitude,
    Double longitude,
    Double speed,
    Instant recordedAt
) {}
