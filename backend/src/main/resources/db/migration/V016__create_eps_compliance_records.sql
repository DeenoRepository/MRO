CREATE TABLE IF NOT EXISTS eps.compliance_records (
    id               UUID PRIMARY KEY,
    equipment_id     UUID NOT NULL REFERENCES eps.equipment(id),
    record_type      VARCHAR(64) NOT NULL,
    title            VARCHAR(255) NOT NULL,
    valid_from       DATE,
    valid_until      DATE NOT NULL,
    status           VARCHAR(32) NOT NULL,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eps_compliance_equipment
    ON eps.compliance_records(equipment_id);

CREATE INDEX IF NOT EXISTS idx_eps_compliance_valid_until
    ON eps.compliance_records(valid_until);

CREATE INDEX IF NOT EXISTS idx_eps_compliance_status
    ON eps.compliance_records(status);
