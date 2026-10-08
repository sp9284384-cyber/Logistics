package com.fleettracker.user.dto;

import com.fleettracker.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email @Size(max = 150) String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotNull Role role,
    @Pattern(regexp = "^[0-9+\\-\\s]{7,20}$", message = "Invalid phone number") String phone
) {}
