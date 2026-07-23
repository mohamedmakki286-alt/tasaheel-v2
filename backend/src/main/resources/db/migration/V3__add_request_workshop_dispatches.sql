CREATE TABLE IF NOT EXISTS request_workshop_dispatches (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    workshop_id BIGINT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT',
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL,
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    decline_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT uk_request_workshop_dispatch UNIQUE (request_id, workshop_id)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_workshop_status
    ON request_workshop_dispatches(workshop_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatch_request
    ON request_workshop_dispatches(request_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_expires_at
    ON request_workshop_dispatches(expires_at);

INSERT INTO request_workshop_dispatches
    (request_id, workshop_id, status, is_preferred, sent_at, expires_at, created_at)
SELECT r.id, w.id, 'SENT', (r.preferred_workshop_id = w.id),
       COALESCE(r.created_at, NOW()), NOW() + INTERVAL '24 hours', NOW()
FROM maintenance_requests r
JOIN workshops w ON w.city = r.city
WHERE r.status IN ('pending', 'quoted')
  AND w.is_active = TRUE
  AND w.is_approved = TRUE
ON CONFLICT (request_id, workshop_id) DO NOTHING;
