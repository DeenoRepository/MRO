# MMS Implementation Plan

## Module

MMS — Maintenance Management System

---

# 1. Module Goal

MMS is responsible for planning, executing, tracking, and auditing maintenance activities.

MMS responsibilities:

- work order management;
- preventive maintenance planning;
- corrective maintenance;
- emergency maintenance;
- technician assignment;
- maintenance task tracking;
- completion acts;
- maintenance history;
- spare part reservation requests through WMS;
- equipment references through EPS;
- maintenance KPI foundation;
- audit integration.

MMS is the source of truth for:

```text
work orders
preventive maintenance schedules
maintenance tasks
completion acts
maintenance status history
technician assignments
```

MMS references EPS equipment but must not duplicate equipment master data.

---

# 2. Architecture Rules

## Allowed Dependencies

```text
MMS -> EPS
MMS -> WMS
MMS -> Core
MMS -> Audit
MMS -> Shared
```

## Forbidden Dependencies

```text
MMS -> SRS
MMS -> direct EPS repositories
MMS -> direct WMS repositories
```

MMS must communicate with EPS and WMS through service interfaces or approved module contracts.

MMS must not mutate EPS equipment master data directly.

MMS must not mutate WMS stock directly; stock changes must go through WMS reservation/consumption services.

---

# 3. Database Schema

```sql
CREATE SCHEMA mms;
```

---

# 4. Core Tables

## 4.1 work_orders

### Purpose

Main maintenance work order table.

```sql
CREATE TABLE mms.work_orders (
    id              UUID PRIMARY KEY,
    wo_number       VARCHAR(64) UNIQUE NOT NULL,

    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id),

    type            VARCHAR(32) NOT NULL,
    priority        VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(32) NOT NULL DEFAULT 'OPEN',

    scheduled_date  TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,

    technician_id   UUID REFERENCES core.users(id),

    title           VARCHAR(255) NOT NULL,
    description     TEXT,

    completion_act  JSONB,
    signature_hash  VARCHAR(64),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id),

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_mms_work_orders_equipment
ON mms.work_orders(equipment_id);

CREATE INDEX idx_mms_work_orders_status
ON mms.work_orders(status);

CREATE INDEX idx_mms_work_orders_priority
ON mms.work_orders(priority);

CREATE INDEX idx_mms_work_orders_technician
ON mms.work_orders(technician_id);

CREATE INDEX idx_mms_work_orders_scheduled_date
ON mms.work_orders(scheduled_date);
```

---

## 4.2 pm_schedules

### Purpose

Preventive maintenance schedule definitions.

```sql
CREATE TABLE mms.pm_schedules (
    id              UUID PRIMARY KEY,

    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id),

    name            VARCHAR(255) NOT NULL,
    description     TEXT,

    frequency_type  VARCHAR(32) NOT NULL,
    frequency_value INTEGER NOT NULL,

    next_due_date   DATE NOT NULL,
    last_generated_date DATE,

    is_active       BOOLEAN NOT NULL DEFAULT true,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id),

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_mms_pm_schedules_equipment
ON mms.pm_schedules(equipment_id);

CREATE INDEX idx_mms_pm_schedules_next_due
ON mms.pm_schedules(next_due_date);

CREATE INDEX idx_mms_pm_schedules_active
ON mms.pm_schedules(is_active);
```

---

## 4.3 work_order_tasks

### Purpose

Task checklist inside work orders.

```sql
CREATE TABLE mms.work_order_tasks (
    id              UUID PRIMARY KEY,

    work_order_id   UUID NOT NULL REFERENCES mms.work_orders(id),

    title           VARCHAR(255) NOT NULL,
    description     TEXT,

    status          VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    sort_order      INTEGER NOT NULL DEFAULT 0,

    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES core.users(id),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Required Indexes

```sql
CREATE INDEX idx_mms_work_order_tasks_work_order
ON mms.work_order_tasks(work_order_id);
```

---

## 4.4 work_order_parts

### Purpose

Parts requested or consumed for a work order.

Actual stock reservation/consumption is owned by WMS.

```sql
CREATE TABLE mms.work_order_parts (
    id              UUID PRIMARY KEY,

    work_order_id   UUID NOT NULL REFERENCES mms.work_orders(id),

    part_id         UUID NOT NULL,
    reservation_id  UUID,

    requested_qty   NUMERIC(18, 3) NOT NULL,
    consumed_qty    NUMERIC(18, 3) DEFAULT 0,

    status          VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_mms_work_order_parts_work_order
ON mms.work_order_parts(work_order_id);

CREATE INDEX idx_mms_work_order_parts_part
ON mms.work_order_parts(part_id);

CREATE INDEX idx_mms_work_order_parts_reservation
ON mms.work_order_parts(reservation_id);
```

---

## 4.5 maintenance_history

### Purpose

Immutable business history for work order lifecycle events.

```sql
CREATE TABLE mms.maintenance_history (
    id              UUID PRIMARY KEY,

    work_order_id   UUID NOT NULL REFERENCES mms.work_orders(id),
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id),

    event_type      VARCHAR(64) NOT NULL,
    event_data      JSONB,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_mms_maintenance_history_work_order
ON mms.maintenance_history(work_order_id);

CREATE INDEX idx_mms_maintenance_history_equipment
ON mms.maintenance_history(equipment_id);
```

---

# 5. Backend Structure

```text
mms/
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

## 6.1 WorkOrderType

```text
PREVENTIVE
CORRECTIVE
EMERGENCY
INSPECTION
```

## 6.2 WorkOrderPriority

```text
LOW
MEDIUM
HIGH
CRITICAL
```

## 6.3 WorkOrderStatus

```text
OPEN
PLANNED
ASSIGNED
IN_PROGRESS
WAITING_PARTS
COMPLETED
CANCELLED
```

## 6.4 Status Transition Rules

Allowed transitions:

```text
OPEN -> PLANNED
OPEN -> ASSIGNED
PLANNED -> ASSIGNED
ASSIGNED -> IN_PROGRESS
IN_PROGRESS -> WAITING_PARTS
WAITING_PARTS -> IN_PROGRESS
IN_PROGRESS -> COMPLETED
OPEN -> CANCELLED
PLANNED -> CANCELLED
ASSIGNED -> CANCELLED
```

Forbidden:

```text
COMPLETED -> any status
CANCELLED -> any status
WAITING_PARTS -> COMPLETED
```

All status transitions must be validated in the service layer and audited.

---

# 7. DTOs

## 7.1 WorkOrderCreateRequest

```text
equipmentId
type
priority
title
description
scheduledDate
technicianId
```

## 7.2 WorkOrderUpdateRequest

```text
priority
title
description
scheduledDate
technicianId
```

## 7.3 WorkOrderResponse

```text
id
woNumber
equipmentId
equipmentAssetTag
equipmentName
type
priority
status
scheduledDate
startedAt
completedAt
technicianId
technicianName
title
description
createdAt
updatedAt
```

## 7.4 WorkOrderCompleteRequest

```text
completionNotes
completionAct
consumedParts
```

## 7.5 PMScheduleCreateRequest

```text
equipmentId
name
description
frequencyType
frequencyValue
nextDueDate
```

Do not expose JPA entities directly.

---

# 8. Repository Layer

## Required Repositories

### WorkOrderRepository

Required methods:

```text
findById
findByWoNumber
findByEquipmentId
findByStatus
search
```

### PMScheduleRepository

Required methods:

```text
findById
findByEquipmentId
findActiveDueSchedules
```

### WorkOrderTaskRepository

Required methods:

```text
findByWorkOrderId
```

### WorkOrderPartRepository

Required methods:

```text
findByWorkOrderId
findByReservationId
```

### MaintenanceHistoryRepository

Required methods:

```text
findByWorkOrderId
findByEquipmentId
```

---

# 9. Service Layer

## 9.1 WorkOrderService

Required operations:

```text
createWorkOrder
updateWorkOrder
assignTechnician
startWorkOrder
changeStatus
completeWorkOrder
cancelWorkOrder
getWorkOrder
searchWorkOrders
```

Rules:

- validate equipment exists through EPS service;
- generate unique `wo_number`;
- validate status transitions;
- emit audit events;
- write maintenance history events;
- use transactions;
- do not consume inventory directly without WMS service.

---

## 9.2 PMScheduleService

Required operations:

```text
createSchedule
updateSchedule
deactivateSchedule
getSchedule
searchSchedules
generateDueWorkOrders
```

Rules:

- only active schedules generate work orders;
- do not generate duplicate work orders for same due date;
- generated work orders must be audited;
- schedule generation must be idempotent.

---

## 9.3 WorkOrderTaskService

Required operations:

```text
addTask
updateTask
completeTask
reorderTasks
getTasks
```

Rules:

- completed tasks cannot be reopened without explicit permission;
- task completion must be recorded in maintenance history.

---

## 9.4 WorkOrderPartsService

Required operations:

```text
requestPartReservation
releasePartReservation
consumeReservedParts
getWorkOrderParts
```

Rules:

- reservation is created through WMS;
- consumption is performed through WMS;
- MMS stores references to reservation IDs;
- MMS does not directly change WMS stock.

---

# 10. REST API

## Base Path

```text
/api/v1/mms
```

---

# 11. Work Order Endpoints

```text
GET     /work-orders
POST    /work-orders

GET     /work-orders/{id}
PUT     /work-orders/{id}

POST    /work-orders/{id}/assign
POST    /work-orders/{id}/start
POST    /work-orders/{id}/complete
POST    /work-orders/{id}/cancel
POST    /work-orders/{id}/change-status

GET     /work-orders/{id}/tasks
POST    /work-orders/{id}/tasks

GET     /work-orders/{id}/parts
POST    /work-orders/{id}/parts/reserve
POST    /work-orders/{id}/parts/consume
POST    /work-orders/{id}/parts/release
```

---

# 12. Preventive Maintenance Endpoints

```text
GET     /pm-schedules
POST    /pm-schedules

GET     /pm-schedules/{id}
PUT     /pm-schedules/{id}

POST    /pm-schedules/{id}/deactivate
POST    /pm-schedules/generate-due
```

---

# 13. Search Requirements

Work order search must support filters:

```text
woNumber
equipmentId
status
type
priority
technicianId
scheduledFrom
scheduledTo
createdFrom
createdTo
```

Support:

```text
pagination
sorting
```

Default sorting:

```text
scheduledDate ASC, priority DESC
```

---

# 14. PM Generation Requirements

The PM generation job must:

- find active schedules with `next_due_date <= today`;
- create work order for each due schedule;
- update `last_generated_date`;
- calculate next due date;
- be idempotent;
- emit audit events;
- write maintenance history.

Initial implementation may use manual endpoint:

```text
POST /api/v1/mms/pm-schedules/generate-due
```

Later implementation may use scheduled background job.

---

# 15. Completion Act Requirements

Completion act must include:

```text
workOrderId
completedBy
completedAt
completionNotes
taskResults
consumedParts
attachmentsMetadata
```

The service must calculate and store:

```text
signature_hash
```

Initial implementation:

```text
SHA-256(canonical completion act JSON)
```

Future implementation may integrate real digital signature provider.

---

# 16. Audit Requirements

Every state-changing operation must emit audit event.

Required events:

```text
MMS_WORK_ORDER_CREATED
MMS_WORK_ORDER_UPDATED
MMS_WORK_ORDER_ASSIGNED
MMS_WORK_ORDER_STARTED
MMS_WORK_ORDER_STATUS_CHANGED
MMS_WORK_ORDER_COMPLETED
MMS_WORK_ORDER_CANCELLED

MMS_PM_SCHEDULE_CREATED
MMS_PM_SCHEDULE_UPDATED
MMS_PM_SCHEDULE_DEACTIVATED
MMS_PM_WORK_ORDER_GENERATED

MMS_TASK_CREATED
MMS_TASK_COMPLETED

MMS_PART_RESERVED
MMS_PART_CONSUMED
MMS_PART_RESERVATION_RELEASED
```

---

# 17. Permissions

Required permissions:

```text
MMS_READ
MMS_WRITE
MMS_ASSIGN
MMS_START
MMS_COMPLETE
MMS_CANCEL
MMS_PM_MANAGE
MMS_PARTS_REQUEST
```

---

# 18. Security Rules

All endpoints require authentication.

Sensitive operations require permissions:

```text
Create/update work order       -> MMS_WRITE
Assign technician              -> MMS_ASSIGN
Start work order               -> MMS_START
Complete work order            -> MMS_COMPLETE
Cancel work order              -> MMS_CANCEL
Manage PM schedules            -> MMS_PM_MANAGE
Request/consume parts          -> MMS_PARTS_REQUEST
```

Forbidden:

- exposing JPA entities directly;
- bypassing service layer;
- frontend-only authorization;
- direct WMS stock mutation;
- direct EPS table mutation.

---

# 19. Angular Structure

```text
frontend/src/app/features/mms/
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

### Work Order List

Features:

- pagination;
- search;
- status filter;
- priority filter;
- technician filter;
- scheduled date filter;
- sorting.

### Work Order Details

Features:

- work order metadata;
- equipment summary;
- tasks;
- requested parts;
- maintenance history;
- status actions.

### Work Order Create/Edit

Features:

- equipment selector;
- technician selector;
- scheduled date;
- priority;
- type;
- validation.

### PM Schedules

Features:

- list schedules;
- create schedule;
- edit schedule;
- deactivate schedule;
- generate due work orders.

### Work Order Completion

Features:

- completion notes;
- task checklist;
- consumed parts;
- completion confirmation.

---

# 21. Frontend Service Layer

Required services:

```text
WorkOrderApiService
PMScheduleApiService
WorkOrderTaskApiService
WorkOrderPartsApiService
```

Use typed DTOs.

Prefer generated OpenAPI client.

---

# 22. Integration Requirements

## MMS -> EPS

MMS must validate and display equipment through EPS service/API.

MMS stores only `equipment_id`.

MMS must not duplicate equipment master data.

## MMS -> WMS

MMS requests reservations and consumption through WMS service/API.

MMS stores only:

```text
part_id
reservation_id
requested_qty
consumed_qty
```

## SRS -> MMS

SRS may create MMS work orders.

MMS must expose an application service method for work order creation from SRS.

MMS must not depend on SRS.

---

# 23. Tests

## Backend Tests

Required:

- work order service tests;
- status transition tests;
- PM generation tests;
- completion act hash tests;
- security tests;
- audit tests;
- repository tests for search queries;
- cross-module integration tests with EPS/WMS service mocks.

## Frontend Tests

Required:

- work order list tests;
- work order form validation tests;
- status action button visibility tests;
- API service tests.

---

# 24. PR Breakdown

## PR-001

MMS schema + migrations

## PR-002

Work order entity + repository

## PR-003

Work order DTOs + mapper

## PR-004

Work order service + status transitions

## PR-005

Work order REST API

## PR-006

MMS permissions + security

## PR-007

Audit integration

## PR-008

Work order search/filter/pagination

## PR-009

PM schedules backend

## PR-010

PM generation logic

## PR-011

Work order tasks

## PR-012

Work order parts reservation contract

## PR-013

Completion act + signature hash

## PR-014

Angular MMS list page

## PR-015

Angular MMS detail page

## PR-016

Angular MMS create/edit page

## PR-017

Angular PM schedules UI

## PR-018

Angular completion UI

## PR-019

Integration and hardening

---

# 25. Definition of Done

MMS feature is done only when:

- migration exists;
- endpoints exist;
- DTOs exist;
- validation exists;
- permissions are enforced;
- status transitions are validated;
- audit events are emitted;
- maintenance history is written;
- PM generation is idempotent;
- completion act hash is stored;
- tests are added;
- OpenAPI is updated;
- Angular UI works;
- no module boundaries are violated.
