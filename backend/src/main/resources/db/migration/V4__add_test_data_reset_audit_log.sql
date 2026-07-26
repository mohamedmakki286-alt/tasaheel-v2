CREATE TABLE IF NOT EXISTS test_data_reset_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL,
    admin_user_name VARCHAR(255),
    customer_ids TEXT,
    workshop_ids TEXT,
    technician_ids TEXT,
    total_records_deleted BIGINT,
    tables_affected TEXT,
    files_deleted TEXT,
    result VARCHAR(20) NOT NULL,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_data_reset_audit_created_at
    ON test_data_reset_audit_log (created_at DESC);
