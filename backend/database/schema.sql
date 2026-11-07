-- Reference copy of the current schema. Alembic is the source of truth;
-- never edit the database by hand — add a migration instead.

CREATE TYPE load_type AS ENUM ('FTL', 'Part Load');
CREATE TYPE booking_status AS ENUM
    ('New', 'Quoted', 'Vehicle Assigned', 'In Transit', 'Delivered', 'Cancelled');

CREATE TABLE bookings (
    id               SERIAL PRIMARY KEY,
    ref_code         VARCHAR(12) NOT NULL UNIQUE,
    company_name     VARCHAR(150) NOT NULL,
    contact_person   VARCHAR(100) NOT NULL,
    phone            VARCHAR(15) NOT NULL,
    email            VARCHAR(150),
    pickup_city      VARCHAR(100) NOT NULL,
    pickup_address   TEXT,
    delivery_city    VARCHAR(100) NOT NULL,
    delivery_address TEXT,
    load_type        load_type NOT NULL,
    vehicle_type     VARCHAR(50),
    weight_tons      NUMERIC(8,2),
    material         VARCHAR(150),
    pickup_date      TIMESTAMP,
    notes            TEXT,
    status           booking_status NOT NULL DEFAULT 'New',
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ix_bookings_ref_code  ON bookings (ref_code);
CREATE INDEX ix_bookings_phone     ON bookings (phone);
CREATE INDEX ix_bookings_status    ON bookings (status);
CREATE INDEX ix_bookings_load_type ON bookings (load_type);

CREATE TABLE status_history (
    id          SERIAL PRIMARY KEY,
    booking_id  INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_status  VARCHAR(30),
    new_status  VARCHAR(30) NOT NULL,
    note        VARCHAR(255),
    changed_by  VARCHAR(100) NOT NULL DEFAULT 'system',
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ix_status_history_booking_id ON status_history (booking_id);

CREATE TABLE admin_users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(50) NOT NULL UNIQUE,
    email            VARCHAR(150) NOT NULL UNIQUE,
    hashed_password  VARCHAR(255) NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT now()
);
