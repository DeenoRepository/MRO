CREATE TABLE IF NOT EXISTS mms.work_orders (
    id UUID PRIMARY KEY,
    wo_number VARCHAR(64) UNIQUE NOT NULL,
    equipment_id UUID NOT NULL REFERENCES eps.equipment(id),
    type VARCHAR(32) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    scheduled_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    technician_id UUID REFERENCES core.users(id),
    description TEXT,
    completion_act JSONB,
    signature_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mms_work_orders_equipment_id ON mms.work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_mms_work_orders_status ON mms.work_orders(status);

CREATE TABLE IF NOT EXISTS mms.pm_schedules (
    id UUID PRIMARY KEY,
    equipment_id UUID NOT NULL REFERENCES eps.equipment(id),
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(64) NOT NULL,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mms_pm_schedules_equipment_id ON mms.pm_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_mms_pm_schedules_next_due_date ON mms.pm_schedules(next_due_date);

