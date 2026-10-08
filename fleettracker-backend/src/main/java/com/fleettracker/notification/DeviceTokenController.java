package com.fleettracker.notification;

import com.fleettracker.common.exception.NotFoundException;
import com.fleettracker.notification.dto.DeviceTokenRequest;
import com.fleettracker.user.User;
import com.fleettracker.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceTokenController {

    private final DeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;

    /** Driver app registers or refreshes its FCM token after login. */
    @PostMapping("/token")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Void> registerToken(@Valid @RequestBody DeviceTokenRequest request,
                                              Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        DeviceToken deviceToken = deviceTokenRepository.findByUserId(userId)
            .orElseGet(() -> DeviceToken.builder().user(user).build());
        deviceToken.setToken(request.token());
        deviceTokenRepository.save(deviceToken);

        return ResponseEntity.noContent().build();
    }
}
