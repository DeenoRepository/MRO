ALTER TABLE eps.equipment
    ADD COLUMN IF NOT EXISTS parent_equipment_id UUID REFERENCES eps.equipment(id);

CREATE INDEX IF NOT EXISTS idx_eps_equipment_parent
    ON eps.equipment(parent_equipment_id);
