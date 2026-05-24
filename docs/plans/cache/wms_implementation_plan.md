# WMS Implementation Plan

## Module

WMS — Warehouse Management System

---

# 1. Module Goal

WMS is responsible for warehouse, spare parts, stock movement, reservation, and inventory control workflows.

WMS responsibilities:

- warehouse registry;
- spare parts catalogue;
- stock level tracking;
- stock movements;
- reservations;
- reservation release and consumption;
- warehouse transfers;
- warehouse custodians;
- minimum stock control;
- inventory reconciliation foundation;
- integration with MMS work orders;
- equipment/BOM references through EPS;
- audit integration.

WMS is the source of truth for:

```text
warehouses
parts
stock levels
stock movements
reservations
warehouse transfers
custodian assignments
```

WMS may reference EPS equipment and MMS work orders, but must not own their master data.

---

# 2. Architecture Rules

## Allowed Dependencies

```text
WMS -> EPS
WMS -> Core
WMS -> Audit
WMS -> Shared
```

## Forbidden Dependencies

```text
WMS -> MMS
WMS -> SRS
WMS -> direct EPS repositories
```

WMS must expose service interfaces that MMS can call for reservations and consumption.

WMS must not depend directly on MMS. Work order references should be stored as generic reference fields:

```text
reference_type
reference_id
```

Example:

```text
reference_type = WORK_ORDER
reference_id = {mms_work_order_id}
```

---

# 3. Database Schema

```sql
CREATE SCHEMA wms;
```

---

# 4. Core Tables

## 4.1 warehouses

### Purpose

Warehouse registry.

```sql
CREATE TABLE wms.warehouses (
    id              UUID PRIMARY KEY,
    code            VARCHAR(32) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(32) NOT NULL,

    custodian_id    UUID REFERENCES core.users(id),

    location        VARCHAR(255),
    description     TEXT,

    is_active       BOOLEAN NOT NULL DEFAULT true,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id),

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_wms_warehouses_type
ON wms.warehouses(type);

CREATE INDEX idx_wms_warehouses_custodian
ON wms.warehouses(custodian_id);

CREATE INDEX idx_wms_warehouses_active
ON wms.warehouses(is_active);
```

---

## 4.2 parts

### Purpose

Spare parts catalogue.

```sql
CREATE TABLE wms.parts (
    id              UUID PRIMARY KEY,

    part_number     VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,

    unit            VARCHAR(32) NOT NULL DEFAULT 'pcs',

    manufacturer    VARCHAR(255),
    model           VARCHAR(255),

    min_stock_level NUMERIC(18, 3) NOT NULL DEFAULT 0,

    is_active       BOOLEAN NOT NULL DEFAULT true,

    metadata        JSONB,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id),

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES core.users(id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_wms_parts_part_number
ON wms.parts(part_number);

CREATE INDEX idx_wms_parts_name
ON wms.parts(name);

CREATE INDEX idx_wms_parts_active
ON wms.parts(is_active);
```

---

## 4.3 stock_levels

### Purpose

Current stock per warehouse and part.

```sql
CREATE TABLE wms.stock_levels (
    id              UUID PRIMARY KEY,

    warehouse_id    UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id         UUID NOT NULL REFERENCES wms.parts(id),

    quantity_on_hand NUMERIC(18, 3) NOT NULL DEFAULT 0,
    quantity_reserved NUMERIC(18, 3) NOT NULL DEFAULT 0,

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_wms_stock_levels_warehouse_part
        UNIQUE (warehouse_id, part_id),

    CONSTRAINT chk_wms_stock_non_negative
        CHECK (quantity_on_hand >= 0 AND quantity_reserved >= 0)
);
```

### Required Indexes

```sql
CREATE INDEX idx_wms_stock_levels_warehouse
ON wms.stock_levels(warehouse_id);

CREATE INDEX idx_wms_stock_levels_part
ON wms.stock_levels(part_id);
```

---

## 4.4 stock_movements

### Purpose

Immutable stock movement ledger.

```sql
CREATE TABLE wms.stock_movements (
    id              UUID PRIMARY KEY,

    warehouse_id    UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id         UUID NOT NULL REFERENCES wms.parts(id),

    movement_type   VARCHAR(32) NOT NULL,
    quantity        NUMERIC(18, 3) NOT NULL,

    reference_type  VARCHAR(64),
    reference_id    UUID,

    reason          TEXT,

    initiated_by    UUID REFERENCES core.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Required Indexes

```sql
CREATE INDEX idx_wms_stock_movements_warehouse
ON wms.stock_movements(warehouse_id);

CREATE INDEX idx_wms_stock_movements_part
ON wms.stock_movements(part_id);

CREATE INDEX idx_wms_stock_movements_reference
ON wms.stock_movements(reference_type, reference_id);

CREATE INDEX idx_wms_stock_movements_created_at
ON wms.stock_movements(created_at);
```

---

## 4.5 reservations

### Purpose

Reserve stock for work orders or other business references.

```sql
CREATE TABLE wms.reservations (
    id              UUID PRIMARY KEY,

    warehouse_id    UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id         UUID NOT NULL REFERENCES wms.parts(id),

    quantity        NUMERIC(18, 3) NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'RESERVED',

    reference_type  VARCHAR(64),
    reference_id    UUID,

    expires_at      TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id),

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES core.users(id),

    CONSTRAINT chk_wms_reservation_quantity_positive
        CHECK (quantity > 0)
);
```

### Required Indexes

```sql
CREATE INDEX idx_wms_reservations_warehouse
ON wms.reservations(warehouse_id);

CREATE INDEX idx_wms_reservations_part
ON wms.reservations(part_id);

CREATE INDEX idx_wms_reservations_status
ON wms.reservations(status);

CREATE INDEX idx_wms_reservations_reference
ON wms.reservations(reference_type, reference_id);

CREATE INDEX idx_wms_reservations_expires_at
ON wms.reservations(expires_at);
```

---

## 4.6 warehouse_transfers

### Purpose

Transfer stock between warehouses.

```sql
CREATE TABLE wms.warehouse_transfers (
    id                  UUID PRIMARY KEY,

    source_warehouse_id UUID NOT NULL REFERENCES wms.warehouses(id),
    target_warehouse_id UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id             UUID NOT NULL REFERENCES wms.parts(id),

    quantity            NUMERIC(18, 3) NOT NULL,
    status              VARCHAR(32) NOT NULL DEFAULT 'DRAFT',

    requested_by        UUID REFERENCES core.users(id),
    approved_by         UUID REFERENCES core.users(id),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_wms_transfer_quantity_positive
        CHECK (quantity > 0),

    CONSTRAINT chk_wms_transfer_different_warehouses
        CHECK (source_warehouse_id <> target_warehouse_id)
);
```

### Required Indexes

```sql
CREATE INDEX idx_wms_transfers_source
ON wms.warehouse_transfers(source_warehouse_id);

CREATE INDEX idx_wms_transfers_target
ON wms.warehouse_transfers(target_warehouse_id);

CREATE INDEX idx_wms_transfers_part
ON wms.warehouse_transfers(part_id);

CREATE INDEX idx_wms_transfers_status
ON wms.warehouse_transfers(status);
```

---

# 5. Backend Structure

```text
wms/
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

## 6.1 WarehouseType

```text
MAIN
SATELLITE
FIELD
TEMPORARY
```

## 6.2 StockMovementType

```text
RECEIPT
ISSUE
ADJUSTMENT_IN
ADJUSTMENT_OUT
RESERVATION
RESERVATION_RELEASE
CONSUMPTION
TRANSFER_OUT
TRANSFER_IN
RETURN
```

## 6.3 ReservationStatus

```text
RESERVED
PARTIALLY_CONSUMED
CONSUMED
RELEASED
EXPIRED
CANCELLED
```

## 6.4 TransferStatus

```text
DRAFT
REQUESTED
APPROVED
IN_TRANSIT
COMPLETED
CANCELLED
```

## 6.5 Stock Rules

- `quantity_on_hand` cannot be negative.
- `quantity_reserved` cannot be negative.
- available quantity is:

```text
available = quantity_on_hand - quantity_reserved
```

- reservation cannot exceed available quantity;
- consumption can only happen from active reservation;
- consumed quantity cannot exceed reserved quantity;
- released reservation decreases `quantity_reserved`;
- consumed reservation decreases both `quantity_on_hand` and `quantity_reserved`.

---

# 7. DTOs

## 7.1 WarehouseCreateRequest

```text
code
name
type
custodianId
location
description
```

## 7.2 WarehouseResponse

```text
id
code
name
type
custodianId
custodianName
location
description
isActive
createdAt
updatedAt
```

## 7.3 PartCreateRequest

```text
partNumber
name
description
unit
manufacturer
model
minStockLevel
metadata
```

## 7.4 PartResponse

```text
id
partNumber
name
description
unit
manufacturer
model
minStockLevel
isActive
metadata
createdAt
updatedAt
```

## 7.5 StockMovementCreateRequest

```text
warehouseId
partId
movementType
quantity
referenceType
referenceId
reason
```

## 7.6 ReservationCreateRequest

```text
warehouseId
partId
quantity
referenceType
referenceId
expiresAt
```

## 7.7 ReservationResponse

```text
id
warehouseId
warehouseCode
partId
partNumber
quantity
status
referenceType
referenceId
expiresAt
createdAt
updatedAt
```

## 7.8 StockLevelResponse

```text
warehouseId
warehouseCode
partId
partNumber
quantityOnHand
quantityReserved
quantityAvailable
minStockLevel
belowMinimum
```

Do not expose JPA entities directly.

---

# 8. Repository Layer

## Required Repositories

### WarehouseRepository

Required methods:

```text
findById
findByCode
existsByCode
search
```

### PartRepository

Required methods:

```text
findById
findByPartNumber
existsByPartNumber
search
```

### StockLevelRepository

Required methods:

```text
findByWarehouseIdAndPartId
findByPartId
findByWarehouseId
findBelowMinimum
```

### StockMovementRepository

Required methods:

```text
findByWarehouseId
findByPartId
findByReference
search
```

### ReservationRepository

Required methods:

```text
findById
findByReference
findByStatus
findExpiredReservations
```

### WarehouseTransferRepository

Required methods:

```text
findById
findByStatus
findBySourceWarehouseId
findByTargetWarehouseId
```

---

# 9. Service Layer

## 9.1 WarehouseService

Required operations:

```text
createWarehouse
updateWarehouse
deactivateWarehouse
getWarehouse
searchWarehouses
assignCustodian
```

Rules:

- warehouse code must be unique;
- inactive warehouse cannot receive new stock movements;
- warehouse deactivation requires zero active reservations.

---

## 9.2 PartService

Required operations:

```text
createPart
updatePart
deactivatePart
getPart
searchParts
```

Rules:

- part number must be unique;
- inactive part cannot be reserved or consumed;
- part deactivation requires no active reservations.

---

## 9.3 StockService

Required operations:

```text
receiveStock
issueStock
adjustStock
getStockLevel
searchStockLevels
getBelowMinimumStock
```

Rules:

- stock level must be updated transactionally;
- stock movement ledger must be append-only;
- quantity cannot become negative;
- every stock-changing action must create stock movement and audit event.

---

## 9.4 ReservationService

Required operations:

```text
reserveStock
releaseReservation
consumeReservation
expireReservations
getReservation
searchReservations
```

Rules:

- reservation cannot exceed available stock;
- releasing reservation decreases reserved quantity;
- consuming reservation decreases on-hand and reserved quantity;
- consumption creates stock movement;
- reservation lifecycle must be validated;
- all state changes must be audited.

---

## 9.5 WarehouseTransferService

Required operations:

```text
createTransfer
approveTransfer
startTransfer
completeTransfer
cancelTransfer
getTransfer
searchTransfers
```

Rules:

- source and target warehouse must be different;
- transfer quantity cannot exceed available stock;
- transfer completion creates transfer-out and transfer-in movements;
- transfer lifecycle must be audited.

---

# 10. REST API

## Base Path

```text
/api/v1/wms
```

---

# 11. Warehouse Endpoints

```text
GET     /warehouses
POST    /warehouses

GET     /warehouses/{id}
PUT     /warehouses/{id}

POST    /warehouses/{id}/deactivate
POST    /warehouses/{id}/assign-custodian
```

---

# 12. Parts Endpoints

```text
GET     /parts
POST    /parts

GET     /parts/{id}
PUT     /parts/{id}

POST    /parts/{id}/deactivate
```

---

# 13. Stock Endpoints

```text
GET     /stock-levels
GET     /stock-levels/below-minimum

POST    /stock-movements/receipt
POST    /stock-movements/issue
POST    /stock-movements/adjustment
```

---

# 14. Reservation Endpoints

```text
GET     /reservations
POST    /reservations

GET     /reservations/{id}

POST    /reservations/{id}/release
POST    /reservations/{id}/consume
POST    /reservations/expire
```

---

# 15. Transfer Endpoints

```text
GET     /transfers
POST    /transfers

GET     /transfers/{id}

POST    /transfers/{id}/approve
POST    /transfers/{id}/start
POST    /transfers/{id}/complete
POST    /transfers/{id}/cancel
```

---

# 16. Search Requirements

## Warehouses

Filters:

```text
code
name
type
custodianId
isActive
```

## Parts

Filters:

```text
partNumber
name
manufacturer
isActive
belowMinimum
```

## Stock Levels

Filters:

```text
warehouseId
partId
belowMinimum
quantityAvailableLessThan
```

## Reservations

Filters:

```text
warehouseId
partId
status
referenceType
referenceId
expiresBefore
```

Support:

```text
pagination
sorting
```

---

# 17. Integration Requirements

## MMS -> WMS

MMS uses WMS to reserve and consume parts for work orders.

WMS exposes service methods:

```text
reserveStock(command)
consumeReservation(command)
releaseReservation(command)
```

MMS stores only `reservation_id` and `part_id`.

WMS does not depend on MMS.

## WMS -> EPS

WMS may reference EPS equipment for BOM or asset-related stock.

WMS must not mutate EPS equipment.

---

# 18. Audit Requirements

Every state-changing operation must emit audit event.

Required events:

```text
WMS_WAREHOUSE_CREATED
WMS_WAREHOUSE_UPDATED
WMS_WAREHOUSE_DEACTIVATED
WMS_WAREHOUSE_CUSTODIAN_ASSIGNED

WMS_PART_CREATED
WMS_PART_UPDATED
WMS_PART_DEACTIVATED

WMS_STOCK_RECEIVED
WMS_STOCK_ISSUED
WMS_STOCK_ADJUSTED

WMS_RESERVATION_CREATED
WMS_RESERVATION_RELEASED
WMS_RESERVATION_CONSUMED
WMS_RESERVATION_EXPIRED
WMS_RESERVATION_CANCELLED

WMS_TRANSFER_CREATED
WMS_TRANSFER_APPROVED
WMS_TRANSFER_STARTED
WMS_TRANSFER_COMPLETED
WMS_TRANSFER_CANCELLED
```

---

# 19. Permissions

Required permissions:

```text
WMS_READ
WMS_WRITE
WMS_WAREHOUSE_MANAGE
WMS_PART_MANAGE
WMS_STOCK_RECEIVE
WMS_STOCK_ISSUE
WMS_STOCK_ADJUST
WMS_RESERVE
WMS_CONSUME
WMS_TRANSFER_MANAGE
```

---

# 20. Security Rules

All endpoints require authentication.

Sensitive operations require permissions:

```text
Create/update warehouse        -> WMS_WAREHOUSE_MANAGE
Create/update part             -> WMS_PART_MANAGE
Receive stock                  -> WMS_STOCK_RECEIVE
Issue stock                    -> WMS_STOCK_ISSUE
Adjust stock                   -> WMS_STOCK_ADJUST
Create/release reservation     -> WMS_RESERVE
Consume reservation            -> WMS_CONSUME
Manage transfers               -> WMS_TRANSFER_MANAGE
```

Forbidden:

- exposing JPA entities directly;
- bypassing service layer;
- frontend-only authorization;
- direct MMS dependency;
- direct EPS table mutation;
- stock mutation without stock movement ledger entry.

---

# 21. Angular Structure

```text
frontend/src/app/features/wms/
├── pages/
├── components/
├── services/
├── models/
├── guards/
└── routes/
```

---

# 22. Angular Pages

## Required Pages

### Warehouse List

Features:

- pagination;
- search;
- type filter;
- active filter;
- custodian filter.

### Warehouse Details

Features:

- metadata;
- custodian;
- current stock;
- recent stock movements.

### Warehouse Create/Edit

Features:

- validation;
- custodian selector;
- location fields.

### Parts List

Features:

- search;
- active filter;
- below-minimum filter;
- pagination;
- sorting.

### Part Details

Features:

- stock by warehouse;
- recent stock movements;
- reservations.

### Stock Movements

Features:

- receive stock;
- issue stock;
- adjust stock;
- movement history.

### Reservations

Features:

- create reservation;
- release reservation;
- consume reservation;
- reservation status.

### Transfers

Features:

- create transfer;
- approve transfer;
- start transfer;
- complete transfer;
- cancel transfer.

---

# 23. Frontend Service Layer

Required services:

```text
WarehouseApiService
PartApiService
StockLevelApiService
StockMovementApiService
ReservationApiService
WarehouseTransferApiService
```

Use typed DTOs.

Prefer generated OpenAPI client.

---

# 24. Tests

## Backend Tests

Required:

- warehouse service tests;
- part service tests;
- stock receive/issue/adjustment tests;
- reservation lifecycle tests;
- reservation over-consumption tests;
- stock negative quantity prevention tests;
- transfer lifecycle tests;
- security tests;
- audit tests;
- repository tests for stock search queries.

## Frontend Tests

Required:

- warehouse list tests;
- part list tests;
- stock movement form validation tests;
- reservation action visibility tests;
- API service tests.

---

# 25. PR Breakdown

## PR-001

WMS schema + migrations

## PR-002

Warehouse entity + repository

## PR-003

Part entity + repository

## PR-004

Stock level + stock movement entities

## PR-005

Warehouse service + REST API

## PR-006

Part service + REST API

## PR-007

Stock service receive/issue/adjustment

## PR-008

WMS permissions + security

## PR-009

Audit integration

## PR-010

Reservation backend

## PR-011

Reservation lifecycle and validation

## PR-012

Warehouse transfer backend

## PR-013

Search/filter/pagination

## PR-014

Angular warehouse pages

## PR-015

Angular parts pages

## PR-016

Angular stock movement pages

## PR-017

Angular reservations pages

## PR-018

Angular transfers pages

## PR-019

Integration with MMS reservation contract

## PR-020

Integration and hardening

---

# 26. Definition of Done

WMS feature is done only when:

- migrations exist;
- endpoints exist;
- DTOs exist;
- validation exists;
- permissions are enforced;
- stock rules are enforced;
- reservation lifecycle is validated;
- stock movement ledger is append-only;
- stock cannot become negative;
- audit events are emitted;
- tests are added;
- OpenAPI is updated;
- Angular UI works;
- no module boundaries are violated.
