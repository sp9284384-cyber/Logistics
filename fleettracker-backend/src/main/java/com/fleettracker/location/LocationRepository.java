package com.fleettracker.location;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LocationRepository extends JpaRepository<LocationUpdate, Long> {

    @Query("""
        SELECT l FROM LocationUpdate l
        WHERE l.recordedAt = (
            SELECT MAX(l2.recordedAt) FROM LocationUpdate l2 WHERE l2.driver = l.driver)
        """)
    List<LocationUpdate> findLatestPerDriver();

    long deleteByRecordedAtBefore(Instant cutoff);
}
