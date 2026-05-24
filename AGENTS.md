# AGENTS.md

## Purpose

This file defines mandatory rules for AI coding agents working on this repository.

Primary goals:

1. Produce production-quality code.
2. Minimize token usage.
3. Preserve architecture boundaries.
4. Avoid unnecessary abstractions.
5. Keep changes small, reviewable, and testable.

---

# 1. Project Summary

This repository implements an enterprise MRO/CMMS platform as a modular monolith.

Modules:

| Code | Name | Responsibility |
|---|---|---|
| EPS | Equipment Passportization System | Equipment registry, technical passports, equipment documents |
| MMS | Maintenance Management System | Work orders, preventive maintenance, completion acts |
| WMS | Warehouse Management System | Warehouses, spare parts, reservations, stock movements |
| SRS | Service Request System | Tickets, service requests, request routing |
| Core | Core Platform | Users, roles, permissions, security |
| Audit | Audit Platform | Immutable audit log |
| Reporting | Reporting Platform | Read-only reports and dashboards |

---

# 2. Default Stack

Use only the approved stack unless explicitly instructed otherwise.

Backend:

- Java 21 or Kotlin
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- Flyway
- PostgreSQL 16+
- Spring Actuator
- Micrometer
- OpenAPI via springdoc-openapi

Frontend:

- Angular
- TypeScript
- Angular Router
- Angular HttpClient
- Generated OpenAPI client where possible

Infrastructure:

- Nginx
- Docker Compose for local development
- systemd or Docker for deployment

---

# 3. Architecture Rules

## 3.1 Modular Monolith

This project is a modular monolith.

Do not introduce:

- microservices;
- Kafka;
- RabbitMQ;
- Kubernetes;
- service mesh;
- distributed tracing infrastructure beyond OpenTelemetry readiness;
- CQRS;
- event sourcing;
- GraphQL;
- MongoDB;
- Redis unless explicitly approved.

## 3.2 Internal Communication

Modules communicate through typed service interfaces and domain events.

Do not use localhost HTTP between internal modules.

Do not bypass service layers.

Do not call another module's repository directly.

## 3.3 Data Ownership

EPS owns equipment data.

MMS owns maintenance data.

WMS owns warehouse and stock data.

SRS owns service request and ticket data.

Core owns users, roles, permissions, and identity mapping.

Audit owns audit records.

Reporting owns read-only projections and reports.

---

# 4. Allowed Dependency Direction

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

Avoid circular dependencies.

---

# 5. Work Style

## Before coding

1. Read only files required for the current task.
2. Use search before opening large files.
3. Identify the smallest safe change.
4. Reuse existing patterns.
5. Do not redesign architecture unless explicitly asked.

## While coding

1. Keep diffs small.
2. Prefer explicit code over clever abstractions.
3. Keep controllers thin.
4. Put application logic in services.
5. Keep domain rules explicit.
6. Use DTOs for REST APIs.
7. Do not expose JPA entities directly through APIs.
8. Add audit events for state-changing operations.
9. Enforce authorization on backend.
10. Add or update tests for changed behavior.

## After coding

1. Run the smallest relevant test set.
2. Run formatting/linting if available.
3. Summarize briefly:
   - implemented changes;
   - changed files;
   - tests run;
   - known limitations.

---

# 6. Token Efficiency Rules

Do:

- inspect targeted files only;
- summarize instead of quoting large files;
- make patches instead of full-file rewrites;
- avoid repeating project context;
- ask clarification only if blocked.

Do not:

- reprint large source files;
- explain basic programming concepts;
- generate long essays;
- scan unrelated modules;
- create documentation unless requested;
- introduce new dependencies casually.

---

# 7. Backend Code Rules

Controllers:

- validate request DTOs;
- call application services;
- return DTO responses;
- must not contain business logic.

Services:

- own transaction boundaries;
- enforce domain workflows;
- emit audit events;
- validate status transitions.

Repositories:

- stay inside their module;
- do not leak into controllers;
- use explicit queries where needed.

Entities:

- should not be exposed as REST responses;
- should use explicit enums for statuses where practical;
- should not contain infrastructure logic.

Transactions:

- use `@Transactional` at service layer;
- use read-only transactions for queries where appropriate.

Validation:

- use Bean Validation for API input;
- validate business rules in services/domain logic.

---

# 8. Frontend Code Rules

Use Angular feature structure:

```text
src/app/features/eps
src/app/features/mms
src/app/features/wms
src/app/features/srs
src/app/features/reporting
src/app/features/admin
```

Rules:

- keep components small;
- move API calls to services;
- use typed models;
- handle loading and error states;
- use route guards for UX only;
- never rely on frontend guards for real security;
- avoid direct `innerHTML`;
- avoid large UI libraries unless already present.

---

# 9. Security Rules

Mandatory:

- backend authorization for every protected operation;
- method-level security for sensitive actions;
- Bean Validation for all write requests;
- audit events for create/update/delete/status-change operations;
- no secrets in code;
- no stack traces in API responses;
- no SQL concatenation with user input;
- no broad CORS/CSRF disabling without explicit justification;
- no sensitive tokens in localStorage unless explicitly approved.

---

# 10. Database Rules

- Use Flyway for every schema change.
- Do not edit committed migrations.
- Add a new migration for every schema change.
- Keep schemas separated:
  - `core`
  - `eps`
  - `mms`
  - `wms`
  - `srs`
  - `audit`
  - `reporting`
- Add indexes for foreign keys.
- Add indexes for common filters.
- Prefer UUID primary keys.
- Store documents outside DB; store metadata, path, checksum, and version in DB.
- Audit tables must be append-only.

---

# 11. Testing Rules

Add tests when changing:

- business rules;
- status transitions;
- permissions;
- audit logic;
- DB queries;
- API contracts;
- cross-module workflows.

Preferred backend tests:

- service unit tests;
- controller tests;
- security tests;
- repository tests with Testcontainers for non-trivial queries.

Preferred frontend tests:

- component tests for key screens;
- service tests;
- route guard tests;
- form validation tests.

Do not add brittle tests just for coverage.

---

# 12. Definition of Done

A task is done only when:

- implementation is complete;
- backend authorization is enforced;
- state changes are audited;
- migrations are added if DB changed;
- relevant tests pass;
- OpenAPI is updated if API changed;
- frontend uses typed API models;
- no module boundaries are violated;
- README/docs are updated only when necessary.

---

# 13. Agent Response Format

Use this concise format:

```text
Implemented:
- ...

Changed files:
- ...

Tests:
- ...

Notes:
- ...
```

Do not include full file contents unless explicitly requested.

---

# 14. Default Decision Policy

When uncertain:

1. Choose the simplest production-safe option.
2. Follow existing project style.
3. Avoid new dependencies.
4. Prefer explicit code over abstraction.
5. Leave a short TODO only when truly necessary.
6. Ask for clarification only if implementation is blocked.
