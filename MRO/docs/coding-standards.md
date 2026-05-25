# Coding Standards & Project Structure

This document establishes the official coding standards, naming conventions, directory structure patterns, and database migration rules for the MRO/CMMS platform codebase.

---

## 1. Directory & Package Naming

The codebase is organized as a modular monolith. Package names must use lowercase and represent the module and layer boundaries.

### Package Structure Patterns
```text
com.company.mro
├── core/                # Core platform configs, exceptions, logging standard
├── audit/               # Append-only audit logs system
│   ├── api/             # REST Controllers
│   ├── application/     # Services
│   ├── persistence/     # JPA Entities & Repositories
│   └── dto/             # Data Transfer Objects
├── eps/                 # Equipment Passportization System module
├── mms/                 # Maintenance Management System module
├── wms/                 # Warehouse Management System module
└── srs/                 # Service Request System module
```

---

## 2. Naming Conventions

### 2.1 Kotlin Classes & Interfaces
* **Controllers**: Must end with `Controller` (e.g. `TicketController.kt`).
* **Services**: Must end with `Service` (e.g. `ReservationService.kt`).
* **Repositories**: Must end with `Repository` and inherit from `JpaRepository` or custom interfaces (e.g. `PartRepository.kt`).
* **JPA Entities**: Must end with `Entity` to explicitly distinguish database schema models from DTOs (e.g. `EquipmentEntity.kt`).
* **Enums**: PascalCase representing logical enum lists (e.g. `WorkOrderStatus.kt`).

### 2.2 Data Transfer Objects (DTOs)
* **Create Requests**: Prefix with `Create` and suffix with `Request` (e.g. `CreatePartRequest`).
* **Update Requests**: Prefix with `Update` and suffix with `Request` (e.g. `UpdateWarehouseRequest`).
* **Action Requests**: Suffix with `Request` matching the action name (e.g. `AssignTicketRequest`).
* **Response DTOs**: Suffix with `Response` (e.g. `TicketResponse`, `TaskResponse`).

### 2.3 REST Endpoints (URL Pathing)
* **Naming**: Plural nouns using lowercase kebab-case.
* **Prefix**: Versioned via `/api/v1/` prefix.
* **Examples**:
  - `/api/v1/wms/stock-movements`
  - `/api/v1/mms/pm-schedules`

### 2.4 Database Migrations (Flyway)
* **Naming Pattern**:
  `V<three-digit-version>__<description>.sql`
* **Rules**:
  - Version numbers must increment sequentially (e.g., `V001`, `V002`, `V012`).
  - Descriptions must use lowercase with underscores (e.g., `V012__extend_srs_schema.sql`).
  - Editing committed migrations is strictly forbidden.

### 2.5 Tests
* **Naming**: Suffix with `Test` matching target class name (e.g. `TicketServiceTest.kt`).
* **Methods**: Descriptive camelCase or backtick sentences mapping exact behavior:
  - `fun `should calculate SLA due date when ticket is created`()`
