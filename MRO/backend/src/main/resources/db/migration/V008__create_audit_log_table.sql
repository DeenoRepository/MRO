CREATE TABLE IF NOT EXISTS audit.log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID,
    action VARCHAR(128) NOT NULL,
    module VARCHAR(32) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    previous_hash VARCHAR(64),
    signature VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit.log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_module_action ON audit.log(module, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_request_id ON audit.log(request_id);

