package com.fleettracker.user;

import java.util.List;

import com.fleettracker.common.exception.NotFoundException;
import com.fleettracker.user.dto.CreateUserRequest;
import com.fleettracker.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getActiveDrivers() {
        return userRepository.findByRoleAndActiveTrue(Role.DRIVER).stream()
            .map(UserResponse::from)
            .toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(u -> {
            throw new IllegalArgumentException("Email already registered: " + request.email());
        });
        User user = User.builder()
            .name(request.name())
            .email(request.email())
            .passwordHash(passwordEncoder.encode(request.password()))
            .role(request.role())
            .phone(request.phone())
            .active(true)
            .build();
        return UserResponse.from(userRepository.save(user));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found: " + id));
    }
}
