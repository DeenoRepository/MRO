# Reporting Model & Analytics

This document defines the key performance indicators (KPIs), analytical queries, materialized database views, refresh cycles, and export constraints for the Reporting Platform module.

---

## 1. Key Performance Indicators (KPIs)

The system computes operational metrics to monitor maintenance efficiency, inventory health, and service levels.

### 1.1 Maintenance & Asset KPIs
* **Mean Time to Repair (MTTR)**: Measures average time required to complete corrective work orders.
  $$\text{MTTR} = \frac{\sum (\text{completedDate} - \text{startedAt})}{\text{Count of Completed Corrective Work Orders}}$$
* **Mean Time Between Failures (MTBF)**: Measures asset operating hours reliability.
  $$\text{MTBF} = \frac{\sum (\text{Asset Operational Telemetry Hours})}{\text{Count of Corrective Work Orders for Asset}}$$

### 1.2 Inventory KPIs
* **Stock Turnover Rate**: Measures efficiency of inventory usage.
  $$\text{Stock Turn} = \frac{\text{Value of Issued Parts (last 12 months)}}{\text{Average Stock Value (last 12 months)}}$$
* **Safety Threshold Breaches Frequency**: Count of stock levels that dropped below safety limits:
  $$\text{belowMinimum} = \text{true}$$

### 1.3 Service Desk KPIs
* **SLA Breach Rate**: Percentage of tickets resolved or closed past their due date.
  $$\text{SLA Breach \%} = \frac{\text{Count of Resolved Tickets where } \text{resolvedAt} > \text{dueAt}}{\text{Total Count of Resolved Tickets}} \times 100$$

---

## 2. Materialized Database Views

To avoid execution of slow analytical aggregate queries on the active transactions DB, calculations are run over materialized views under the `reporting` schema.

| Materialized View Name | Refresh Interval | Primary Query Source Tables | Description |
|---|---|---|---|
| `reporting.mv_asset_reliability` | Every 4 hours | `mms.work_orders`, `eps.equipment` | Computes MTTR and counts of corrective/preventive jobs per asset. |
| `reporting.mv_stock_turnover` | Every 24 hours | `wms.stock_movements`, `wms.stock_levels` | Calculates monthly turnover metrics. |
| `reporting.mv_sla_compliance` | Every 1 hour | `srs.tickets`, `srs.request_types` | Aggregates SLA breaches and resolution times per category. |

---

## 3. Data Export Governance

* **Export Formats**: Standard reports can be exported via REST API as CSV or Microsoft Excel (`.xlsx`) files.
* **Size Cap**: Exports are restricted to a maximum of **10,000 records** per request to prevent out-of-memory errors on the application server. Large logs must be exported via background batch jobs.
