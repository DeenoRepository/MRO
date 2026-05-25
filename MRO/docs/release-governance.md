# Production Release Governance

This document establishes the official governance rules, checklists, validation procedures, and rollback operations for deploying versioned releases of the MRO/CMMS platform to the production environment.

---

## 1. Release Approval Workflow

Releases follow a structured gate process:

```text
[Dev Build & Test] ➔ [Staging Verification] ➔ [Change Control Approval] ➔ [Prod Deployment] ➔ [Smoke Tests]
```

* **Gate 1 (Staging Verification)**: The release must run on the Staging environment for at least 24 hours under synthetic load or QA review with zero critical errors.
* **Gate 2 (Change Control Approval)**: Requires sign-off from the Lead Engineer and the Operations Manager prior to setting the production deployment schedule.
* **Gate 3 (Production Window)**: Deployments must be scheduled during low-traffic operational windows (e.g. Sundays 02:00 - 04:00 AM).

---

## 2. Pre-Deployment Checklist

Before triggering the deployment pipeline, the release coordinator must complete these actions:

* **[ ] Schema Audit**: Confirm all database schema migrations (`db/migration/*.sql`) have unique, contiguous version prefixes (e.g. `V013__...`).
* **[ ] Backup Status**: Verify the automated nightly backup of the production database completed successfully within the last 12 hours.
* **[ ] Hot Rollback Plan**: Ensure the rollback SQL scripts (or Flyway undo instructions) are written, reviewed, and ready.
* **[ ] Dependency Sync**: Verify that external system coordinates (ERP endpoints, SMTP credentials) are set in the production environment settings.

---

## 3. Post-Deployment Verification (Smoke Tests)

Immediately after deployment completes, perform the following validation checks:

1. **Service Core Check**: Send a GET request to `/actuator/health` and verify the status is `"UP"`.
2. **UI Asset Delivery**: Load the main login dashboard and verify the Angular static files load with 200 OK.
3. **Database Reachability Check**: Ensure database queries execute successfully by verifying that the backend log does not print connection failures.
4. **Log Analysis**: Monitor production logs for 15 minutes post-deployment to ensure no unexpected exceptions occur.

---

## 4. Rollback Checklist (Emergency Rollback)

In the event of a catastrophic failure (e.g., app refuses to boot, critical integration returns 500 persistently, database migration locks tables), the coordinator must execute rollback procedures:

1. **De-route Traffic**: Direct traffic away from the affected servers to a maintenance page or backup instances.
2. **Revert Application Code**:
   - Revert the application container tag to the previous stable release version.
   - Restart instances to boot the last working image.
3. **Revert Database Schema**:
   - If migration caused data corruption, restore the database from the pre-deployment snapshot.
   - If it was a safe non-breaking migration (e.g., column addition), leave the schema structure intact and disable the faulty feature flag.
4. **Verify Rollback Status**: Run the verification smoke tests on the restored environment and redirect user traffic back.
