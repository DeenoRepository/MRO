# Architecture

## System Type

The system is an enterprise MRO/CMMS modular monolith.

One backend application contains multiple bounded modules:

- EPS
- MMS
- WMS
- SRS
- Core
- Audit
- Reporting

The system must not be split into microservices during MVP.

---

# Module Responsibilities

## EPS — Equipment Passportization System

EPS is the source of truth for equipment.

Owns:

- equipment registry;
- technical passports;
- equipment documents;
- document versions;
- asset tags;
- equipment lifecycle;
- equipment change requests.

Does not own:

- work orders;
- stock movements;
- tickets.

---

## MMS — Maintenance Management System

MMS owns maintenance workflows.

Owns:

- work orders;
- preventive maintenance schedules;
- corrective maintenance;
- emergency maintenance;
- completion acts;
- maintenance history;
- technician assignments.

References:

- EPS equipment;
- WMS reservations or consumed parts.

---

## WMS — Warehouse Management System

WMS owns warehouse and inventory data.

Owns:

- warehouses;
- parts;
- stock levels;
- stock movements;
- reservations;
- transfers;
- custodians.

References:

- EPS equipment when parts are associated with assets;
- MMS work orders through reservation references.

---

## SRS — Service Request System

SRS owns service request workflows.

Owns:

- service requests;
- tickets;
- ticket comments;
- request types;
- SLA metadata;
- external API log.

References:

- EPS equipment;
- MMS work orders created from tickets.

---

## Core

Core owns identity and authorization primitives.

Owns:

- users;
- roles;
- permissions;
- LDAP group mappings;
- security context support.

Core must not depend on business modules.

---

## Audit

Audit owns immutable audit log.

Audit must not depend on business modules.

Business modules may emit audit events.

---

## Reporting

Reporting owns read-only projections and reports.

Reporting may read through views/materialized views.

Reporting must not mutate business module data.

---

# Dependency Rules

Allowed:

```text
SRS -> EPS
SRS -> MMS
MMS -> EPS
MMS -> WMS
WMS -> EPS
Any module -> Core
Any module -> Audit
Any module -> Shared
Reporting -> read-only views/projections
```

Forbidden:

```text
EPS -> MMS
EPS -> WMS
EPS -> SRS
WMS -> MMS
WMS -> SRS
MMS -> SRS
Audit -> business modules
Core -> business modules
```

---

# Cross-Module Flows

## SRS creates maintenance work

```text
SRS ticket
  -> MMS work order
  -> ticket linked to work order
  -> audit event recorded
```

## MMS consumes inventory

```text
MMS work order
  -> WMS reservation
  -> WMS consumption
  -> audit event recorded
```

## MMS references equipment

```text
MMS work order
  -> references EPS equipment_id
  -> does not duplicate equipment master data
```

## SRS references equipment

```text
SRS ticket
  -> references EPS equipment_id
  -> does not duplicate equipment master data
```

---

# Data Ownership

Each module owns its schema and repository layer.

A module must not directly use another module's repositories.

Cross-module access must happen through:

- service interfaces;
- domain events;
- read-only projections;
- controlled database views where justified.

---

# API Structure

All APIs use:

```text
/api/v1/{module}/{resource}
```

Examples:

```text
/api/v1/eps/equipment
/api/v1/mms/work-orders
/api/v1/wms/parts
/api/v1/srs/tickets
```

---

# Database Schemas

Required schemas:

```sql
CREATE SCHEMA core;
CREATE SCHEMA eps;
CREATE SCHEMA mms;
CREATE SCHEMA wms;
CREATE SCHEMA srs;
CREATE SCHEMA audit;
CREATE SCHEMA reporting;
```

---

# Security Boundary

Backend is the security boundary.

Angular route guards are UX-only and must never be treated as authorization.

All protected operations require backend authorization.

---

# Audit Boundary

Every state-changing operation must emit an audit event.

Audit records must be append-only.

Application roles must not have UPDATE or DELETE privileges on audit tables.
