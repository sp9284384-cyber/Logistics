package com.fleettracker.user.dto;

import com.fleettracker.user.Role;
import com.fleettracker.user.User;

public record UserResponse(Long id, String name, String email, Role role, String phone) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(),
            user.getRole(), user.getPhone());
    }
}
