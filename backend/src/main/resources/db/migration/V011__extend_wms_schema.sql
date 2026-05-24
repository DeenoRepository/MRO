-- Alter warehouses to include description and audit fields
ALTER TABLE wms.warehouses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE wms.warehouses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id);
ALTER TABLE wms.warehouses ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);
ALTER TABLE wms.warehouses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE wms.warehouses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Alter parts to include manufacturer, model, is_active, and audit fields
ALTER TABLE wms.parts ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
ALTER TABLE wms.parts ADD COLUMN IF NOT EXISTS model VARCHAR(255);
ALTER TABLE wms.parts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE wms.parts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id);
ALTER TABLE wms.parts ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);
ALTER TABLE wms.parts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE wms.parts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Alter stock_movements to include reason
ALTER TABLE wms.stock_movements ADD COLUMN IF NOT EXISTS reason TEXT;

-- Alter reservations to include expires_at and audit fields
ALTER TABLE wms.reservations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE wms.reservations ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);
ALTER TABLE wms.reservations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create Stock Levels table
CREATE TABLE IF NOT EXISTS wms.stock_levels (
    id              UUID PRIMARY KEY,
    warehouse_id    UUID NOT NULL REFERENCES wms.warehouses(id) ON DELETE CASCADE,
    part_id         UUID NOT NULL REFERENCES wms.parts(id) ON DELETE CASCADE,
    quantity_on_hand NUMERIC(18, 3) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(18, 3) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_wms_stock_levels_warehouse_part UNIQUE (warehouse_id, part_id),
    CONSTRAINT chk_wms_stock_non_negative CHECK (quantity_on_hand >= 0 AND quantity_reserved >= 0)
);

CREATE INDEX IF NOT EXISTS idx_wms_stock_levels_warehouse ON wms.stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_stock_levels_part ON wms.stock_levels(part_id);

-- Create Warehouse Transfers table
CREATE TABLE IF NOT EXISTS wms.warehouse_transfers (
    id                  UUID PRIMARY KEY,
    source_warehouse_id UUID NOT NULL REFERENCES wms.warehouses(id) ON DELETE RESTRICT,
    target_warehouse_id UUID NOT NULL REFERENCES wms.warehouses(id) ON DELETE RESTRICT,
    part_id             UUID NOT NULL REFERENCES wms.parts(id) ON DELETE RESTRICT,
    quantity            NUMERIC(18, 3) NOT NULL,
    status              VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    requested_by        UUID REFERENCES core.users(id),
    approved_by         UUID REFERENCES core.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_wms_transfer_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_wms_transfer_different_warehouses CHECK (source_warehouse_id <> target_warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_wms_transfers_source ON wms.warehouse_transfers(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_transfers_target ON wms.warehouse_transfers(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_transfers_part ON wms.warehouse_transfers(part_id);
CREATE INDEX IF NOT EXISTS idx_wms_transfers_status ON wms.warehouse_transfers(status);
