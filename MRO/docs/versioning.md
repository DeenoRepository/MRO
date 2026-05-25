# Versioning Strategy

This document defines the versioning guidelines, schemas, and policies across API routes, database migrations, document formats, and frontend packages.

---

## 1. REST API Versioning

* **Strategy**: **URL Path Versioning**. The API version prefix is embedded directly in the routing path.
* **Format**: `/api/v<major-version>/[module]/[resource]`
  - Current baseline version: `/api/v1/`
* **Breaking Changes**: Any change that modifies the JSON schema of request/response payloads in a non-backwards-compatible way (e.g. deleting fields, changing types) requires incrementing the path to `/api/v2/`.
* **Non-Breaking Changes**: Adding optional parameters or new attributes to the DTO is allowed within the current version.

---

## 2. Database Schema Migrations Versioning (Flyway)

* **Version Schema**: Sequential integer prefixes with zero-padding.
* **Format**: `V<three-digit-version>__<description>.sql`
  - Examples: `V001__init.sql`, `V012__extend_srs_schema.sql`
* **Rules**:
  - Version numbers must be consecutive. Missing numbers will trigger validation failures in Flyway.
  - Never edit or update a committed, applied database migration file. Any schema adjustments must be performed by creating a new migration file.

---

## 3. Frontend Package Versioning (npm)

* **Strategy**: Semantic Versioning (SemVer) `MAJOR.MINOR.PATCH`:
  - **MAJOR**: Incompatible API changes (e.g., major Angular upgrade).
  - **MINOR**: Add functionality in a backwards-compatible manner.
  - **PATCH**: Backwards-compatible bug fixes.
* **Package lock**: Keep `package-lock.json` committed to the repository to guarantee identical node package dependencies are resolved across developer environments and CI/CD runs.
