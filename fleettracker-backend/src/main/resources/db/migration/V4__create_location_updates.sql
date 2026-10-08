CREATE TABLE location_updates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    speed DOUBLE,
    accuracy DOUBLE,
    recorded_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_location_updates_driver FOREIGN KEY (driver_id) REFERENCES users (id)
);

CREATE INDEX idx_location_driver_time ON location_updates (driver_id, recorded_at);
