# Operational Domain Rules & Business Invariants

This document compiles the core operational business rules, data invariants, equations, and status logic implemented across the MRO/CMMS platform's modules.

---

## 1. Equipment Passportization System (EPS)

### 1.1 Configuration Change Control
* **Invariant**: Direct updates to equipment attributes (`name`, `category`, `location`, `manufacturer`, `model`, `serialNumber`, `installDate`) or registration of new assets must be routed through the Change Request workflow.
* **Payload Validation**:
  - For `CREATE` change requests, the proposed payload must map strictly to `CreateEquipmentRequest`.
  - For `UPDATE` change requests, the proposed payload must map strictly to `UpdateEquipmentRequest`, and the target `entityId` must exist.
* **Auto-Application**: Once approved by an authority (`EPS_APPROVE`), changes are automatically applied to the equipment database, and the status of the Change Request transitions to `APPROVED`.

### 1.2 Asset Tag Uniqueness
* **Invariant**: Every equipment item in the registry must have a unique `assetTag`. Duplicate tags are rejected with a `409 CONFLICT` error.

### 1.3 Asset Deactivation
* **Rule**: Deactivating an equipment transitions its status to `INACTIVE`. Deactivation is a logical update and does not perform physical row deletion.

---

## 2. Maintenance Management System (MMS)

### 2.1 Preventive Maintenance Schedule Calculation
* **Rule**: PM schedules automatically trigger work orders when the current date meets or exceeds the `nextDueDate`.
* **Execution Interval**: Work order generation calculates the next due date by adding the configured frequency value to the current due date:
  $$\text{Next Due Date} = \text{Current Due Date} + (\text{Frequency Value} \times \text{Frequency Unit})$$
  Where frequency unit is one of `DAYS`, `WEEKS`, or `MONTHS`.

### 2.2 Work Order Completion Checklist Invariant
* **Rule**: Changing a Work Order status to `COMPLETED` requires a non-blank `completionAct` JSON payload detailing all checklist tasks.
* **Task Auto-Signoff**: Any remaining tasks in `OPEN` state are automatically updated to `COMPLETED` with the completion timestamp when the parent work order is completed.
* **Security Validation**: The signature hash of the completed work order is calculated using SHA-256 over the entire `completionAct` payload:
  $$\text{signatureHash} = \text{SHA-256}(\text{completionAct})$$

---

## 3. Warehouse Management System (WMS)

### 3.1 Inventory Quantities Equations
* **Stock Ledger Calculations**:
  - **QuantityOnHand**: Total physical count of parts present in the warehouse.
  - **QuantityReserved**: Count of parts committed to work orders or other references but not yet physically shipped/issued.
  - **QuantityAvailable**: Net available stock that can be allocated for new reservations or transfers.
  
  $$\text{Quantity Available} = \text{Quantity On Hand} - \text{Quantity Reserved}$$

* **Safety Stock / Minimum stock alert**:
  $$\text{belowMinimum} = \text{Quantity On Hand} < \text{minStockLevel}$$

### 3.2 Part Reservations Invariants
* **Limit Check**: A new reservation request for $Q_{req}$ is validated against the available stock:
  $$Q_{req} \le \text{Quantity Available}$$
* **Deactivated Entities**: Reservations cannot be created for inactive parts (`isActive = false`) or in inactive warehouses (`isActive = false`).
* **Auto-Expiration**: Active reservations exceeding their `expiresAt` timestamp are set to `RELEASED` by a cron-triggered function to free up reserved quantities back to available stock.

### 3.3 Warehouse Transfers Lifecycle Invariants
* **Quantity Check**: Warehouse transfers require the requested quantity to be physically present in the source warehouse:
  $$Q_{transfer} \le \text{Source QuantityOnHand}$$
* **State Transition Rules**:
  - **DRAFT**: Initial creation. Quantity is not reserved yet.
  - **REQUESTED**: Submitted for approval. Transfer quantity is reserved in the source warehouse.
  - **APPROVED**: Approved by a manager. Reserved quantity remains locked.
  - **IN_TRANSIT**: Shipped from the source warehouse. Source `quantityOnHand` and `quantityReserved` are decremented.
  - **COMPLETED**: Arrived at target warehouse. Target `quantityOnHand` is incremented. Status transitions to `COMPLETED`.

---

## 4. Service Request System (SRS)

### 4.1 SLA Calculation
* **Rule**: The Service Level Agreement (SLA) due date is calculated automatically upon ticket submission based on the selected `RequestType` config:
  $$\text{dueAt} = \text{openedAt} + \text{slaHours}$$
  Where `slaHours` is defined in the `RequestType` configuration.

### 4.2 Ticket Comment Security & Visibility
* **Rule**: Comments posted on tickets can be marked as `isInternal = true`. 
  - Internal comments are filtered out on endpoints for external users.
  - Visible only to agent roles possessing the `SRS_ASSIGN`, `SRS_RESOLVE`, or `SRS_WRITE` authorities.

### 4.3 Ticket-to-Work-Order Integration
* **Rule**: Tickets requiring maintenance intervention are converted into corrective work orders.
  - The ticket must contain a valid `equipmentId`.
  - A work order is generated in the MMS module with code `WO-[TICKET_PREFIX]` and linked bidirectionally.
  - Resolving or closing the work order does not automatically resolve the ticket; the ticket owner must confirm the resolution.
