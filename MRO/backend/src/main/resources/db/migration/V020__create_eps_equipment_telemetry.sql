CREATE TABLE IF NOT EXISTS eps.equipment_telemetry (
    id              UUID PRIMARY KEY,
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id) ON DELETE CASCADE,
    metric_type     VARCHAR(32) NOT NULL,
    metric_value    NUMERIC(18, 4) NOT NULL,
    unit            VARCHAR(32),
    recorded_at     TIMESTAMPTZ NOT NULL,
    source          VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_telemetry_equipment
    ON eps.equipment_telemetry(equipment_id);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_telemetry_type
    ON eps.equipment_telemetry(metric_type);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_telemetry_recorded_at
    ON eps.equipment_telemetry(recorded_at DESC);
