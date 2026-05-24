# Observability & Monitoring Strategy

This document defines the metrics collection, tracing integration, logging aggregations, health check endpoints, and alert configurations for the MRO/CMMS platform.

---

## 1. Metrics Standard (Micrometer & Spring Actuator)

The backend exposes runtime metrics under `/actuator/prometheus` for Prometheus scraping.

### Core Metrics Table

| Metric Name | Type | Target Scope | Alert Threshold | Description |
|---|---|---|---|---|
| `http.server.requests.latency` | Timer / Histogram | HTTP Ingress | $> 500\text{ ms}$ (p95) | HTTP endpoint request durations. |
| `http.server.requests.errors` | Counter | HTTP Ingress | $> 1\%$ of traffic | Count of 5xx HTTP response codes. |
| `hikaricp.connections.active` | Gauge | Database Pool | $> 80\%$ of pool | Count of active JDBC connections. |
| `hikaricp.connections.timeout` | Counter | Database Pool | $> 0$ in 5 minutes | Count of connection timeouts. |
| `executor.active` | Gauge | Task Executers | $> 90\%$ pool capacity | Active threads in background job pool. |
| `mms.jobs.failures` | Counter | MMS Scheduler | $> 0$ | Count of failed background cron jobs. |
| `wms.stock.below.minimum` | Gauge | WMS Inventory | Notification warning | Count of part levels below safety minimums. |

---

## 2. Distributed Tracing Readiness (OpenTelemetry)

While running as a modular monolith, the application uses **OpenTelemetry (OTel)** instrumentation to trace logical calls between modules.

* **Trace Context Propagation**: Core Filters intercept incoming requests and initialize the OpenTelemetry tracer context.
* **Correlation ID**: The `requestId` is attached as a span attribute (`mro.request_id`) and matching database traces.
* **Module Span Boundaries**:
  - Direct service calls across modules (e.g. `SRS -> MMS` work order creation) are encapsulated within nested OTel span tags to measure module boundaries boundaries.

---

## 3. Health Checks & Diagnostics

Spring Boot Actuator endpoints are exposed for deployment orchestrators:

* **Liveness Probe** (`/actuator/health/liveness`): Returns `UP` when JVM is running.
* **Readiness Probe** (`/actuator/health/readiness`): Evaluates:
  - Database connectivity (e.g., executing validation query `SELECT 1`).
  - Disk space availability (for file uploads).
  - Internal cache states.

---

## 4. Alert Routing Policy

Prometheus Alertmanager routing criteria for infrastructure and application alerts:

| Severity | Target Channel | Description | Example Alert |
|---|---|---|---|
| **Critical** | Pager / SMS | Immediate service outage or threat. | Database connection pool fully exhausted. |
| **Warning** | Slack / Email | Degradation, approaching caps, or minor errors. | Latency targets exceeding 1000ms. |
| **Info** | Logs / Dashboards | Operational logs. | PM Generation completed with warnings. |
