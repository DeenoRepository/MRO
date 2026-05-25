CREATE TABLE IF NOT EXISTS eps.equipment_documents (
    id              UUID PRIMARY KEY,
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id) ON DELETE CASCADE,
    document_type   VARCHAR(64) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_path       TEXT NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    checksum_sha256 VARCHAR(64) NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by     UUID REFERENCES core.users(id)
);

CREATE INDEX IF NOT EXISTS idx_eps_eq_docs_equipment ON eps.equipment_documents(equipment_id);

CREATE TABLE IF NOT EXISTS eps.change_requests (
    id              UUID PRIMARY KEY,
    entity_type     VARCHAR(64) NOT NULL,
    entity_id       UUID,
    change_type     VARCHAR(32) NOT NULL,
    proposed_data   JSONB NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    requested_by    UUID REFERENCES core.users(id),
    approved_by     UUID REFERENCES core.users(id),
    approval_notes  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_eps_change_req_status ON eps.change_requests(status);
