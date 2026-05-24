# Database Migration Safety Rules

This document establishes the safety guidelines, locking mitigation strategies, index creation rules, and rollback policies for managing database schema migrations using Flyway.

---

## 1. Safety Policies

* **No Destructive Actions**: Dropping columns, dropping tables, or altering column types in a way that risks data truncation must be approved by the DB Lead and executed as a multi-step release.
* **Backward Compatibility**: Migrations must always keep the database backward-compatible with the currently running application code, enabling zero-downtime rolling deployments.

---

## 2. Table-Locking Prevention Guidelines

In large production databases, certain schema modifications can take exclusive locks on tables, causing transaction queues to build up and resulting in application outages.

### 2.1 Index Creation Strategy
* **Non-Blocking Indexing**: Adding indexes to tables with large datasets must be done concurrently to prevent locking:
  ```sql
  CREATE INDEX CONCURRENTLY idx_wo_tech_status ON mms.work_orders(technician_id, status);
  ```
* **Constraint**: In PostgreSQL, `CONCURRENTLY` cannot be run inside a transaction block. Set Flyway configuration option `outOfTransaction=true` for index-only migration scripts.

### 2.2 Adding Columns with Defaults
* **PostgreSQL 11+ Safety**: Columns added with a default value no longer require rewriting the table in PostgreSQL 11+:
  ```sql
  ALTER TABLE wms.stock_levels ADD COLUMN below_minimum BOOLEAN DEFAULT FALSE;
  ```
  This is now safe and fast.

---

## 3. Rollback & Migration Verification

* **Pre-Deployment Backup**: High-risk migrations require a full database snapshot before running the deployment pipeline.
* **Undo Scripts**: For every schema modification migration `Vxxx__desc.sql`, developers should draft an matching rollback script containing the raw SQL to undo the schema change, kept in the developer documentation logs.
