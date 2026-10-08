package com.fleettracker.location;

import java.util.List;

import com.fleettracker.location.dto.DriverLocationResponse;
import com.fleettracker.location.dto.PostLocationRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @PostMapping
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Void> postLocation(@Valid @RequestBody PostLocationRequest request,
                                             Authentication auth) {
        locationService.saveLocation(Long.valueOf(auth.getName()), request);
        // Drivers post frequently; 202 keeps the client light and idempotent-friendly
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/drivers/latest")
    @PreAuthorize("hasRole('DISPATCHER')")
    public List<DriverLocationResponse> latestDriverPositions() {
        return locationService.getLatestPositions();
    }
}
