-- V1: Redesign call_sessions for unified call system
-- Adds: conversation_id, caller/callee name snapshots, granular lifecycle timestamps,
--        ended_by_user_id, end_reason, updated_at
-- Adds indexes for permission-check queries.

-- New columns for name snapshots (nullable for existing records)
ALTER TABLE call_sessions ADD COLUMN caller_name_snapshot VARCHAR(255);
ALTER TABLE call_sessions ADD COLUMN callee_name_snapshot VARCHAR(255);

-- Conversation ID for grouping calls within a request context
ALTER TABLE call_sessions ADD COLUMN conversation_id VARCHAR(255);

-- Granular lifecycle timestamps
ALTER TABLE call_sessions ADD COLUMN initiated_at TIMESTAMP;
ALTER TABLE call_sessions ADD COLUMN ringing_at TIMESTAMP;
ALTER TABLE call_sessions ADD COLUMN connected_at TIMESTAMP;

-- Who ended the call and why
ALTER TABLE call_sessions ADD COLUMN ended_by_user_id BIGINT;
ALTER TABLE call_sessions ADD COLUMN end_reason VARCHAR(50) DEFAULT '';

-- Updated at timestamp
ALTER TABLE call_sessions ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Backfill initiated_at from created_at for existing records
UPDATE call_sessions SET initiated_at = created_at WHERE initiated_at IS NULL;

-- Backfill ringing_at from created_at for existing records
UPDATE call_sessions SET ringing_at = created_at WHERE ringing_at IS NULL;

-- Backfill connected_at from started_at for existing records
UPDATE call_sessions SET connected_at = started_at WHERE connected_at IS NULL AND started_at IS NOT NULL;

-- Backfill updated_at from ended_at or created_at
UPDATE call_sessions SET updated_at = COALESCE(ended_at, created_at) WHERE updated_at IS NULL;

-- Indexes for efficient permission-check queries
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller_id_status ON call_sessions(caller_id, status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee_id_status ON call_sessions(callee_id, status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_ended_at ON call_sessions(ended_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_initiated_at ON call_sessions(initiated_at);
