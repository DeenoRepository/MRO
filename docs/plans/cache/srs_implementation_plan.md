# SRS Implementation Plan

## Module

SRS — Service Request System

---

# 1. Module Goal

SRS is responsible for service requests, incident reporting, ticket lifecycle management, routing, and operational coordination workflows.

SRS responsibilities:

- ticket management;
- service request intake;
- incident tracking;
- request categorization;
- assignment and routing;
- SLA tracking foundation;
- ticket comments and attachments;
- linking tickets to EPS equipment;
- creating MMS work orders;
- external API integration foundation;
- notification hooks;
- audit integration.

SRS is the source of truth for:

```text
tickets
ticket comments
request types
ticket lifecycle
assignment state
external API request logs
```

SRS may reference EPS equipment and MMS work orders but must not own their data.

---

# 2. Architecture Rules

## Allowed Dependencies

```text
SRS -> EPS
SRS -> MMS
SRS -> Core
SRS -> Audit
SRS -> Shared
```

## Forbidden Dependencies

```text
SRS -> WMS
SRS -> direct EPS repositories
SRS -> direct MMS repositories
```

SRS communicates with MMS through service interfaces or approved module contracts.

SRS must not directly manipulate MMS work order tables.

---

# 3. Database Schema

```sql
CREATE SCHEMA srs;
```

---

# 4. Core Tables

## 4.1 tickets

### Purpose

Main service request and incident tracking table.

```sql
CREATE TABLE srs.tickets (
    id                  UUID PRIMARY KEY,

    ticket_number       VARCHAR(64) UNIQUE NOT NULL,

    request_type_id     UUID REFERENCES srs.request_types(id),

    equipment_id        UUID REFERENCES eps.equipment(id),

    linked_work_order_id UUID,

    title               VARCHAR(255) NOT NULL,
    description         TEXT,

    priority            VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status              VARCHAR(32) NOT NULL DEFAULT 'OPEN',

    requester_id        UUID REFERENCES core.users(id),
    assignee_id         UUID REFERENCES core.users(id),

    opened_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_at         TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,

    due_at              TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES core.users(id),

    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_srs_tickets_status
ON srs.tickets(status);

CREATE INDEX idx_srs_tickets_priority
ON srs.tickets(priority);

CREATE INDEX idx_srs_tickets_requester
ON srs.tickets(requester_id);

CREATE INDEX idx_srs_tickets_assignee
ON srs.tickets(assignee_id);

CREATE INDEX idx_srs_tickets_equipment
ON srs.tickets(equipment_id);

CREATE INDEX idx_srs_tickets_opened_at
ON srs.tickets(opened_at);
```

---

## 4.2 request_types

### Purpose

Service request categorization.

```sql
CREATE TABLE srs.request_types (
    id                  UUID PRIMARY KEY,

    code                VARCHAR(64) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,

    default_priority    VARCHAR(32),
    sla_hours           INTEGER,

    is_active           BOOLEAN NOT NULL DEFAULT true,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Required Indexes

```sql
CREATE INDEX idx_srs_request_types_active
ON srs.request_types(is_active);
```

---

## 4.3 ticket_comments

### Purpose

Conversation and operational notes for tickets.

```sql
CREATE TABLE srs.ticket_comments (
    id                  UUID PRIMARY KEY,

    ticket_id           UUID NOT NULL REFERENCES srs.tickets(id),

    comment_text        TEXT NOT NULL,

    is_internal         BOOLEAN NOT NULL DEFAULT false,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_srs_ticket_comments_ticket
ON srs.ticket_comments(ticket_id);

CREATE INDEX idx_srs_ticket_comments_created_at
ON srs.ticket_comments(created_at);
```

---

## 4.4 ticket_attachments

### Purpose

Metadata for ticket attachments.

Files stored outside DB.

```sql
CREATE TABLE srs.ticket_attachments (
    id                  UUID PRIMARY KEY,

    ticket_id           UUID NOT NULL REFERENCES srs.tickets(id),

    file_name           VARCHAR(255) NOT NULL,
    file_path           TEXT NOT NULL,

    mime_type           VARCHAR(128),
    file_size           BIGINT,

    checksum_sha256     VARCHAR(64) NOT NULL,

    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by         UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_srs_ticket_attachments_ticket
ON srs.ticket_attachments(ticket_id);
```

---

## 4.5 external_api_log

### Purpose

Track outbound and inbound API integrations.

```sql
CREATE TABLE srs.external_api_log (
    id                  UUID PRIMARY KEY,

    integration_name    VARCHAR(128) NOT NULL,

    direction           VARCHAR(16) NOT NULL,

    request_payload     JSONB,
    response_payload    JSONB,

    response_status     INTEGER,

    request_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_at         TIMESTAMPTZ,

    correlation_id      UUID,

    created_by          UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_srs_external_api_log_integration
ON srs.external_api_log(integration_name);

CREATE INDEX idx_srs_external_api_log_request_at
ON srs.external_api_log(request_at);
```

---

# 5. Backend Structure

```text
srs/
├── api/
├── application/
├── domain/
├── dto/
├── persistence/
├── mapper/
├── validation/
└── events/
```

---

# 6. Domain Model

## 6.1 TicketPriority

```text
LOW
MEDIUM
HIGH
CRITICAL
```

## 6.2 TicketStatus

```text
OPEN
ASSIGNED
IN_PROGRESS
WAITING_EXTERNAL
RESOLVED
CLOSED
CANCELLED
```

## 6.3 Status Transition Rules

Allowed transitions:

```text
OPEN -> ASSIGNED
ASSIGNED -> IN_PROGRESS
IN_PROGRESS -> WAITING_EXTERNAL
WAITING_EXTERNAL -> IN_PROGRESS
IN_PROGRESS -> RESOLVED
RESOLVED -> CLOSED
OPEN -> CANCELLED
ASSIGNED -> CANCELLED
```

Forbidden:

```text
CLOSED -> any status
CANCELLED -> any status
RESOLVED -> OPEN
```

All transitions must be validated and audited.

---

# 7. DTOs

## 7.1 TicketCreateRequest

```text
requestTypeId
equipmentId
title
description
priority
assigneeId
```

## 7.2 TicketUpdateRequest

```text
title
description
priority
assigneeId
dueAt
```

## 7.3 TicketResponse

```text
id
ticketNumber
requestType
equipmentId
linkedWorkOrderId
title
description
priority
status
requesterId
assigneeId
openedAt
resolvedAt
closedAt
createdAt
updatedAt
```

## 7.4 TicketCommentRequest

```text
commentText
isInternal
```

## 7.5 WorkOrderCreationRequest

```text
ticketId
equipmentId
priority
description
```

Do not expose JPA entities directly.

---

# 8. Repository Layer

## Required Repositories

### TicketRepository

Required methods:

```text
findById
findByTicketNumber
search
findByStatus
findByAssigneeId
```

### RequestTypeRepository

Required methods:

```text
findById
findByCode
findActive
```

### TicketCommentRepository

Required methods:

```text
findByTicketId
```

### TicketAttachmentRepository

Required methods:

```text
findByTicketId
```

### ExternalApiLogRepository

Required methods:

```text
findByIntegrationName
findByCorrelationId
```

---

# 9. Service Layer

## 9.1 TicketService

Required operations:

```text
createTicket
updateTicket
assignTicket
changeStatus
resolveTicket
closeTicket
cancelTicket
getTicket
searchTickets
```

Rules:

- generate unique `ticket_number`;
- validate ticket lifecycle;
- validate equipment exists through EPS;
- emit audit events;
- use transactions.

---

## 9.2 TicketCommentService

Required operations:

```text
addComment
getComments
```

Rules:

- internal comments visible only to authorized staff;
- comments audited.

---

## 9.3 TicketAttachmentService

Required operations:

```text
uploadAttachment
getAttachments
```

Rules:

- files stored outside DB;
- checksum required;
- uploads audited.

---

## 9.4 WorkOrderIntegrationService

Required operations:

```text
createWorkOrderFromTicket
linkWorkOrder
```

Rules:

- create MMS work order through service/API;
- store linked work order ID;
- audit work order creation from ticket;
- SRS must not directly create MMS DB records.

---

# 10. REST API

## Base Path

```text
/api/v1/srs
```

---

# 11. Ticket Endpoints

```text
GET     /tickets
POST    /tickets

GET     /tickets/{id}
PUT     /tickets/{id}

POST    /tickets/{id}/assign
POST    /tickets/{id}/change-status
POST    /tickets/{id}/resolve
POST    /tickets/{id}/close
POST    /tickets/{id}/cancel

GET     /tickets/{id}/comments
POST    /tickets/{id}/comments

GET     /tickets/{id}/attachments
POST    /tickets/{id}/attachments

POST    /tickets/{id}/create-work-order
```

---

# 12. Request Type Endpoints

```text
GET     /request-types
POST    /request-types

GET     /request-types/{id}
PUT     /request-types/{id}

POST    /request-types/{id}/deactivate
```

---

# 13. Search Requirements

Ticket search must support filters:

```text
ticketNumber
status
priority
requestTypeId
requesterId
assigneeId
equipmentId
openedFrom
openedTo
dueBefore
```

Support:

```text
pagination
sorting
```

Default sorting:

```text
openedAt DESC
```

---

# 14. SLA Requirements

Initial SLA implementation:

- due_at calculated from request type SLA;
- overdue tickets detectable via query;
- SLA breach indicator in API/UI.

Advanced SLA escalation may be implemented later.

---

# 15. External API Logging

All external API integrations must log:

```text
integrationName
direction
requestPayload
responsePayload
responseStatus
correlationId
timestamps
```

Sensitive data must be masked before persistence.

---

# 16. Audit Requirements

Every state-changing operation must emit audit event.

Required events:

```text
SRS_TICKET_CREATED
SRS_TICKET_UPDATED
SRS_TICKET_ASSIGNED
SRS_TICKET_STATUS_CHANGED
SRS_TICKET_RESOLVED
SRS_TICKET_CLOSED
SRS_TICKET_CANCELLED

SRS_COMMENT_ADDED
SRS_ATTACHMENT_UPLOADED

SRS_REQUEST_TYPE_CREATED
SRS_REQUEST_TYPE_UPDATED
SRS_REQUEST_TYPE_DEACTIVATED

SRS_WORK_ORDER_CREATED_FROM_TICKET
```

---

# 17. Permissions

Required permissions:

```text
SRS_READ
SRS_WRITE
SRS_ASSIGN
SRS_RESOLVE
SRS_CLOSE
SRS_CANCEL
SRS_COMMENT_INTERNAL
SRS_WORK_ORDER_CREATE
SRS_REQUEST_TYPE_MANAGE
```

---

# 18. Security Rules

All endpoints require authentication.

Sensitive operations require permissions:

```text
Create/update ticket           -> SRS_WRITE
Assign ticket                  -> SRS_ASSIGN
Resolve ticket                 -> SRS_RESOLVE
Close ticket                   -> SRS_CLOSE
Cancel ticket                  -> SRS_CANCEL
Create internal comment        -> SRS_COMMENT_INTERNAL
Create work order from ticket  -> SRS_WORK_ORDER_CREATE
Manage request types           -> SRS_REQUEST_TYPE_MANAGE
```

Forbidden:

- exposing JPA entities directly;
- bypassing service layer;
- frontend-only authorization;
- direct MMS DB manipulation;
- direct EPS DB manipulation.

---

# 19. Angular Structure

```text
frontend/src/app/features/srs/
├── pages/
├── components/
├── services/
├── models/
├── guards/
└── routes/
```

---

# 20. Angular Pages

## Required Pages

### Ticket List

Features:

- pagination;
- search;
- status filter;
- priority filter;
- assignee filter;
- overdue filter.

### Ticket Details

Features:

- metadata;
- comments;
- attachments;
- linked equipment;
- linked work order;
- status actions.

### Ticket Create/Edit

Features:

- request type selector;
- equipment selector;
- assignee selector;
- validation.

### Ticket Comments

Features:

- internal/public comments;
- chronological history.

### Work Order Creation

Features:

- create MMS work order from ticket;
- show linked work order status.

### Request Types

Features:

- list request types;
- create/edit/deactivate.

---

# 21. Frontend Service Layer

Required services:

```text
TicketApiService
TicketCommentApiService
TicketAttachmentApiService
RequestTypeApiService
WorkOrderIntegrationApiService
```

Use typed DTOs.

Prefer generated OpenAPI client.

---

# 22. Integration Requirements

## SRS -> EPS

SRS validates and displays equipment through EPS service/API.

SRS stores only `equipment_id`.

SRS must not duplicate equipment master data.

## SRS -> MMS

SRS may create MMS work orders.

SRS stores only:

```text
linked_work_order_id
```

SRS must not manipulate MMS work order state directly.

## SRS -> WMS

No direct dependency allowed.

---

# 23. Tests

## Backend Tests

Required:

- ticket service tests;
- ticket lifecycle tests;
- SLA calculation tests;
- assignment tests;
- work order integration tests;
- security tests;
- audit tests;
- repository search tests.

## Frontend Tests

Required:

- ticket list tests;
- ticket form validation tests;
- status action visibility tests;
- API service tests.

---

# 24. PR Breakdown

## PR-001

SRS schema + migrations

## PR-002

Ticket entity + repository

## PR-003

Request types backend

## PR-004

Ticket DTOs + mapper

## PR-005

Ticket service + lifecycle validation

## PR-006

Ticket REST API

## PR-007

SRS permissions + security

## PR-008

Audit integration

## PR-009

Comments backend

## PR-010

Attachments backend

## PR-011

Search/filter/pagination

## PR-012

MMS work order integration

## PR-013

External API logging

## PR-014

Angular ticket list page

## PR-015

Angular ticket detail page

## PR-016

Angular ticket create/edit page

## PR-017

Angular comments/attachments UI

## PR-018

Angular request types UI

## PR-019

Integration and hardening

---

# 25. Definition of Done

SRS feature is done only when:

- migrations exist;
- endpoints exist;
- DTOs exist;
- validation exists;
- permissions are enforced;
- ticket lifecycle is validated;
- audit events are emitted;
- comments and attachments work;
- MMS integration works;
- tests are added;
- OpenAPI is updated;
- Angular UI works;
- no module boundaries are violated.
