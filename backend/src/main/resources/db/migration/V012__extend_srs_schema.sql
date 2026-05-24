-- Alter tickets table to support request type mapping, SLA, and audit fields
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS request_type_id UUID REFERENCES srs.request_types(id);
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS linked_work_order_id UUID;
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id);
ALTER TABLE srs.tickets ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);

-- Alter request_types table to include description, SLA configuration
ALTER TABLE srs.request_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE srs.request_types ADD COLUMN IF NOT EXISTS sla_hours INTEGER;
ALTER TABLE srs.request_types ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Update ticket_comments table to support audit fields and internal comments flag
ALTER TABLE srs.ticket_comments ADD COLUMN IF NOT EXISTS comment_text TEXT;
UPDATE srs.ticket_comments SET comment_text = body WHERE comment_text IS NULL AND body IS NOT NULL;
ALTER TABLE srs.ticket_comments ALTER COLUMN comment_text SET NOT NULL;
ALTER TABLE srs.ticket_comments DROP COLUMN IF EXISTS body;

ALTER TABLE srs.ticket_comments ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE srs.ticket_comments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id);
UPDATE srs.ticket_comments SET created_by = author_id WHERE created_by IS NULL AND author_id IS NOT NULL;
ALTER TABLE srs.ticket_comments DROP COLUMN IF EXISTS author_id;

-- Create Ticket Attachments table
CREATE TABLE IF NOT EXISTS srs.ticket_attachments (
    id              UUID PRIMARY KEY,
    ticket_id       UUID NOT NULL REFERENCES srs.tickets(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    file_path       TEXT NOT NULL,
    mime_type       VARCHAR(128),
    file_size       BIGINT,
    checksum_sha256 VARCHAR(64) NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by     UUID REFERENCES core.users(id)
);

CREATE INDEX IF NOT EXISTS idx_srs_ticket_attachments_ticket ON srs.ticket_attachments(ticket_id);
