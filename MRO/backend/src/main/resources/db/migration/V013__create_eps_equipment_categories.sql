CREATE TABLE IF NOT EXISTS eps.equipment_categories (
    id          UUID PRIMARY KEY,
    code        VARCHAR(64) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    parent_id   UUID REFERENCES eps.equipment_categories(id),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_categories_parent
    ON eps.equipment_categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_categories_active
    ON eps.equipment_categories(is_active);
