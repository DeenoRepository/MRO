CREATE TABLE IF NOT EXISTS eps.equipment (
    id UUID PRIMARY KEY,
    asset_tag VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'active',
    location VARCHAR(255),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(128),
    install_date DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_status ON eps.equipment(status);
CREATE INDEX IF NOT EXISTS idx_eps_equipment_category ON eps.equipment(category);

