# Notification Architecture & Alert Rules

This document describes the notification subsystem, event-driven triggers, dispatch channels, template standardizations, and alert rules for the MRO/CMMS platform.

---

## 1. Notification Event Routing Matrix

Notifications are triggered by state changes or scheduler events and dispatched to users based on their roles.

| Event / Notification Type | Triggering Source | Default Channel | Recipients | Priority |
|---|---|---|---|---|
| **Work Order Assignment** | MMS Status -> `ASSIGNED` | In-App / Email | Assigned Technician | Medium |
| **Ticket Assignment** | SRS Status -> `ASSIGNED` | In-App / Email | Assigned SRS Agent | Medium |
| **Approval Request** | EPS ChangeRequest -> `PENDING` | Email | EPS Managers | High |
| **Low Stock Alert** | WMS StockLevel -> `belowMinimum` | In-App | Warehouse Custodians | Medium |
| **PM Overdue Alert** | MMS Scheduler -> due date breach | Email | Maintenance Managers | High |
| **Critical Asset Incident** | SRS Ticket -> `CRITICAL` priority | Email / In-App | Maintenance & Plant Managers | Urgent |

---

## 2. Dispatch Channels

* **In-App Notifications**: Displayed in the Angular frontend dashboard header. Messages are stored in the database (`core.notifications` ledger) and can be marked as `READ` / `UNREAD`.
* **Email (SMTP)**: Dispatched asynchronously via the background thread pool. Integrates with the company's SMTP mail transfer agent.
* **SMS Integration (Future)**: Prepared via interface abstractions (`SmsNotificationProvider`) for urgent alerts.

---

## 3. Standard Email Templates

All email notifications must follow standard templates defined in the system's template service.

### Template 1: Work Order Assignment (`mms-wo-assignment`)
* **Subject**: `[MRO Alert] New Work Order Assigned: ${woNumber}`
* **Body HTML**:
  ```html
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
    <h2 style="color: #2b5797;">Work Order Assignment</h2>
    <p>Hello <strong>${technicianName}</strong>,</p>
    <p>You have been assigned to execute the following maintenance work order:</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
      <tr><td style="padding: 5px; font-weight: bold;">WO Number:</td><td>${woNumber}</td></tr>
      <tr><td style="padding: 5px; font-weight: bold;">Asset:</td><td>${equipmentName} (${assetTag})</td></tr>
      <tr><td style="padding: 5px; font-weight: bold;">Priority:</td><td><span style="color: red;">${priority}</span></td></tr>
      <tr><td style="padding: 5px; font-weight: bold;">Scheduled Date:</td><td>${scheduledDate}</td></tr>
    </table>
    <p style="margin-top: 20px;">Please log in to the MRO dashboard to start the work execution.</p>
  </div>
  ```

### Template 2: Change Request Approval (`eps-cr-approval`)
* **Subject**: `[MRO Approval] Equipment Change Request Pending Review: ${crId}`
* **Body HTML**:
  ```html
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
    <h2 style="color: #e2a100;">Pending Approval</h2>
    <p>Hello EPS Manager,</p>
    <p>A new technical configuration change request has been submitted and requires your review:</p>
    <ul>
      <li><strong>Change Type:</strong> ${changeType}</li>
      <li><strong>Entity Class:</strong> ${entityType}</li>
      <li><strong>Requested By:</strong> ${requesterName}</li>
    </ul>
    <p>Please log in to the EPS console to Approve or Reject these changes.</p>
  </div>
  ```

### Template 3: Low Stock Warning (`wms-stock-warning`)
* **Subject**: `[MRO Alert] Warehouse Inventory Alert: Low Stock for ${partNumber}`
* **Body HTML**:
  ```html
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
    <h2 style="color: #d9534f;">Inventory Alert</h2>
    <p>Hello Warehouse Custodian,</p>
    <p>The inventory level for part <strong>${partName} (${partNumber})</strong> has fallen below the safety threshold:</p>
    <ul>
      <li><strong>Warehouse:</strong> ${warehouseCode} - ${warehouseName}</li>
      <li><strong>Current Quantity:</strong> ${quantityOnHand} ${unit}</li>
      <li><strong>Safety Minimum:</strong> ${minStockLevel} ${unit}</li>
    </ul>
    <p>Please initiate a procurement or warehouse transfer request.</p>
  </div>
  ```
