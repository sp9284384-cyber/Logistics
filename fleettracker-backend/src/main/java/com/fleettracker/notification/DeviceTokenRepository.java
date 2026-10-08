package com.fleettracker.notification;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    Optional<DeviceToken> findByUserId(Long userId);

    List<DeviceToken> findAllByUserId(Long userId);
}
