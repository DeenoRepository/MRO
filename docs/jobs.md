# Scheduled Background Jobs Strategy

This document describes the scheduling, execution, error handling, retries, and monitoring strategy for automated background processes across the MRO/CMMS platform.

---

## 1. Monolith Scheduled Jobs Directory

All scheduled actions are run inside the monolithic server process using Spring Scheduler (`@Scheduled`) or standard cron-triggered threads.

| Job Name | Module | Default Schedule (Cron) | Idempotence Strategy | Monitoring Metric |
|---|---|---|---|---|
| **PM Work Order Gen** | `MMS` | `0 0 1 * * *` <br>(Daily at 01:00 AM) | Keyed by `pmScheduleId` + `dueDate` to avoid duplicates. | `mms.jobs.pm.generation.failures` |
| **Reservations Expiry**| `WMS` | `0 */15 * * * *` <br>(Every 15 minutes) | Process updates states from `RESERVED` to `RELEASED` using date check. | `wms.jobs.reservation.expiry` |
| **Notification Dispatch**| `Core` | `*/30 * * * * *` <br>(Every 30 seconds) | Process queue records (`PENDING` -> `SENT`), tracking attempt count. | `core.jobs.notifications.queue` |
| **Audit Log Digest** | `Audit`| `0 0 2 * * *` <br>(Daily at 02:00 AM) | Checksums computing on daily database blocks; append-only verify. | `audit.jobs.integrity.violations` |
| **Data Cleanup** | `Core` | `0 0 3 * * SUN` <br>(Sunday at 03:00 AM)| Purges older than 2 years of resolved logs/sessions. | `core.jobs.cleanup.deleted` |
| **Reports Refresh** | `Report`| `0 0 */4 * * *` <br>(Every 4 hours) | Refreshes materialized SQL views on the reporting db schema. | `reporting.jobs.views.refresh` |

---

## 2. Retry Policy & Failure Handling

To prevent permanent failures during brief network disruptions (e.g. database locks, brief SMTP outages), jobs must adhere to a standardized retry flow.

### Exponential Backoff Settings
* **Default Attempt Cap**: Max **3 retries** for business-critical jobs (like notification email dispatch).
* **Backoff Equation**:
  $$\text{Interval}(n) = \text{Initial Delay} \times \text{Multiplier}^{(n-1)}$$
  - Initial Delay: $2\text{ seconds}$
  - Multiplier: $2.0$ (Double delay on each failure)
  - Max Delay cap: $60\text{ seconds}$

### Recovery / Dead Letter Queue (DLQ)
- If a job fails after all retry attempts, it must write a status record of `FAILED` in the job ledger.
- An alert is immediately dispatched to system administrators.
- Database cleanups or report refreshes should skip intermediate failures and execute fresh on the next cycle.

---

## 3. Idempotency Policies

To guarantee that duplicate cron triggers do not cause data corruption (e.g., generating two identical preventive work orders):

* **Database Locking**: Use Spring's transactional locks or explicit SQL state validations (e.g. checking `lastGeneratedDate` inside the query) to lock rows during calculation.
* **State Check**: Ensure that state checks occur within the transaction boundary. For example, before expiring a reservation:
  ```sql
  UPDATE reservations 
  SET status = 'RELEASED', updated_at = NOW() 
  WHERE id = :id AND status = 'RESERVED' AND expires_at < NOW()
  ```
  This guarantees that only rows matching the state are affected.

---

## 4. Job Logging & Observability

Every job execution must print standard logs at start, finish, and failure:

```text
// Start of Job
[INFO] module=MMS action=PM_WORK_ORDER_GEN requestId=550e8400... message="Starting PM work order generation job"

// Success
[INFO] module=MMS action=PM_WORK_ORDER_GEN requestId=550e8400... latencyMs=1200 result=SUCCESS message="PM work order generation complete. Generated 14 work orders."

// Failure
[ERROR] module=MMS action=PM_WORK_ORDER_GEN requestId=550e8400... latencyMs=450 result=FAILURE message="PM work order generation failed. Database connection timeout."
```
