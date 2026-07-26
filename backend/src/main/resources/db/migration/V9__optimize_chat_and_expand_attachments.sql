CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
    ON chat_messages (room_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_unread_sender
    ON chat_messages (room_id, is_read, sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_created
    ON chat_rooms (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_workshop_created
    ON chat_rooms (workshop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_technician_created
    ON chat_rooms (technician_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_driver_created
    ON chat_rooms (driver_id, created_at DESC);

ALTER TABLE chat_messages ALTER COLUMN media_url TYPE TEXT;
ALTER TABLE chat_attachments ALTER COLUMN storage_key TYPE TEXT;
ALTER TABLE chat_attachments ALTER COLUMN file_url TYPE TEXT;
ALTER TABLE chat_attachments ALTER COLUMN original_file_name TYPE TEXT;
ALTER TABLE chat_attachments ALTER COLUMN mime_type TYPE TEXT;
