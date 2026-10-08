package com.fleettracker.location;

import java.util.List;
import java.util.Optional;

import com.fleettracker.location.dto.DriverLocationResponse;
import com.fleettracker.location.dto.PostLocationRequest;
import com.fleettracker.user.Role;
import com.fleettracker.user.User;
import com.fleettracker.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LocationService locationService;

    @Test
    void rejectsOutOfRangeLatitude() {
        PostLocationRequest request = new PostLocationRequest(91.0, 72.0, null, null);

        assertThrows(IllegalArgumentException.class,
            () -> locationService.saveLocation(1L, request));

        verify(locationRepository, never()).save(any());
    }

    @Test
    void rejectsOutOfRangeLongitude() {
        PostLocationRequest request = new PostLocationRequest(19.0, -181.0, null, null);

        assertThrows(IllegalArgumentException.class,
            () -> locationService.saveLocation(1L, request));
    }

    @Test
    void savesValidLocation() {
        User driver = User.builder().id(1L).role(Role.DRIVER).active(true).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(driver));

        PostLocationRequest request = new PostLocationRequest(19.0760, 72.8777, 45.5, 8.0);
        locationService.saveLocation(1L, request);

        verify(locationRepository).save(any(LocationUpdate.class));
    }

    @Test
    void returnsLatestPositionPerDriver() {
        User driver = User.builder().id(1L).name("Ram").role(Role.DRIVER).build();
        LocationUpdate update = LocationUpdate.builder()
            .driver(driver).latitude(19.0760).longitude(72.8777).build();
        when(locationRepository.findLatestPerDriver()).thenReturn(List.of(update));

        List<DriverLocationResponse> result = locationService.getLatestPositions();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).driverId());
        assertEquals(19.0760, result.get(0).latitude());
    }

    @Test
    void rejectsRapidConsecutiveUpdatesForSameDriver() {
        User driver = User.builder().id(99L).role(Role.DRIVER).active(true).build();
        when(userRepository.findById(99L)).thenReturn(Optional.of(driver));

        PostLocationRequest request = new PostLocationRequest(19.0760, 72.8777, 45.0, 5.0);
        locationService.saveLocation(99L, request);

        // Immediate subsequent call should be rejected by rate limiter
        assertThrows(com.fleettracker.common.exception.RateLimitExceededException.class,
            () -> locationService.saveLocation(99L, request));
    }
}
