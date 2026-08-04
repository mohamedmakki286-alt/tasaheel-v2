ALTER TABLE workshops ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_workshops_not_deleted ON workshops(is_deleted, id DESC);
