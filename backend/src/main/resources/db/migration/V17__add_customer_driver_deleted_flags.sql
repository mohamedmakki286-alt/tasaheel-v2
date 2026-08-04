ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_customers_deleted_id ON customers (is_deleted, id DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_deleted_id ON drivers (is_deleted, id DESC);
