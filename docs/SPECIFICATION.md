# Техническое задание для Codex

## Проект

**Enterprise MRO/CMMS Platform**

Рабочие названия модулей:

| Code | Module | Full Name |
|---|---|---|
| **EPS** | Asset Module | Equipment Passportization System |
| **MMS** | Maintenance Module | Maintenance Management System |
| **WMS** | Inventory Module | Warehouse Management System |
| **SRS** | Service Desk Module | Service Request System |

---

# 1. Цель задания

Необходимо реализовать базовую архитектуру enterprise-системы MRO/CMMS на стеке:

- **Backend:** Java 21 или Kotlin + Spring Boot 3.x
- **Frontend:** Angular + TypeScript
- **Database:** PostgreSQL 16+
- **Reverse proxy:** Nginx
- **Authentication:** LDAP / Active Directory / SSO-ready architecture
- **Authorization:** RBAC через Spring Security
- **Migrations:** Flyway
- **Observability:** Spring Actuator + Micrometer + Prometheus
- **Deployment:** systemd или Docker, в зависимости от целевой среды

Система должна быть построена как **modular monolith**: один backend application, но с чётко разделёнными доменными модулями EPS, MMS, WMS и SRS.

---

# 2. Основные архитектурные принципы

## 2.1 Modular Monolith

Система должна быть одним deployable backend-приложением, но с изолированными доменными модулями.

Запрещено:

- строить микросервисную архитектуру на первом этапе;
- делать прямой HTTP между внутренними модулями;
- смешивать доменную логику разных модулей;
- обращаться напрямую к таблицам чужого домена из application/service слоя другого модуля.

Разрешено:

- использовать typed service interfaces;
- использовать domain events;
- использовать shared kernel только для действительно общих сущностей;
- использовать cross-schema FK в PostgreSQL там, где это оправдано.

---

## 2.2 Backend Module Boundaries

Рекомендуемая структура backend:

```text
backend/
└── src/main/kotlin/com/company/mro/
    ├── MroApplication.kt
    ├── core/
    ├── eps/
    │   ├── api/
    │   ├── application/
    │   ├── domain/
    │   ├── persistence/
    │   └── dto/
    ├── mms/
    ├── wms/
    ├── srs/
    ├── audit/
    ├── notification/
    ├── reporting/
    └── shared/
```

---

# 3. Frontend Architecture

## 3.1 Angular Structure

```text
frontend/
└── src/app/
    ├── core/
    │   ├── auth/
    │   ├── guards/
    │   ├── interceptors/
    │   ├── layout/
    │   └── services/
    ├── shared/
    ├── features/
    │   ├── eps/
    │   ├── mms/
    │   ├── wms/
    │   ├── srs/
    │   ├── reporting/
    │   └── admin/
    └── app.routes.ts
```

Frontend должен включать:

- routing по модулям;
- layout с navigation menu;
- role-aware меню;
- HTTP interceptor для auth/error handling;
- route guards;
- базовые CRUD-экраны для каждого модуля;
- typed API models;
- централизованную обработку ошибок.

Важно:

> Angular guards не являются security boundary. Все проверки прав должны выполняться на backend через Spring Security.

---

# 4. Database Architecture

## 4.1 PostgreSQL Schemas

Создать схемы:

```sql
CREATE SCHEMA core;
CREATE SCHEMA eps;
CREATE SCHEMA mms;
CREATE SCHEMA wms;
CREATE SCHEMA srs;
CREATE SCHEMA audit;
CREATE SCHEMA reporting;
```

## 4.2 Flyway

Все изменения БД должны выполняться через Flyway migrations.

```text
backend/src/main/resources/db/migration/
├── V001__create_core_schema.sql
├── V002__create_eps_schema.sql
├── V003__create_mms_schema.sql
├── V004__create_wms_schema.sql
├── V005__create_srs_schema.sql
├── V006__create_audit_schema.sql
├── V007__create_reporting_views.sql
└── V008__seed_reference_data.sql
```

---

# 5. Core Module

Core module отвечает за:

- пользователей;
- роли;
- permissions;
- LDAP/AD group mapping;
- security context;
- общие справочники.

Минимальные таблицы:

```sql
CREATE TABLE core.users (
    id              UUID PRIMARY KEY,
    username        VARCHAR(128) UNIQUE NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    ldap_dn         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE core.roles (
    id              UUID PRIMARY KEY,
    code            VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT
);

CREATE TABLE core.permissions (
    id              UUID PRIMARY KEY,
    code            VARCHAR(128) UNIQUE NOT NULL,
    description     TEXT
);

CREATE TABLE core.role_permissions (
    role_id         UUID NOT NULL REFERENCES core.roles(id),
    permission_id   UUID NOT NULL REFERENCES core.permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE core.user_roles (
    user_id         UUID NOT NULL REFERENCES core.users(id),
    role_id         UUID NOT NULL REFERENCES core.roles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE core.ldap_group_mappings (
    id              UUID PRIMARY KEY,
    ldap_group_dn   TEXT NOT NULL,
    role_id         UUID NOT NULL REFERENCES core.roles(id)
);
```

---

# 6. EPS — Equipment Passportization System

## 6.1 Назначение

EPS является **source of truth** для оборудования.

EPS отвечает за:

- реестр оборудования;
- технические паспорта;
- категории оборудования;
- документы оборудования;
- версии документов;
- QR/barcode идентификаторы;
- lifecycle оборудования;
- approval/change request workflow.

## 6.2 EPS Tables

```sql
CREATE TABLE eps.equipment (
    id              UUID PRIMARY KEY,
    asset_tag       VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(128) NOT NULL,
    status          VARCHAR(64) NOT NULL DEFAULT 'active',
    location        VARCHAR(255),
    manufacturer    VARCHAR(255),
    model           VARCHAR(255),
    serial_number   VARCHAR(128),
    install_date    DATE,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      UUID REFERENCES core.users(id)
);

CREATE TABLE eps.equipment_documents (
    id              UUID PRIMARY KEY,
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id),
    document_type   VARCHAR(64) NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_path       TEXT NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    checksum_sha256 VARCHAR(64) NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by     UUID REFERENCES core.users(id)
);

CREATE TABLE eps.change_requests (
    id              UUID PRIMARY KEY,
    entity_type     VARCHAR(64) NOT NULL,
    entity_id       UUID,
    change_type     VARCHAR(32) NOT NULL,
    proposed_data   JSONB NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'pending',
    requested_by    UUID REFERENCES core.users(id),
    approved_by     UUID REFERENCES core.users(id),
    approval_notes  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at      TIMESTAMPTZ
);
```

## 6.3 EPS API

```text
GET    /api/v1/eps/equipment
POST   /api/v1/eps/equipment
GET    /api/v1/eps/equipment/{id}
PUT    /api/v1/eps/equipment/{id}
DELETE /api/v1/eps/equipment/{id}

GET    /api/v1/eps/equipment/{id}/documents
POST   /api/v1/eps/equipment/{id}/documents

GET    /api/v1/eps/change-requests
POST   /api/v1/eps/change-requests
POST   /api/v1/eps/change-requests/{id}/approve
POST   /api/v1/eps/change-requests/{id}/reject
```

## 6.4 EPS Acceptance Criteria

- Equipment can be created, viewed, updated and deactivated.
- Equipment has unique `asset_tag`.
- Documents can be linked to equipment.
- Document checksum is stored.
- Critical changes create change request instead of directly mutating data.
- All create/update/delete actions are audited.

---

# 7. MMS — Maintenance Management System

## 7.1 Назначение

MMS отвечает за:

- work orders;
- preventive maintenance;
- corrective maintenance;
- emergency maintenance;
- technician assignment;
- completion acts;
- maintenance history;
- maintenance KPIs.

## 7.2 MMS Tables

```sql
CREATE TABLE mms.work_orders (
    id              UUID PRIMARY KEY,
    wo_number       VARCHAR(64) UNIQUE NOT NULL,
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id),
    type            VARCHAR(32) NOT NULL,
    priority        VARCHAR(32) NOT NULL DEFAULT 'medium',
    status          VARCHAR(32) NOT NULL DEFAULT 'open',
    scheduled_date  TIMESTAMPTZ,
    completed_date  TIMESTAMPTZ,
    technician_id   UUID REFERENCES core.users(id),
    description     TEXT,
    completion_act  JSONB,
    signature_hash  VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mms.pm_schedules (
    id              UUID PRIMARY KEY,
    equipment_id    UUID NOT NULL REFERENCES eps.equipment(id),
    name            VARCHAR(255) NOT NULL,
    frequency       VARCHAR(64) NOT NULL,
    next_due_date   DATE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 7.3 MMS API

```text
GET    /api/v1/mms/work-orders
POST   /api/v1/mms/work-orders
GET    /api/v1/mms/work-orders/{id}
PUT    /api/v1/mms/work-orders/{id}
POST   /api/v1/mms/work-orders/{id}/assign
POST   /api/v1/mms/work-orders/{id}/complete
POST   /api/v1/mms/work-orders/{id}/cancel

GET    /api/v1/mms/pm-schedules
POST   /api/v1/mms/pm-schedules
PUT    /api/v1/mms/pm-schedules/{id}
```

## 7.4 MMS Acceptance Criteria

- Work order can reference EPS equipment.
- Work order lifecycle is enforced by allowed status transitions.
- Technician can complete work order.
- Completion act is stored.
- Completion act signature hash is stored.
- PM schedule can generate future work orders.
- All status changes are audited.

---

# 8. WMS — Warehouse Management System

## 8.1 Назначение

WMS отвечает за:

- warehouses;
- spare parts;
- stock levels;
- stock movements;
- reservations;
- transfers;
- warehouse custodians;
- inventory reconciliation.

## 8.2 WMS Tables

```sql
CREATE TABLE wms.warehouses (
    id              UUID PRIMARY KEY,
    code            VARCHAR(32) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(32) NOT NULL,
    custodian_id    UUID REFERENCES core.users(id),
    location        VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE wms.parts (
    id              UUID PRIMARY KEY,
    part_number     VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    unit            VARCHAR(32) NOT NULL DEFAULT 'pcs',
    min_stock_level NUMERIC(18, 3) DEFAULT 0,
    metadata        JSONB
);

CREATE TABLE wms.stock_movements (
    id              UUID PRIMARY KEY,
    warehouse_id    UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id         UUID NOT NULL REFERENCES wms.parts(id),
    movement_type   VARCHAR(32) NOT NULL,
    quantity        NUMERIC(18, 3) NOT NULL,
    reference_type  VARCHAR(64),
    reference_id    UUID,
    initiated_by    UUID REFERENCES core.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wms.reservations (
    id              UUID PRIMARY KEY,
    warehouse_id    UUID NOT NULL REFERENCES wms.warehouses(id),
    part_id         UUID NOT NULL REFERENCES wms.parts(id),
    quantity        NUMERIC(18, 3) NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'reserved',
    reference_type  VARCHAR(64),
    reference_id    UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES core.users(id)
);
```

## 8.3 WMS API

```text
GET    /api/v1/wms/warehouses
POST   /api/v1/wms/warehouses
GET    /api/v1/wms/parts
POST   /api/v1/wms/parts
GET    /api/v1/wms/stock-levels
POST   /api/v1/wms/stock-movements
POST   /api/v1/wms/reservations
POST   /api/v1/wms/reservations/{id}/release
POST   /api/v1/wms/reservations/{id}/consume
```

## 8.4 WMS Acceptance Criteria

- Parts can be created and searched.
- Warehouses can be created and assigned to custodians.
- Stock movement changes stock level.
- Reservation prevents accidental over-consumption.
- MMS can reserve and consume spare parts for work orders.
- All stock movements are audited.

---

# 9. SRS — Service Request System

## 9.1 Назначение

SRS отвечает за:

- service requests;
- tickets;
- issue routing;
- SLA rules;
- request comments;
- user-submitted service issues;
- integration with EPS/MMS/WMS.

## 9.2 SRS Tables

```sql
CREATE TABLE srs.tickets (
    id              UUID PRIMARY KEY,
    ticket_number   VARCHAR(64) UNIQUE NOT NULL,
    requester_id    UUID REFERENCES core.users(id),
    assignee_id     UUID REFERENCES core.users(id),
    equipment_id    UUID REFERENCES eps.equipment(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    priority        VARCHAR(32) NOT NULL DEFAULT 'medium',
    status          VARCHAR(32) NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);

CREATE TABLE srs.ticket_comments (
    id              UUID PRIMARY KEY,
    ticket_id       UUID NOT NULL REFERENCES srs.tickets(id),
    author_id       UUID REFERENCES core.users(id),
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE srs.request_types (
    id              UUID PRIMARY KEY,
    code            VARCHAR(64) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    default_priority VARCHAR(32) NOT NULL DEFAULT 'medium',
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE srs.external_api_log (
    id              UUID PRIMARY KEY,
    system_name     VARCHAR(128) NOT NULL,
    direction       VARCHAR(32) NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status_code     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 9.3 SRS API

```text
GET    /api/v1/srs/tickets
POST   /api/v1/srs/tickets
GET    /api/v1/srs/tickets/{id}
PUT    /api/v1/srs/tickets/{id}
POST   /api/v1/srs/tickets/{id}/assign
POST   /api/v1/srs/tickets/{id}/resolve
POST   /api/v1/srs/tickets/{id}/close
POST   /api/v1/srs/tickets/{id}/comments

POST   /api/v1/srs/tickets/{id}/create-work-order
```

## 9.4 SRS Acceptance Criteria

- User can create service request.
- Ticket can reference EPS equipment.
- Ticket can be assigned and resolved.
- Ticket can create MMS work order.
- Ticket lifecycle has controlled status transitions.
- Comments are stored and audited.

---

# 10. Cross-Module Flows

## 10.1 SRS → MMS

```text
SRS ticket
  → create MMS work order
  → link work_order_id to ticket
  → audit both actions
```

## 10.2 MMS → WMS

```text
MMS work order
  → request WMS reservation
  → consume reserved stock after completion
  → audit stock movement
```

## 10.3 MMS → EPS

```text
MMS completion act
  → update EPS maintenance history/projection
  → keep EPS as equipment source of truth
```

## 10.4 SRS → EPS

```text
SRS ticket
  → references EPS equipment
  → does not duplicate equipment master data
```

---

# 11. Security Requirements

## 11.1 Authentication

Initial implementation may use local dev authentication profile.

Production-ready architecture must support:

- LDAP;
- Active Directory;
- OIDC/SSO-ready integration;
- group-to-role mapping.

## 11.2 Authorization

Use Spring Security.

Required permissions:

```text
EPS_READ
EPS_WRITE
EPS_APPROVE

MMS_READ
MMS_WRITE
MMS_ASSIGN
MMS_COMPLETE

WMS_READ
WMS_WRITE
WMS_RESERVE
WMS_CONSUME

SRS_READ
SRS_WRITE
SRS_ASSIGN
SRS_RESOLVE

AUDIT_READ
ADMIN_MANAGE_USERS
ADMIN_MANAGE_ROLES
```

## 11.3 Role Defaults

```text
SYSTEM_ADMIN
EPS_MANAGER
MMS_MANAGER
MMS_TECHNICIAN
WMS_MANAGER
WAREHOUSE_CUSTODIAN
SRS_MANAGER
SRS_AGENT
AUDITOR
```

## 11.4 Backend Security Rules

- All `/api/v1/**` endpoints require authentication.
- Authorization must be enforced on backend.
- Method-level `@PreAuthorize` should be used for sensitive operations.
- Input validation must use Bean Validation.
- Sensitive operations must create audit events.
- API errors must not leak stack traces.

---

# 12. Audit Requirements

## 12.1 Audit Table

```sql
CREATE TABLE audit.log (
    id              BIGSERIAL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id         UUID REFERENCES core.users(id),
    action          VARCHAR(128) NOT NULL,
    module          VARCHAR(32) NOT NULL,
    entity_type     VARCHAR(64) NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    request_id      UUID,
    previous_hash   VARCHAR(64),
    signature       VARCHAR(64) NOT NULL,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);
```

## 12.2 Audit Requirements

- Audit log is append-only.
- Application role must not have UPDATE/DELETE permission on audit tables.
- Each audit event should include request_id.
- HMAC chaining should be implemented as service abstraction.
- For MVP, HMAC may be implemented with local secret from environment variable.
- Later, secret should move to Vault/KMS.

---

# 13. API Standards

## 13.1 General

All APIs must follow:

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

## 13.2 Response Format

Use consistent response format:

```json
{
  "data": {},
  "meta": {},
  "errors": []
}
```

For paginated endpoints:

```json
{
  "data": [],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

## 13.3 Error Format

```json
{
  "timestamp": "2026-05-24T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/eps/equipment",
  "requestId": "uuid"
}
```

---

# 14. OpenAPI

The backend must expose OpenAPI documentation.

Recommended:

```text
springdoc-openapi
```

Endpoints:

```text
/v3/api-docs
/swagger-ui.html
```

The Angular client should preferably be generated from OpenAPI.

---

# 15. Observability

## 15.1 Spring Actuator

Expose:

```text
/actuator/health
/actuator/info
/actuator/metrics
/actuator/prometheus
```

Sensitive actuator endpoints must be protected.

## 15.2 Metrics

Track:

- HTTP request duration;
- HTTP error rate;
- DB connection pool usage;
- JVM heap;
- GC pauses;
- login failures;
- audit write failures;
- background job failures.

## 15.3 Logging

Use structured JSON logs.

Each log entry should include:

```text
timestamp
level
request_id
user_id
module
action
entity_type
entity_id
result
```

---

# 16. Background Jobs

Required job types:

- preventive maintenance generation;
- notification dispatch;
- audit digest export;
- report refresh;
- stale reservation cleanup.

Initial implementation may use:

```text
Spring Scheduling
```

For production durability, design should allow migration to:

```text
Quartz
DB-backed queue
message broker
```

---

# 17. Reporting

Create reporting module with read-only views.

Initial reports:

- equipment count by status/category;
- open work orders by priority/status;
- overdue PM schedules;
- stock below minimum;
- tickets by status/priority;
- work order completion time.

Use PostgreSQL views/materialized views where appropriate.

---

# 18. Document Management

Documents are stored outside DB.

Database stores:

- metadata;
- file path/object key;
- checksum;
- version;
- uploader;
- upload timestamp.

MVP storage:

```text
local encrypted filesystem path
```

Future storage:

```text
S3-compatible object storage / MinIO / enterprise storage
```

---

# 19. Build & Repository Structure

Recommended monorepo:

```text
mro-platform/
├── backend/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── src/
├── frontend/
│   ├── package.json
│   ├── angular.json
│   └── src/
├── deploy/
│   ├── nginx/
│   ├── systemd/
│   └── docker/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── database.md
└── README.md
```

---

# 20. Build Commands

## Backend

```bash
cd backend
./gradlew clean test bootJar
```

## Frontend

```bash
cd frontend
npm install
npm run lint
npm run test
npm run build
```

## Full Local Dev

Provide either:

```bash
docker compose up
```

or documented local startup instructions.

---

# 21. Deployment Requirements

## 21.1 systemd Deployment

Provide:

- backend systemd unit;
- environment file example;
- Nginx config;
- PostgreSQL migration instructions;
- log location;
- health check command.

## 21.2 Docker Deployment

Provide:

- Dockerfile for backend;
- Dockerfile or Nginx config for frontend;
- docker-compose.yml for local/dev;
- environment variable documentation.

---

# 22. Nginx Requirements

Nginx should:

- serve Angular static files;
- reverse proxy `/api/*` to Spring Boot;
- apply upload size limit;
- add security headers;
- support TLS termination.

Recommended routing:

```text
/       -> Angular SPA
/api/*  -> Spring Boot backend
```

---

# 23. Testing Requirements

## 23.1 Backend

Required:

- unit tests for services;
- repository tests;
- controller tests;
- security tests for RBAC;
- migration validation;
- audit service tests.

Recommended tools:

- JUnit 5;
- Testcontainers PostgreSQL;
- MockMvc;
- AssertJ.

## 23.2 Frontend

Required:

- component tests for key screens;
- route guard tests;
- service tests;
- form validation tests.

---

# 24. MVP Scope

Codex should implement MVP in this order:

## Step 1 — Project Skeleton

- Spring Boot backend
- Angular frontend
- PostgreSQL docker-compose
- Flyway setup
- health endpoint
- README

## Step 2 — Core Security

- users
- roles
- permissions
- dev authentication
- RBAC annotations
- seed roles/permissions

## Step 3 — EPS

- equipment CRUD
- document metadata
- change request stub
- audit events

## Step 4 — MMS

- work orders
- PM schedules
- status transitions
- link to EPS equipment

## Step 5 — WMS

- warehouses
- parts
- stock movements
- reservations

## Step 6 — SRS

- tickets
- comments
- ticket-to-work-order flow

## Step 7 — Cross-Cutting

- audit log
- structured logging
- OpenAPI
- Angular navigation
- dashboard placeholders

---

# 25. Non-Goals for MVP

Do not implement in MVP unless explicitly requested:

- Kubernetes;
- microservices;
- Kafka;
- complex offline sync;
- full LDAP production integration;
- complex BI engine;
- real digital signature provider;
- external ERP integration;
- multi-tenant architecture.

Architecture must remain compatible with adding these later.

---

# 26. Codex Implementation Instructions

When implementing this project:

1. Start with the repository skeleton.
2. Prefer simple, working code over abstract frameworks.
3. Keep module boundaries explicit.
4. Do not introduce microservices.
5. Use PostgreSQL-specific features only where useful.
6. Use Flyway for every schema change.
7. Add tests for critical service logic.
8. Add README instructions for local run.
9. Use OpenAPI annotations or springdoc generation.
10. Keep authentication pluggable: dev profile now, LDAP/OIDC later.
11. Avoid storing secrets in code.
12. Make all generated code production-readable.
13. Do not hide authorization only in Angular.
14. Backend authorization is mandatory.
15. Every state-changing operation should be auditable.

---

# 27. Expected Deliverables

Codex should produce:

- backend Spring Boot application;
- Angular frontend application;
- PostgreSQL schema migrations;
- seed data for roles/permissions;
- REST APIs for EPS/MMS/WMS/SRS;
- basic Angular screens;
- audit logging implementation;
- OpenAPI documentation;
- Docker Compose for local development;
- deployment examples;
- README with setup and run instructions.

---

# 28. Acceptance Criteria

Project is acceptable when:

- `docker compose up` starts PostgreSQL and backend dependencies;
- backend starts without errors;
- Flyway migrations apply cleanly;
- Angular frontend builds successfully;
- Swagger/OpenAPI is available;
- EPS equipment CRUD works;
- MMS work order can reference EPS equipment;
- WMS reservation can reference MMS work order;
- SRS ticket can create MMS work order;
- RBAC permissions are enforced on backend;
- audit log records state-changing actions;
- tests pass;
- README explains how to run the project locally.

---

# 29. Suggested First Codex Prompt

Use the following prompt to start implementation:

```text
Create a monorepo for an enterprise MRO/CMMS platform using Kotlin + Spring Boot 3.x, PostgreSQL, Flyway, Angular + TypeScript, and Nginx-ready deployment.

Implement a modular monolith with modules:
- EPS: Equipment Passportization System
- MMS: Maintenance Management System
- WMS: Warehouse Management System
- SRS: Service Request System

Start with:
1. backend Spring Boot project skeleton,
2. PostgreSQL docker-compose,
3. Flyway schemas for core, eps, mms, wms, srs, audit, reporting,
4. basic Spring Security dev profile with users/roles/permissions,
5. EPS equipment CRUD,
6. audit logging service,
7. OpenAPI setup,
8. Angular app skeleton with module-based routes.

Keep module boundaries explicit. Do not use microservices. Do not implement Kafka or Kubernetes. Include tests and README.
```

---

# 30. Notes

This specification is designed for iterative implementation by Codex or another coding agent. Each module should be implemented in small pull requests, with database migrations, tests, and documentation updated together.
