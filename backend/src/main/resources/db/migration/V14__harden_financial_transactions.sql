CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    type VARCHAR(20) NOT NULL,
    parent_id BIGINT REFERENCES accounts(id),
    level INTEGER NOT NULL DEFAULT 0,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    balance DOUBLE PRECISION NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_number VARCHAR(30) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    description TEXT,
    reference_type VARCHAR(30),
    reference_id BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id BIGSERIAL PRIMARY KEY,
    entry_id BIGINT NOT NULL REFERENCES journal_entries(id),
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    debit DOUBLE PRECISION NOT NULL DEFAULT 0,
    credit DOUBLE PRECISION NOT NULL DEFAULT 0,
    description TEXT
);

CREATE TABLE IF NOT EXISTS workshop_settlements (
    id BIGSERIAL PRIMARY KEY,
    workshop_id BIGINT NOT NULL REFERENCES workshops(id),
    settlement_number VARCHAR(30) NOT NULL UNIQUE,
    total_gross_amount DOUBLE PRECISION NOT NULL,
    total_commission DOUBLE PRECISION NOT NULL,
    total_net_amount DOUBLE PRECISION NOT NULL,
    invoice_count INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    settled_at TIMESTAMP,
    journal_entry_id BIGINT REFERENCES journal_entries(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_holds (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL UNIQUE REFERENCES maintenance_requests(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    workshop_id BIGINT REFERENCES workshops(id),
    amount DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'HELD',
    held_at TIMESTAMP DEFAULT NOW(),
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,
    updated_at TIMESTAMP
);

INSERT INTO accounts (
    code, name, name_en, type, level, is_system, balance, is_active, created_at, updated_at
)
VALUES
    ('1.1.2', 'الحساب البنكي', 'Bank account', 'ASSET', 2, TRUE, 0, TRUE, NOW(), NOW()),
    ('1.2.1', 'محفظة التحصيل', 'Payment holding wallet', 'ASSET', 2, TRUE, 0, TRUE, NOW(), NOW()),
    ('1.3.1', 'ذمم العملاء', 'Customer receivables', 'ASSET', 2, TRUE, 0, TRUE, NOW(), NOW()),
    ('2.1.1', 'مستحقات الورش', 'Workshop payables', 'LIABILITY', 2, TRUE, 0, TRUE, NOW(), NOW()),
    ('3.1.1', 'إيراد عمولة المنصة', 'Platform commission revenue', 'REVENUE', 2, TRUE, 0, TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(30),
    ADD COLUMN IF NOT EXISTS parts_total DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS labor_total DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS tax DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS tax_percent DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS grand_total DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS commission_percentage DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS commission_amount DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS net_amount DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS settlement_id BIGINT REFERENCES workshop_settlements(id),
    ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP;

UPDATE invoices
SET invoice_number = COALESCE(invoice_number, 'LEGACY-INV-' || id),
    parts_total = COALESCE(parts_total, total_amount, 0),
    labor_total = COALESCE(labor_total, 0),
    tax = COALESCE(tax, 0),
    tax_percent = COALESCE(tax_percent, 15),
    grand_total = COALESCE(grand_total, total_amount, 0)
WHERE invoice_number IS NULL OR grand_total IS NULL;

ALTER TABLE invoices ALTER COLUMN invoice_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_invoices_invoice_number ON invoices (invoice_number);

ALTER TABLE invoice_items
    ADD COLUMN IF NOT EXISTS name VARCHAR(255);
UPDATE invoice_items SET name = COALESCE(name, 'Item') WHERE name IS NULL;
ALTER TABLE invoice_items ALTER COLUMN name SET NOT NULL;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS request_id BIGINT REFERENCES maintenance_requests(id),
    ADD COLUMN IF NOT EXISTS fee DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS total DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10),
    ADD COLUMN IF NOT EXISTS moyasar_payment_id VARCHAR(120),
    ADD COLUMN IF NOT EXISTS moyasar_invoice_id TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
UPDATE payments
SET fee = COALESCE(fee, 0),
    total = COALESCE(total, amount),
    currency = COALESCE(currency, 'SAR'),
    updated_at = COALESCE(updated_at, created_at);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS provider_event_id VARCHAR(120),
    ADD COLUMN IF NOT EXISTS provider_invoice_id VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_idempotency_key
    ON payments (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

WITH ranked_active AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY request_id
               ORDER BY CASE WHEN status = 'completed' THEN 0 ELSE 1 END, created_at DESC, id DESC
           ) AS row_number
    FROM payments
    WHERE status IN ('initiated', 'completed')
)
UPDATE payments
SET status = 'abandoned'
WHERE id IN (SELECT id FROM ranked_active WHERE row_number > 1)
  AND status = 'initiated';

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_one_active_per_request
    ON payments (request_id)
    WHERE status IN ('initiated', 'completed');

CREATE INDEX IF NOT EXISTS ix_payments_provider_id
    ON payments (moyasar_payment_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_provider_invoice_id
    ON payments (provider_invoice_id)
    WHERE provider_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_invoices_payment_id
    ON invoices (payment_id);

CREATE INDEX IF NOT EXISTS ix_journal_reference
    ON journal_entries (reference_type, reference_id, status);
