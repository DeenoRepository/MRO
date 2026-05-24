# Golden Path: Add an Audit Event

Use audit events for every state-changing operation.

## Required Fields

Audit event should include:

- timestamp;
- user id;
- module;
- action;
- entity type;
- entity id;
- old values when applicable;
- new values when applicable;
- request id;
- result.

## Naming

Use action names like:

```text
EPS_EQUIPMENT_CREATED
EPS_EQUIPMENT_UPDATED
MMS_WORK_ORDER_COMPLETED
WMS_STOCK_RESERVED
SRS_TICKET_RESOLVED
```

## Service Usage

Emit audit event from service layer, not controller.

## Failure Handling

Audit failure for critical operations should be visible.

Do not silently swallow audit write errors unless there is an explicitly designed fallback.
