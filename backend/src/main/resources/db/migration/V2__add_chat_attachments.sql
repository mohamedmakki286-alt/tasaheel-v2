-- V2: Add chat attachments support and message type enum
-- Safe for both new and existing databases

-- Add client_message_id to chat_messages for deduplication
DO $$ BEGIN
    ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS client_message_id VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE chat_messages ADD CONSTRAINT uk_chat_messages_client_msg_id UNIQUE (client_message_id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create chat_attachments table
CREATE TABLE IF NOT EXISTS chat_attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL UNIQUE REFERENCES chat_messages(id) ON DELETE CASCADE,
    storage_key VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    duration_seconds INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_client_msg_id ON chat_messages(client_message_id);
