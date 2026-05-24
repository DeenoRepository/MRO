CREATE TABLE IF NOT EXISTS eps.external_integration_log (
    id               UUID PRIMARY KEY,
    integration_name VARCHAR(128) NOT NULL,
    direction        VARCHAR(32) NOT NULL,
    operation        VARCHAR(64) NOT NULL,
    equipment_id     UUID REFERENCES eps.equipment(id),
    request_payload  JSONB,
    response_payload JSONB,
    status_code      INTEGER,
    status           VARCHAR(32) NOT NULL,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eps_external_log_name
    ON eps.external_integration_log(integration_name);

CREATE INDEX IF NOT EXISTS idx_eps_external_log_created_at
    ON eps.external_integration_log(created_at DESC);
