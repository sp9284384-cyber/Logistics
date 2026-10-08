CREATE TABLE deliveries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    driver_id BIGINT NOT NULL,
    assigned_at DATETIME(6),
    picked_up_at DATETIME(6),
    delivered_at DATETIME(6),
    CONSTRAINT fk_deliveries_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_deliveries_driver FOREIGN KEY (driver_id) REFERENCES users (id)
);
