ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(120),
    ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

ALTER TABLE workshop_settlements
    ADD COLUMN IF NOT EXISTS transfer_reference VARCHAR(120),
    ADD COLUMN IF NOT EXISTS transfer_method VARCHAR(40),
    ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_payments_refund_pending
    ON payments(status, refund_requested_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_transfer_reference
    ON workshop_settlements(transfer_reference)
    WHERE transfer_reference IS NOT NULL;
