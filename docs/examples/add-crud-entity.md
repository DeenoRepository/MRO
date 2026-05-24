# Golden Path: Add a CRUD Entity

Use this process when adding a simple CRUD entity.

## 1. Migration

Add a new Flyway migration.

Include:

- table;
- primary key;
- foreign keys;
- indexes;
- constraints.

## 2. Persistence

Create:

- JPA entity;
- repository;
- mapper if needed.

## 3. DTOs

Create:

- create request DTO;
- update request DTO;
- response DTO.

Do not expose entities directly.

## 4. Service

Create service methods:

- list;
- get by id;
- create;
- update;
- deactivate/delete.

Add transaction boundaries.

## 5. Controller

Create thin REST controller.

Use module API prefix:

```text
/api/v1/{module}/{resource}
```

## 6. Security

Add permission checks.

Use method-level security for sensitive operations.

## 7. Audit

Emit audit events for:

- create;
- update;
- delete/deactivate;
- status changes.

## 8. Tests

Add focused tests for:

- service logic;
- validation;
- permissions;
- audit event emission.
