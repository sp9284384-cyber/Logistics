package com.fleettracker.user;

import java.util.List;

import com.fleettracker.user.dto.CreateUserRequest;
import com.fleettracker.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Drivers shown in the "assign order" dropdown. */
    @GetMapping("/drivers")
    @PreAuthorize("hasRole('DISPATCHER')")
    public List<UserResponse> listActiveDrivers() {
        return userService.getActiveDrivers();
    }

    /** Dispatcher-only user creation (or seed the first accounts via Flyway). */
    @PostMapping
    @PreAuthorize("hasRole('DISPATCHER')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.createUser(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").build(created.id());
        return ResponseEntity.created(location).body(created);
    }
}
