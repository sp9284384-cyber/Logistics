CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(40) NOT NULL UNIQUE,
    pickup_address VARCHAR(500) NOT NULL,
    pickup_lat DOUBLE NOT NULL,
    pickup_lng DOUBLE NOT NULL,
    drop_address VARCHAR(500) NOT NULL,
    drop_lat DOUBLE NOT NULL,
    drop_lng DOUBLE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    item_description VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created_by_id BIGINT NOT NULL,
    assigned_driver_id BIGINT,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by_id) REFERENCES users (id),
    CONSTRAINT fk_orders_assigned_driver FOREIGN KEY (assigned_driver_id) REFERENCES users (id)
);

CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_assigned_driver ON orders (assigned_driver_id);
