package com.fleettracker.location;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import com.fleettracker.common.exception.NotFoundException;
import com.fleettracker.common.exception.RateLimitExceededException;
import com.fleettracker.location.dto.DriverLocationResponse;
import com.fleettracker.location.dto.PostLocationRequest;
import com.fleettracker.user.User;
import com.fleettracker.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    // Rate-limit high-frequency pings: at most one location update per 500ms per driver
    private final ConcurrentMap<Long, Instant> lastUpdatePerDriver = new ConcurrentHashMap<>();

    @Value("${fleet.location.retention-days:7}")
    private long retentionDays;

    @Transactional
    public void saveLocation(Long driverId, PostLocationRequest request) {
        checkRateLimit(driverId);
        validateCoordinates(request.latitude(), request.longitude());
        User driver = userRepository.findById(driverId)
            .orElseThrow(() -> new NotFoundException("Driver not found: " + driverId));

        LocationUpdate update = LocationUpdate.builder()
            .driver(driver)
            .latitude(request.latitude())
            .longitude(request.longitude())
            .speed(request.speed())
            .accuracy(request.accuracy())
            .recordedAt(Instant.now())
            .build();
        locationRepository.save(update);
    }

    @Transactional(readOnly = true)
    public List<DriverLocationResponse> getLatestPositions() {
        return locationRepository.findLatestPerDriver().stream()
            .map(u -> new DriverLocationResponse(
                u.getDriver().getId(),
                u.getDriver().getName(),
                u.getLatitude(),
                u.getLongitude(),
                u.getSpeed(),
                u.getRecordedAt()))
            .toList();
    }

    /**
     * Retention plan: one row every few seconds per driver grows fast,
     * so purge anything older than the retention window nightly.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeOldUpdates() {
        locationRepository.deleteByRecordedAtBefore(
            Instant.now().minus(retentionDays, ChronoUnit.DAYS));
    }

    private void validateCoordinates(double lat, double lng) {
        if (lat < -90 || lat > 90) {
            throw new IllegalArgumentException("Latitude out of range: " + lat);
        }
        if (lng < -180 || lng > 180) {
            throw new IllegalArgumentException("Longitude out of range: " + lng);
        }
    }

    private void checkRateLimit(Long driverId) {
        Instant now = Instant.now();
        Instant last = lastUpdatePerDriver.put(driverId, now);
        if (last != null && ChronoUnit.MILLIS.between(last, now) < 500) {
            throw new RateLimitExceededException(
                "Rate limit exceeded: location updates must be at least 500ms apart per driver");
        }
    }
}
