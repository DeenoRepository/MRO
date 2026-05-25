# External Systems Integration Strategy

This document describes the architectural interfaces, protocols, payload formats, authentication mechanisms, and error retry strategies for integrations with external platforms.

---

## 1. Integration Interfaces & Protocols

| Integration System | Purpose | Protocol / Port | Auth Type | Ownership |
|---|---|---|---|---|
| **Enterprise ERP** | Syncing part inventory levels, costs, and assets. | REST HTTP / 443 | OAuth 2.0 Client Credentials | WMS / EPS |
| **SCADA / Telemetry**| Pulling running machine hours, telemetry limits. | MQTT/HTTP / 8883 | Token/SSL Client Cert | EPS / MMS |
| **LDAP / Active Directory** | User authentication and role sync. | LDAPS / 636 | Bind DN / Secret | Core |
| **SMTP Server** | Sending notifications, assignment emails. | SMTP / 587 | TLS / Username & Password | Core |

---

## 2. Integration Core Standards

To prevent integration errors from cascading and causing application thread exhaustion:

* **Connection Timeouts**: All outward calls must enforce strict HTTP client timeout limits:
  - Connection Timeout: $\le 2\text{ seconds}$
  - Read Timeout: $\le 5\text{ seconds}$
* **Mutual TLS (mTLS)**: High-security channels (e.g. SCADA and ERP sync) require TLS 1.3 with client certificates for device authentication.
* **Correlation ID Propagation**: The `requestId` must be forwarded in outbound HTTP headers:
  `X-Correlation-Id: <request_uuid>`

---

## 3. Resiliency, Retries, & Circuit Breakers

* **Retry Policy**: External requests use exponential backoff, capping at 3 retries (1s, 2s, 4s delays) before failing.
* **Circuit Breaker**: Use Spring Cloud Circuit Breaker (Resilience4j) on critical outbound calls.
  - **Threshold**: Trips if $> 50\%$ of calls fail over a sliding window of 10 requests.
  - **Fallback**: Returns fallback cached inventory status (WMS) or queues telemetry processing until SCADA reconnects.

---

## 4. Integration Protocol Details

### 4.1 SCADA Telemetry Ingestion
- **Trigger**: SCADA publishes telemetry events (e.g., operating hours limits).
- **Format**:
  ```json
  {
    "assetTag": "PUMP-001",
    "timestamp": "2026-05-24T21:00:00Z",
    "readingType": "OPERATING_HOURS",
    "value": 1520.5
  }
  ```
- **Action**: MMS captures this telemetry via an integration endpoint. If hours exceed PM thresholds, a work order is automatically generated.

### 4.2 LDAP Authentication Bind
- **Mechanism**: Standard Spring Security LDAP module binds users to the enterprise directory.
- **Group Mapping**: LDAP organizational units (OUs) mapped to Roles (e.g. `CN=MmsTechnician,OU=Roles` translates to `ROLE_MMS_TECHNICIAN` and matching authorities).
