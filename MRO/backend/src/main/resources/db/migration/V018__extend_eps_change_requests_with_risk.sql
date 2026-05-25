ALTER TABLE eps.change_requests
    ADD COLUMN IF NOT EXISTS risk_level VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS impact_summary TEXT,
    ADD COLUMN IF NOT EXISTS requires_escalation BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_eps_change_req_risk_level
    ON eps.change_requests(risk_level);
