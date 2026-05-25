# EPS Implementation Plan

## Module

EPS — Equipment Passportization System

---

# 1. Module Goal

EPS is the authoritative equipment registry for the entire platform.

EPS responsibilities:

- equipment registry;
- equipment lifecycle;
- technical passports;
- asset tagging;
- QR/barcode support;
- equipment metadata;
- equipment document management;
- change request workflow;
- approval workflow;
- equipment history;
- audit integration.

---

# 2. Architecture Rules

## Allowed Dependencies

```text
EPS -> Core
EPS -> Audit
EPS -> Shared
```

## Forbidden Dependencies

```text
EPS -> MMS
EPS -> WMS
EPS -> SRS
```

---

# 3. Database Schema

```sql
CREATE SCHEMA eps;
```

---

# 4. Core Tables

## equipment

```sql
CREATE TABLE eps.equipment (
    id UUID PRIMARY KEY,
    asset_tag VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(128),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 5. Backend Structure

```text
eps/
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

# 6. Required APIs

```text
GET     /api/v1/eps/equipment
POST    /api/v1/eps/equipment
GET     /api/v1/eps/equipment/{id}
PUT     /api/v1/eps/equipment/{id}

GET     /api/v1/eps/equipment/{id}/documents
POST    /api/v1/eps/equipment/{id}/documents

GET     /api/v1/eps/change-requests
POST    /api/v1/eps/change-requests
POST    /api/v1/eps/change-requests/{id}/approve
POST    /api/v1/eps/change-requests/{id}/reject
```

---

# 7. Permissions

```text
EPS_READ
EPS_WRITE
EPS_DEACTIVATE
EPS_APPROVE
EPS_DOCUMENT_UPLOAD
```

---

# 8. Audit Events

```text
EPS_EQUIPMENT_CREATED
EPS_EQUIPMENT_UPDATED
EPS_EQUIPMENT_DEACTIVATED
EPS_DOCUMENT_UPLOADED
EPS_CHANGE_REQUEST_CREATED
EPS_CHANGE_REQUEST_APPROVED
EPS_CHANGE_REQUEST_REJECTED
```

---

# 9. Angular Structure

```text
frontend/src/app/features/eps/
├── pages/
├── components/
├── services/
├── models/
├── guards/
└── routes/
```

---

# 10. Definition of Done

EPS feature is done only when:

- migration exists;
- endpoint exists;
- DTOs exist;
- validation exists;
- permission enforced;
- audit event emitted;
- tests added;
- OpenAPI updated;
- Angular UI works;
- no module boundaries violated.
