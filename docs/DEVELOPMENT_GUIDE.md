# Development Guide

## Local Development

Expected local workflow:

```bash
docker compose up -d postgres
cd backend
./gradlew bootRun
```

Frontend:

```bash
cd frontend
npm install
npm start
```

---

# Backend Commands

Build:

```bash
cd backend
./gradlew clean build
```

Run tests:

```bash
cd backend
./gradlew test
```

Run only relevant tests when possible.

---

# Frontend Commands

Install:

```bash
cd frontend
npm install
```

Build:

```bash
cd frontend
npm run build
```

Test:

```bash
cd frontend
npm test
```

Lint:

```bash
cd frontend
npm run lint
```

---

# Migration Policy

Use Flyway for all DB changes.

Rules:

1. Do not edit committed migrations.
2. Add a new migration for every schema change.
3. Keep migrations small.
4. Include indexes with new foreign keys.
5. Seed reference permissions and roles through migrations.

Migration naming:

```text
V001__create_core_schema.sql
V002__create_eps_schema.sql
V003__create_mms_schema.sql
```

---

# API Policy

All APIs follow:

```text
/api/v1/{module}/{resource}
```

All request bodies use DTOs.

All responses use DTOs.

Do not expose entities directly.

---

# Security Policy

For new backend endpoints:

1. Require authentication.
2. Add permission check.
3. Validate input.
4. Emit audit event for state changes.
5. Add a security test for sensitive operations.

---

# Testing Policy

Add tests for:

- service logic;
- status transitions;
- permissions;
- audit events;
- non-trivial repository queries;
- cross-module workflows.

Do not write broad brittle tests that only assert framework behavior.

---

# Documentation Policy

Update docs only if:

- architecture changes;
- module boundary changes;
- public API changes;
- deployment changes;
- developer workflow changes.

Do not add verbose documentation for obvious code.
