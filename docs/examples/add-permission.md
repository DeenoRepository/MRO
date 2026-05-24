# Golden Path: Add a Permission

## 1. Define Permission

Use format:

```text
MODULE_ACTION
```

Examples:

```text
EPS_READ
EPS_WRITE
MMS_COMPLETE
WMS_RESERVE
SRS_RESOLVE
```

## 2. Add Seed Migration

Add permission in Flyway seed/reference data migration.

Do not hardcode permission only in code.

## 3. Map to Roles

Assign permission to appropriate default roles.

## 4. Enforce in Backend

Use Spring Security.

Example:

```kotlin
@PreAuthorize("hasAuthority('EPS_WRITE')")
```

## 5. Reflect in Frontend

Use role/permission information only for UI visibility.

Do not treat frontend checks as security.

## 6. Test

Add security test for access allowed and access denied cases.
