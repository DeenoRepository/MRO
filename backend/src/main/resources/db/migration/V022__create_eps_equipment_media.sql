CREATE TABLE IF NOT EXISTS eps.equipment_media (
    id              UUID PRIMARY KEY,
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id) ON DELETE CASCADE,
    media_type      VARCHAR(32) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_path       TEXT NOT NULL,
    mime_type       VARCHAR(128),
    file_size       BIGINT,
    checksum_sha256 VARCHAR(64) NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by     UUID REFERENCES core.users(id),
    annotation      TEXT
);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_media_equipment
    ON eps.equipment_media(equipment_id);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_media_uploaded_at
    ON eps.equipment_media(uploaded_at DESC);
