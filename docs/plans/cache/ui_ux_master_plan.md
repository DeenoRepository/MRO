# UI/UX Master Plan — MRO Platform

## Scope

This document defines UI/UX implementation requirements for:

- EPS — Equipment Passportization System
- MMS — Maintenance Management System
- WMS — Warehouse Management System
- SRS — Service Request System

The goal is to create a consistent enterprise-grade operational interface optimized for:

- desktop-first workflows;
- industrial usage;
- high information density;
- low cognitive load;
- fast operator interaction;
- keyboard-friendly workflows;
- future tablet support.

---

# 1. Global UI/UX Principles

## 1.1 Design Goals

The platform UI must prioritize:

- operational efficiency;
- readability;
- predictable workflows;
- low-click navigation;
- data clarity;
- audit visibility;
- accessibility;
- responsive layout;
- consistent behavior across modules.

The system is not marketing software.

It is an operational enterprise application.

---

# 2. Design Language

## 2.1 Visual Style

Use:

- clean enterprise design;
- neutral colors;
- high contrast;
- restrained animations;
- compact data density;
- large readable tables.

Avoid:

- flashy animations;
- excessive whitespace;
- card-heavy consumer UI;
- trendy dashboards;
- unnecessary gradients.

---

# 3. Layout System

## 3.1 Application Layout

```text
┌────────────────────────────────────────────┐
│ Top Navigation Bar                         │
├──────────────┬─────────────────────────────┤
│ Side Menu    │ Main Content Area           │
│              │                             │
│              │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
```

---

# 4. Global Navigation

## 4.1 Top Navigation

Top bar must contain:

- application name;
- environment label;
- global search;
- notifications;
- current user;
- logout;
- quick actions.

---

## 4.2 Sidebar Navigation

Modules:

```text
Dashboard
EPS
MMS
WMS
SRS
Reports
Administration
```

Sidebar requirements:

- collapsible;
- keyboard accessible;
- icon + text;
- role-aware visibility;
- persistent expanded/collapsed state.

---

# 5. Global Search

## Requirements

Global search must support:

- equipment;
- work orders;
- tickets;
- parts;
- warehouses.

Search behavior:

- instant suggestions;
- keyboard navigation;
- open entity directly;
- recent searches.

---

# 6. Global UX Rules

## Required UX Behavior

All modules must support:

- pagination;
- sorting;
- filtering;
- column resizing;
- table export;
- loading states;
- empty states;
- error states;
- optimistic UX only when safe;
- confirmation dialogs for destructive actions.

---

# 7. Responsive Rules

## Desktop

Primary target:

```text
1920x1080
```

Minimum supported width:

```text
1366px
```

---

## Tablet

Tablet support required for:

- technicians;
- warehouse operators.

Key workflows must remain functional at:

```text
1024px width
```

---

# 8. Accessibility

Required:

- keyboard navigation;
- focus states;
- ARIA labels;
- screen-reader compatibility;
- sufficient contrast;
- accessible forms;
- error descriptions.

---

# 9. Common UI Components

## Required Shared Components

```text
DataTable
SearchBar
FilterPanel
StatusBadge
PriorityBadge
UserSelector
DateRangePicker
AuditTimeline
AttachmentUploader
EntityLink
ConfirmationDialog
ToastNotifications
PaginationControls
```

---

# 10. Status Color Rules

## Work Status

```text
OPEN            -> blue
IN_PROGRESS     -> orange
WAITING         -> yellow
COMPLETED       -> green
CANCELLED       -> gray
CRITICAL        -> red
```

Colors must remain accessible.

Do not rely on color alone.

---

# 11. Form UX Rules

## Required Behavior

Forms must:

- validate inline;
- show field-level errors;
- preserve draft state when possible;
- support keyboard navigation;
- avoid modal overload;
- group fields logically.

---

# 12. Table UX Rules

All large entities must use advanced tables.

Required features:

```text
sorting
filtering
pagination
column visibility
sticky header
sticky actions column
CSV export
row click navigation
bulk selection
```

---

# 13. Notification UX

Notifications must support:

- success;
- warning;
- error;
- informational.

Notification center should include:

- work order assignments;
- overdue PM;
- ticket assignment;
- low stock alerts;
- approval requests.

---

# 14. Audit Visibility

All critical entities must expose:

```text
Created by
Created at
Updated by
Updated at
Recent changes
Audit timeline
```

---

# 15. Dashboard Strategy

Dashboards must prioritize:

- actionable information;
- operational alerts;
- current workload;
- exceptions.

Avoid vanity metrics.

---

# 16. EPS UI/UX Plan

## 16.1 EPS Goal

Fast equipment discovery and equipment lifecycle management.

---

## 16.2 EPS Main Navigation

```text
Equipment
Categories
Documents
Change Requests
History
```

---

## 16.3 Equipment List Page

### Required Features

```text
search
pagination
sorting
status filter
category filter
location filter
manufacturer filter
QR search
barcode search
```

### Table Columns

```text
Asset Tag
Name
Status
Category
Location
Manufacturer
Model
Serial Number
Updated At
```

### UX Rules

- row click opens details;
- quick copy asset tag;
- colored status badge;
- inline quick filters;
- save filter presets.

---

## 16.4 Equipment Details Page

### Layout

```text
Header
Tabs:
- Overview
- Documents
- History
- Change Requests
- Maintenance
- Tickets
```

### Overview Tab

Show:

- metadata;
- identifiers;
- location;
- lifecycle status;
- QR code;
- linked entities.

### Documents Tab

Features:

- upload;
- version history;
- preview;
- checksum info.

### History Tab

Timeline of:

- changes;
- status transitions;
- approvals;
- document uploads.

---

## 16.5 Equipment Create/Edit

### UX Requirements

- step-based layout if complex;
- grouped sections;
- inline validation;
- duplicate asset tag detection;
- autosave draft optional.

---

## 16.6 Change Requests UI

### Required Features

```text
pending queue
approve/reject
diff viewer
approval comments
dual approval indicator
```

---

# 17. MMS UI/UX Plan

## 17.1 MMS Goal

Fast maintenance operations and technician workflows.

---

## 17.2 MMS Navigation

```text
Work Orders
PM Schedules
Tasks
Assignments
Completion Acts
History
```

---

## 17.3 Work Orders List

### Required Features

```text
kanban/table toggle
priority filter
technician filter
equipment filter
status filter
date filter
bulk assignment
bulk export
```

### Table Columns

```text
WO Number
Equipment
Priority
Status
Technician
Scheduled Date
Created At
```

### UX Rules

- critical work highlighted;
- overdue work visible;
- quick status actions;
- quick assignment.

---

## 17.4 Work Order Details

### Layout

```text
Header
Tabs:
- Overview
- Tasks
- Parts
- Timeline
- Completion
- Attachments
```

### Tasks Tab

Features:

- checklist;
- drag reorder;
- progress indicator.

### Parts Tab

Features:

- reserve parts;
- consume parts;
- stock visibility;
- reservation status.

### Timeline Tab

Show:

- status changes;
- technician actions;
- maintenance history.

---

## 17.5 PM Schedules UI

### Required Features

```text
calendar view
list view
next due indicator
overdue indicator
frequency editor
```

---

## 17.6 Technician UX

### Technician Mode

Optimized simplified UI:

- larger controls;
- tablet-friendly;
- quick completion;
- quick notes;
- offline-ready foundation.

---

# 18. WMS UI/UX Plan

## 18.1 WMS Goal

Fast warehouse operations with minimal clicks.

---

## 18.2 WMS Navigation

```text
Warehouses
Parts
Stock Levels
Reservations
Transfers
Movements
```

---

## 18.3 Parts List

### Required Features

```text
search
low stock filter
warehouse filter
manufacturer filter
active filter
```

### Table Columns

```text
Part Number
Name
Available
Reserved
Minimum Level
Warehouse Count
```

### UX Rules

- low stock highlighted;
- stock availability visible immediately;
- reservation quick actions.

---

## 18.4 Warehouse Details

### Tabs

```text
Overview
Stock
Movements
Transfers
Reservations
```

---

## 18.5 Stock Movements UI

### Required Features

```text
receive stock
issue stock
adjustment
transfer
movement history
```

### UX Rules

- barcode scanner compatible;
- keyboard-first workflows;
- warehouse operator optimized.

---

## 18.6 Reservations UI

### Required Features

```text
reserve
release
consume
expiration visibility
linked work order
```

---

## 18.7 Transfer UI

### Workflow

```text
draft
approve
in transit
complete
```

Visualize transfer status clearly.

---

# 19. SRS UI/UX Plan

## 19.1 SRS Goal

Fast incident and request management.

---

## 19.2 SRS Navigation

```text
Tickets
Assignments
Request Types
Comments
Integrations
```

---

## 19.3 Ticket List

### Required Features

```text
search
priority filter
status filter
assignee filter
SLA breach filter
equipment filter
```

### Table Columns

```text
Ticket Number
Title
Priority
Status
Assignee
Equipment
Opened At
Due At
```

### UX Rules

- overdue tickets highlighted;
- SLA breach visible;
- quick assign;
- quick status change.

---

## 19.4 Ticket Details

### Tabs

```text
Overview
Comments
Attachments
Work Order
History
```

### Comments

Features:

- threaded comments optional;
- internal/public separation;
- rich text minimal support.

---

## 19.5 Ticket Creation UX

### Requirements

- minimal required fields;
- smart defaults;
- equipment autocomplete;
- request type templates.

---

## 19.6 Work Order Integration UX

### Features

```text
Create MMS work order
View linked work order
Track maintenance status
```

---

# 20. Reporting UI/UX

## Goal

Operational visibility.

---

## Required Reports

```text
Open work orders
Overdue PM
Low stock
Ticket backlog
Equipment by status
```

---

## Reporting UX Rules

- export support;
- filter persistence;
- fast loading;
- read-only views.

---

# 21. Notification Center UX

## Categories

```text
Assignments
Approvals
Overdue items
Critical failures
Low stock
Maintenance alerts
```

---

# 22. Mobile/Tablet UX

## Priority Mobile Workflows

### MMS

- complete work order;
- add notes;
- upload attachment.

### WMS

- barcode scanning;
- stock issue;
- reservation consume.

### SRS

- create ticket;
- add comment;
- assign ticket.

---

# 23. Offline UX Foundation

Future-ready requirements:

- local draft persistence;
- retry queue;
- reconnect synchronization indicators.

---

# 24. Performance UX Rules

Target UX timings:

```text
page load < 2 sec
table filter < 500 ms
search suggestions < 300 ms
navigation transition < 150 ms
```

---

# 25. Error UX Rules

Errors must:

- explain what failed;
- explain what user can do;
- avoid technical jargon;
- expose request ID for support.

---

# 26. Empty State UX

Empty states must:

- explain why list is empty;
- provide next action;
- include create CTA where applicable.

---

# 27. UX Security Rules

Sensitive actions must require:

- confirmation;
- permission check;
- visible audit awareness.

Examples:

```text
cancel work order
deactivate equipment
consume inventory
approve change request
```

---

# 28. UI Technology Recommendations

## Angular

Recommended:

```text
Angular latest LTS
Angular Material (carefully customized)
CDK tables
RxJS
Signals where appropriate
```

---

## Avoid

```text
heavy dashboard libraries
excessive animations
multiple competing component systems
```

---

# 29. Design System

Create reusable design system:

```text
Typography
Spacing
Colors
Status badges
Buttons
Tables
Forms
Dialogs
Notifications
```

Single source of truth required.

---

# 30. Definition of Done — UI/UX

UI feature is complete only when:

- responsive;
- keyboard accessible;
- validated;
- role-aware;
- loading states exist;
- error states exist;
- empty states exist;
- audit metadata visible;
- API integrated;
- tested;
- accessible;
- visually consistent.
