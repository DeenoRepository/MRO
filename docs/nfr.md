# Non-Functional Requirements (NFR) & Operations

This document defines the core operational targets, non-functional requirements (NFRs), constraints, and performance objectives for the modular monolith MRO/CMMS platform.

---

## 1. Capacity & Performance Metrics

### 1.1 Concurrency & Throughput
* **Concurrent Active Users**: The platform must support up to **500 concurrent active users** (technicians, warehouse custodians, managers) without degrading performance.
* **Peak Request Rate**: System design must sustain a peak load of **50 Requests Per Second (RPS)** on API endpoints.

### 1.2 Response Time Targets (Latency SLA)
All API response targets must be maintained under standard peak load conditions:

| Request Category | Target Latency (p95) | Target Latency (p99) | Notes |
|---|---|---|---|
| **Simple Queries (GET)** | $\le 100\text{ ms}$ | $\le 250\text{ ms}$ | Listing assets, inventory levels, search index. |
| **Command Operations (POST/PUT)** | $\le 200\text{ ms}$ | $\le 500\text{ ms}$ | Creating work orders, adding comments, reservations. |
| **Heavy Integration (Integration)** | $\le 500\text{ ms}$ | $\le 1500\text{ ms}$ | Creating WO from ticket, processing complex state changes. |
| **Document Download** | $\le 800\text{ ms}$ | $\le 2000\text{ ms}$ | Serving attachments (up to 10MB) via stream. |

---

## 2. Platform Availability & Service Level Objectives (SLO)

* **Uptime Target**: The system SLA target is **99.9% availability** ($24\text{h}/7\text{d}/365\text{d}$ operations), allowing maximum $8.76\text{ hours}$ of unscheduled downtime per year.
* **Scheduled Maintenance Window**: Performed during off-peak hours (e.g. Sunday 02:00 - 04:00 local time). Maximum monthly allocation of $2\text{ hours}$.

---

## 3. Storage & Sizing Invariants

### 3.1 Database Capacity Projections
* **Expected Database Sizing**:
  - Year 1: $\approx 20\text{ GB}$ (excluding file storage).
  - Year 5: $\approx 100\text{ GB}$ (excluding file storage).
* **Indexing Strategy**: Indexes must be maintained for all primary keys, foreign keys, and frequently queried search parameters (e.g., `assetTag`, `woNumber`, `ticketNumber`, `partNumber`).

### 3.2 Audit Log Retention Policy
* **Data Classification**: Audit records (`audit` schema) are immutable and append-only.
* **Online Retention**: Maintain audit trails online in the active database for **2 years**.
* **Cold Archival**: Periodically export log records older than 2 years to a cold storage solution (compressed JSON/CSV archives), retaining them for a total of **7 years** to satisfy compliance requirements.

### 3.3 File Upload Limits
* **Maximum Upload Size**:
  - Technical equipment documents: **10 MB per file** max.
  - Ticket attachments: **5 MB per file** max.
* **Storage Location**: Metadata is stored in the database; physical file content is stored outside the database.

---

## 4. High Availability (HA) & Disaster Recovery (DR)

### 4.1 Backup Expectations
* **Backup Type**: Automated daily logical backups (using `pg_dump` or equivalent tool).
* **Retention of Backups**:
  - Daily backups: Retained for 14 days.
  - Weekly backups: Retained for 5 weeks.
  - Monthly backups: Retained for 1 year.
* **Offsite Storage**: Backups must be securely transferred to a separate physical environment or cloud bucket.

### 4.2 Recovery Objectives
* **Recovery Point Objective (RPO)**: $\le 24\text{ hours}$ (maximum acceptable data loss in catastrophic failure).
* **Recovery Time Objective (RTO)**: $\le 4\text{ hours}$ (time required to restore service to normal operation).

### 4.3 High Availability Requirements
* **Database HA**: PostgreSQL configured with a secondary standby replica using streaming replication.
* **App Server redundancy**: Monolithic application instances deployed behind a load balancer (e.g. Nginx or equivalent) to distribute requests and handle failure of an application instance gracefully.
