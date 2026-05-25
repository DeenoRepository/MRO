CREATE TABLE IF NOT EXISTS srs.tickets (
    id UUID PRIMARY KEY,
    ticket_number VARCHAR(64) UNIQUE NOT NULL,
    requester_id UUID REFERENCES core.users(id),
    assignee_id UUID REFERENCES core.users(id),
    equipment_id UUID REFERENCES eps.equipment(id),
    work_order_id UUID REFERENCES mms.work_orders(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_srs_tickets_equipment_id ON srs.tickets(equipment_id);
CREATE INDEX IF NOT EXISTS idx_srs_tickets_work_order_id ON srs.tickets(work_order_id);
CREATE INDEX IF NOT EXISTS idx_srs_tickets_status ON srs.tickets(status);

CREATE TABLE IF NOT EXISTS srs.ticket_comments (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES srs.tickets(id),
    author_id UUID REFERENCES core.users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_srs_ticket_comments_ticket_id ON srs.ticket_comments(ticket_id);

CREATE TABLE IF NOT EXISTS srs.request_types (
    id UUID PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    default_priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS srs.external_api_log (
    id UUID PRIMARY KEY,
    system_name VARCHAR(128) NOT NULL,
    direction VARCHAR(32) NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status_code INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

