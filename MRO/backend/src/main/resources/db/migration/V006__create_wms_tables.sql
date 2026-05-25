CREATE TABLE IF NOT EXISTS wms.warehouses (
    id UUID PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    custodian_id UUID REFERENCES core.users(id),
    location VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS wms.parts (
    id UUID PRIMARY KEY,
    part_number VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(32) NOT NULL DEFAULT 'PCS',
    min_stock_level NUMERIC(18, 3) DEFAULT 0,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS wms.stock_movements (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id UUID NOT NULL REFERENCES wms.parts(id),
    movement_type VARCHAR(32) NOT NULL,
    quantity NUMERIC(18, 3) NOT NULL,
    reference_type VARCHAR(64),
    reference_id UUID,
    initiated_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wms_stock_movements_warehouse_id ON wms.stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_stock_movements_part_id ON wms.stock_movements(part_id);

CREATE TABLE IF NOT EXISTS wms.reservations (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id UUID NOT NULL REFERENCES wms.parts(id),
    quantity NUMERIC(18, 3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RESERVED',
    reference_type VARCHAR(64),
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES core.users(id)
);

CREATE INDEX IF NOT EXISTS idx_wms_reservations_warehouse_id ON wms.reservations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_reservations_part_id ON wms.reservations(part_id);
CREATE INDEX IF NOT EXISTS idx_wms_reservations_status ON wms.reservations(status);

