-- Flyway baseline: captures existing schema as of 2026-07-23
-- This migration is used only for baseline on existing databases (dev/prod).
-- For H2 (default profile), Flyway is disabled and Hibernate handles schema.

-- =============================================
-- call_sessions
-- =============================================
CREATE TABLE IF NOT EXISTS call_sessions (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT,
    caller_id BIGINT NOT NULL,
    caller_role VARCHAR(50) NOT NULL,
    callee_id BIGINT NOT NULL,
    callee_role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- customers
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    city VARCHAR(100),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    password VARCHAR(255),
    google_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- workshops
-- =============================================
CREATE TABLE IF NOT EXISTS workshops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255),
    city VARCHAR(100),
    district VARCHAR(100),
    latitude DOUBLE,
    longitude DOUBLE,
    description TEXT,
    avatar_url VARCHAR(500),
    cover_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    rating DOUBLE DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    specialization VARCHAR(255),
    google_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- technicians
-- =============================================
CREATE TABLE IF NOT EXISTS technicians (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    workshop_id BIGINT REFERENCES workshops(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    latitude DOUBLE DEFAULT 0,
    longitude DOUBLE DEFAULT 0,
    fcm_token VARCHAR(500),
    availability_status VARCHAR(20) DEFAULT 'available',
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- service_types
-- =============================================
CREATE TABLE IF NOT EXISTS service_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100),
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- customer_cars
-- =============================================
CREATE TABLE IF NOT EXISTS customer_cars (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    plate_number VARCHAR(50),
    color VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- maintenance_requests
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    car_id BIGINT REFERENCES customer_cars(id),
    description TEXT,
    location_lat DOUBLE,
    location_lng DOUBLE,
    location_address VARCHAR(500),
    city VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    has_transport_request BOOLEAN DEFAULT FALSE,
    allow_multi_workshop BOOLEAN DEFAULT FALSE,
    execution_method VARCHAR(50),
    preferred_workshop_id BIGINT,
    technician_id BIGINT REFERENCES technicians(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- request_service_types (join table)
-- =============================================
CREATE TABLE IF NOT EXISTS request_service_types (
    request_id BIGINT NOT NULL REFERENCES maintenance_requests(id),
    service_type_id BIGINT NOT NULL REFERENCES service_types(id),
    PRIMARY KEY (request_id, service_type_id)
);

-- =============================================
-- refresh_tokens
-- =============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- notifications
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- invoices
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES maintenance_requests(id),
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    total_amount DOUBLE NOT NULL,
    tax_amount DOUBLE DEFAULT 0,
    discount_amount DOUBLE DEFAULT 0,
    final_amount DOUBLE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- invoice_items
-- =============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DOUBLE NOT NULL,
    total DOUBLE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- chat_rooms
-- =============================================
CREATE TABLE IF NOT EXISTS chat_rooms (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT REFERENCES maintenance_requests(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- chat_messages
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES chat_rooms(id),
    sender_id BIGINT NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    content TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    file_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- reviews
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES maintenance_requests(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- inspection_reports
-- =============================================
CREATE TABLE IF NOT EXISTS inspection_reports (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES maintenance_requests(id),
    technician_id BIGINT NOT NULL REFERENCES technicians(id),
    workshop_id BIGINT REFERENCES workshops(id),
    summary TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- inspection_report_items
-- =============================================
CREATE TABLE IF NOT EXISTS inspection_report_items (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES inspection_reports(id),
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    severity VARCHAR(50),
    notes TEXT,
    estimated_cost DOUBLE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- sub_orders
-- =============================================
CREATE TABLE IF NOT EXISTS sub_orders (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES maintenance_requests(id),
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    status VARCHAR(50) DEFAULT 'pending',
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- workshop_service_listings
-- =============================================
CREATE TABLE IF NOT EXISTS workshop_service_listings (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    service_type_id BIGINT NOT NULL REFERENCES service_types(id),
    price DOUBLE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- workshop_offers
-- =============================================
CREATE TABLE IF NOT EXISTS workshop_offers (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    request_id BIGINT NOT NULL REFERENCES maintenance_requests(id),
    amount DOUBLE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    valid_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- payments
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    amount DOUBLE NOT NULL,
    method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- drivers (for future home service)
-- =============================================
CREATE TABLE IF NOT EXISTS drivers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    latitude DOUBLE DEFAULT 0,
    longitude DOUBLE DEFAULT 0,
    fcm_token VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- =============================================
-- driver_locations
-- =============================================
CREATE TABLE IF NOT EXISTS driver_locations (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES drivers(id),
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes for call_sessions
-- =============================================
CREATE INDEX IF NOT EXISTS idx_call_sessions_request_id ON call_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller_id ON call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee_id ON call_sessions(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created_at ON call_sessions(created_at);
