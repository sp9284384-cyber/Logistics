package com.fleettracker.auth.dto;

public record AuthResponse(String token, String role, String name) {}
