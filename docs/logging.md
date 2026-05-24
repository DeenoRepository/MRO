# Structured Logging Standard

This document defines the structured logging policies, schemas, levels, and security constraints for the modular monolith MRO/CMMS platform.

---

## 1. Structured Log Schema

To facilitate log aggregation (e.g. ELK stack, Grafana Loki), all application logs must be outputted in structured JSON format or standardized pattern fields.

### Core Log Fields

Every operational or API request log entry must include the following structured keys:

| Field Name | Type | Description | Example |
|---|---|---|---|
| `timestamp` | String | ISO-8601 UTC timestamp of log entry. | `"2026-05-24T21:03:00.123Z"` |
| `level` | String | Standard logging level (e.g. `INFO`, `ERROR`, `WARN`). | `"INFO"` |
| `requestId` | String | Correlation ID for tracing across request scope. | `"550e8400-e29b-41d4-a716-446655440000"` |
| `userId` | String | UUID or username of the performing actor. | `"user_admin"` |
| `module` | String | Source module name (`EPS`, `MMS`, `WMS`, `SRS`, `CORE`). | `"MMS"` |
| `action` | String | Logical action or API identifier. | `"WORK_ORDER_ASSIGN"` |
| `entityId` | String | Target entity UUID (optional, depending on context). | `"886f443b-7cc6-44b4-8451-229988220011"` |
| `latencyMs` | Long | Execution time in milliseconds (for end-of-request logs). | `45` |
| `result` | String | Status of the operation (`SUCCESS`, `FAILURE`, `DENIED`). | `"SUCCESS"` |
| `message` | String | Descriptive unstructured contextual message. | `"Successfully assigned technician to WO-102"` |

---

## 2. Correlation ID Propagation

* **Generation**: A unique `requestId` (UUID v4) must be generated at the ingress (e.g., in a Servlet Filter) if not already provided in the incoming HTTP request headers:
  `X-Request-Id: <uuid>`
* **MDC Context**: In Java/Kotlin, the correlation ID must be bound to the ThreadContext / SLF4J Mapped Diagnostic Context (MDC) so that all sequential statements within the execution thread inherit the same correlation ID automatically.
* **Response Header**: The request correlation ID must always be returned in the API response headers to allow simple debugging synchronization by the Angular frontend.

---

## 3. Logging Levels Guidelines

| Level | When to Use | Performance Impact |
|---|---|---|
| **ERROR** | Unhandled system failures, database connection loss, security system exceptions. Trigger paging alerts. | Minimal frequency, high severity. |
| **WARN** | Recoverable errors, retries, slow queries, access denied requests, validation rejects. | Low frequency, important diagnostics. |
| **INFO** | Business-critical lifecycle events (e.g. work order completion, asset creation, stock movement issues). | Standard frequency, production defaults. |
| **DEBUG** | Detailed request tracing, mapping outputs, query parameter configurations. | High frequency. Disabled in production. |
| **TRACE** | Fine-grained framework executions, step-by-step thread tracing. | Extreme frequency. Disabled by default. |

---

## 4. Security & Sanitization Rules (Forbidden Logs)

To prevent data leaks, compliance violations, or credential exposures, logging policies enforce the following constraints:

> [!CAUTION]
> **Strictly Forbidden Fields in Log Outputs:**
> 1. **Authentication Credentials**: Never log user passwords, Basic Auth tokens, JWTs, API secrets, or database credentials.
> 2. **Sensitive Signatures**: Never print raw cryptography parameters, signature hashes, or private key contents.
> 3. **Raw Upload Payload Data**: Never output raw binary payloads, multipart files, or large JSON string mappings of unstructured proposed change requests.
> 4. **PII (Personally Identifiable Information)**: Avoid logging sensitive personal data (e.g., personal phone numbers, bank details) unless absolutely necessary, and ensure masking is applied.

### Logging Sanitization Pattern Example

For DTO logging or exception handling, wrap parameters to prevent parameter leakage:
```kotlin
// Safely masking passwords in authentication failures
logger.warn("Authentication failed for user: {} | Password: [MASKED]", username)
```
