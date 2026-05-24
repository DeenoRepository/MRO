-- Extend work_orders table
ALTER TABLE mms.work_orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE mms.work_orders ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE mms.work_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id);
ALTER TABLE mms.work_orders ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);

UPDATE mms.work_orders SET title = 'Corrective maintenance work' WHERE title IS NULL;
ALTER TABLE mms.work_orders ALTER COLUMN title SET NOT NULL;

-- Extend pm_schedules table
ALTER TABLE mms.pm_schedules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE mms.pm_schedules ADD COLUMN IF NOT EXISTS frequency_type VARCHAR(32);
ALTER TABLE mms.pm_schedules ADD COLUMN IF NOT EXISTS frequency_value INTEGER;
ALTER TABLE mms.pm_schedules ADD COLUMN IF NOT EXISTS last_generated_date DATE;
ALTER TABLE mms.pm_schedules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id);
ALTER TABLE mms.pm_schedules ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);

UPDATE mms.pm_schedules SET frequency_type = 'DAYS', frequency_value = 30 WHERE frequency_type IS NULL;
ALTER TABLE mms.pm_schedules ALTER COLUMN frequency_type SET NOT NULL;
ALTER TABLE mms.pm_schedules ALTER COLUMN frequency_value SET NOT NULL;

-- Add indexes to work_orders
CREATE INDEX IF NOT EXISTS idx_mms_work_orders_priority ON mms.work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_mms_work_orders_technician ON mms.work_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_mms_work_orders_scheduled_date ON mms.work_orders(scheduled_date);

-- Add indexes to pm_schedules
CREATE INDEX IF NOT EXISTS idx_mms_pm_schedules_active ON mms.pm_schedules(is_active);

-- Create work_order_tasks table
CREATE TABLE IF NOT EXISTS mms.work_order_tasks (
    id              UUID PRIMARY KEY,
    work_order_id   UUID NOT NULL REFERENCES mms.work_orders(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES core.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mms_work_order_tasks_work_order ON mms.work_order_tasks(work_order_id);

-- Create work_order_parts table
CREATE TABLE IF NOT EXISTS mms.work_order_parts (
    id              UUID PRIMARY KEY,
    work_order_id   UUID NOT NULL REFERENCES mms.work_orders(id) ON DELETE CASCADE,
    part_id         UUID NOT NULL,
    reservation_id  UUID,
    requested_qty   NUMERIC(18, 3) NOT NULL,
    consumed_qty    NUMERIC(18, 3) DEFAULT 0,
    status          VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id)
);

CREATE INDEX IF NOT EXISTS idx_mms_work_order_parts_work_order ON mms.work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_mms_work_order_parts_part ON mms.work_order_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_mms_work_order_parts_reservation ON mms.work_order_parts(reservation_id);

-- Create maintenance_history table
CREATE TABLE IF NOT EXISTS mms.maintenance_history (
    id              UUID PRIMARY KEY,
    work_order_id   UUID NOT NULL REFERENCES mms.work_orders(id) ON DELETE CASCADE,
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id),
    event_type      VARCHAR(64) NOT NULL,
    event_data      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id)
);

CREATE INDEX IF NOT EXISTS idx_mms_maintenance_history_work_order ON mms.maintenance_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_mms_maintenance_history_equipment ON mms.maintenance_history(equipment_id);
