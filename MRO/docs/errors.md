# Unified API Error Standard

This document defines the unified API error handling standard and schema, HTTP status mapping rules, and error codes for the MRO/CMMS platform.

---

## 1. Unified Error Response Schema

All REST API errors are returned in a standard JSON format to ensure consistency across the Angular client.

```json
{
  "timestamp": "2026-05-24T21:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Asset tag already exists",
  "path": "/api/v1/eps/equipment",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Field Definitions

| Field Name | Type | Description |
|---|---|---|
| `timestamp` | String | ISO-8601 UTC timestamp of when the error occurred. |
| `status` | Integer | HTTP Status Code (e.g. `400`, `401`, `403`, `404`, `409`, `500`). |
| `error` | String | Standard HTTP status text (e.g. `Bad Request`, `Forbidden`). |
| `message` | String | Human-readable explanation of the specific validation or business logic failure. |
| `path` | String | The exact request URL path that triggered the error. |
| `requestId` | String | Correlation ID associated with the HTTP request context for troubleshooting logs. |

---

## 2. HTTP Status Code Mapping Matrix

| Scenario | HTTP Status | Description | Exception / Root Cause |
|---|---|---|---|
| **Validation Failures** | `400 Bad Request` | Form/DTO field validations, pattern mismatch, missing values, or sizes out of range. | `MethodArgumentNotValidException` |
| **Authentication Errors** | `401 Unauthorized` | Missing credentials, expired token, or invalid Basic Auth header. | `BadCredentialsException` / Spring Security filter |
| **Authorization Failures**| `403 Forbidden` | Authenticated user lacks required authorities (e.g. `MMS_COMPLETE`). | `AccessDeniedException` / `@PreAuthorize` guards |
| **Entity Not Found** | `404 Not Found` | Requesting a database item (work order, ticket, asset) that does not exist. | `ResponseStatusException` with `HttpStatus.NOT_FOUND` |
| **Concurrency / Conflict**| `409 Conflict` | Unique constraint violation (e.g. duplicated asset tag, double reservation). | `ResponseStatusException` with `HttpStatus.CONFLICT` |
| **Internal Failures** | `500 Internal Error`| Database connection failures, null pointers, unhandled server-side exceptions. | Unhandled `Exception` |

---

## 3. Platform Standard Error Codes & Messages

| Category | Logical Code | HTTP Status | Standard Message Example |
|---|---|---|---|
| **Security** | `ACCESS_DENIED` | 403 | "Access denied: Required authority missing." |
| **EPS** | `DUPLICATE_ASSET_TAG` | 409 | "Equipment assetTag already exists" |
| **EPS** | `EQUIPMENT_NOT_FOUND` | 404 | "Equipment not found" |
| **MMS** | `WORK_ORDER_NOT_FOUND` | 404 | "Work order not found" |
| **MMS** | `TRANSITION_DENIED` | 400 | "Transition from COMPLETED to PLANNED is not allowed" |
| **MMS** | `TASK_ALREADY_COMPLETED`| 400 | "Task is already completed" |
| **WMS** | `INSUFFICIENT_STOCK` | 400 | "Insufficient available stock for reservation" |
| **WMS** | `INACTIVE_PART` | 400 | "Cannot reserve inactive part" |
| **WMS** | `INACTIVE_WAREHOUSE` | 400 | "Cannot reserve in inactive warehouse" |
| **SRS** | `TICKET_NOT_FOUND` | 404 | "Ticket not found" |
| **SRS** | `MISSING_EQUIPMENT` | 400 | "Ticket must reference an equipment to create a work order" |
