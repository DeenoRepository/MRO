# Demo and Seed Data Specifications

This document defines the standard seed data, demo user profiles, inventory items, and mock maintenance tickets used to bootstrap development, testing, and staging environments.

---

## 1. Demo User Profiles

To verify Role-Based Access Control (RBAC) permissions matrix rules, standard user profiles are seeded in the Core database schema:

| Username | Password (PlainText) | Assigned Roles | Core Authority |
|---|---|---|---|
| `admin` | `admin` | `SYSTEM_ADMIN` | All permissions |
| `eps_mgr` | `eps_mgr` | `EPS_MANAGER` | `EPS_READ`, `EPS_WRITE`, `EPS_APPROVE` |
| `mms_mgr` | `mms_mgr` | `MMS_MANAGER` | `MMS_READ`, `MMS_WRITE`, `MMS_ASSIGN`, `MMS_COMPLETE`, `MMS_CANCEL` |
| `tech_john`| `tech_john` | `MMS_TECHNICIAN`| `MMS_READ`, `MMS_START`, `MMS_COMPLETE` |
| `wms_mgr` | `wms_mgr` | `WMS_MANAGER` | `WMS_READ`, `WMS_PART_MANAGE`, `WMS_RESERVE`, `WMS_CONSUME` |
| `custodian`| `custodian` | `WAREHOUSE_CUSTODIAN`| `WMS_READ`, `WMS_CONSUME`, `WMS_STOCK_RECEIVE`, `WMS_STOCK_ISSUE` |
| `srs_mgr` | `srs_mgr` | `SRS_MANAGER` | `SRS_READ`, `SRS_WRITE`, `SRS_ASSIGN`, `SRS_RESOLVE` |
| `srs_agent`| `srs_agent` | `SRS_AGENT` | `SRS_READ`, `SRS_WRITE`, `SRS_ASSIGN`, `SRS_RESOLVE` |
| `auditor` | `auditor` | `AUDITOR` | `AUDIT_READ` |

---

## 2. Seed Assets & Equipment (EPS)

Seeded equipment items in the equipment registry:

| Asset Tag | Name | Category | Status | Serial Number |
|---|---|---|---|---|
| `HVAC-01` | Main Facility Chiller | HVAC | `ACTIVE` | `SN-CH-9921` |
| `PUMP-02` | Boiler Feedwater Pump | PUMPS | `ACTIVE` | `SN-PUMP-883` |
| `CONV-03` | Packaging Line Conveyor | CONVEYORS | `ACTIVE` | `SN-CONV-771` |
| `GEN-04` | Emergency Diesel Generator| POWER | `ACTIVE` | `SN-GEN-5541` |

---

## 3. Seed Warehouses & Parts Catalog (WMS)

### 3.1 Warehouses
- **Code**: `WH-MAIN` | **Name**: Central Maintenance Depot | **Type**: MAIN
- **Code**: `WH-BUFF` | **Name**: Production Floor Buffer Stock | **Type**: BUFFER

### 3.2 Parts Catalog
- **Part Number**: `PART-BRG-20` | **Name**: Ball Bearing 20mm | **Unit**: PCS | **Min Stock**: 10
- **Part Number**: `PART-BELT-A`| **Name**: V-Belt Type A | **Unit**: PCS | **Min Stock**: 5
- **Part Number**: `PART-OIL-5W`| **Name**: Synthetic Engine Oil | **Unit**: LITERS | **Min Stock**: 50

### 3.3 Initial Stock Levels
- `WH-MAIN` holds 50 of `PART-BRG-20` and 100 of `PART-OIL-5W`.
- `WH-BUFF` holds 10 of `PART-BELT-A`.

---

## 4. Mock Maintenance Tickets (SRS)

Initial service tickets seeded to verify ticketing dashboard operations:

* **Ticket**: `TKT-001`
  - **Title**: Facility Chiller temperature fluctuation.
  - **Priority**: HIGH
  - **Status**: OPEN
  - **Equipment Link**: `HVAC-01`
* **Ticket**: `TKT-002`
  - **Title**: Conveyor belt slip on包装 line.
  - **Priority**: MEDIUM
  - **Status**: ASSIGNED
  - **Equipment Link**: `CONV-03`
  - **Assignee**: `srs_agent`
