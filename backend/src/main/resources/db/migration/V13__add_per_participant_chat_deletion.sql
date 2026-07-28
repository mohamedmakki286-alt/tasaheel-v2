ALTER TABLE chat_rooms
    ADD COLUMN IF NOT EXISTS customer_deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS workshop_deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_visible
    ON chat_rooms (customer_id, created_at DESC)
    WHERE customer_deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_rooms_workshop_visible
    ON chat_rooms (workshop_id, created_at DESC)
    WHERE workshop_deleted_at IS NULL;
