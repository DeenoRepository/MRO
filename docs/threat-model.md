# Application Threat Model & Security Controls

This document details the threat analysis, vulnerability vectors, and implemented/planned mitigations across the EPS, MMS, WMS, SRS, and Core modules.

---

## 1. STRIDE Threat Categorization & Mitigations

### 1.1 Spoofing Identity
* **Threat**: Attacker accesses the API using forged or stolen credentials to impersonate a technician or manager.
* **Mitigations**:
  - Enforce standard HTTP Basic Auth over TLS (HTTPS only).
  - Credentials must not be stored in cleartext. Backend uses BCrypt/noop for passwords in memory (Spring Security).
  - Session/request timeout on inactivity.

### 1.2 Tampering with Data
* **Threat**: Malicious user intercepting network packets or writing direct modifications to DB tables (e.g. bypassing service layer).
* **Mitigations**:
  - Database schema borders. Services in WMS must not call EPS repository directly.
  - Hashing payload: Work Order Completion acts are hashed with SHA-256 (`signatureHash`) to prevent alteration of signs/completion notes.
  - Strict input validation using Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`) on all controllers.

### 1.3 Repudiation
* **Threat**: User denies performing a state-changing transaction (e.g., deactivating a critical asset or issuing stock).
* **Mitigations**:
  - **Audit Platform**: Immutable log repository recording all state change operations with timestamp, actor userId, correlation `requestId`, and target entity ID.
  - Audit tables are configured as append-only.

### 1.4 Information Disclosure
* **Threat**: Requester accesses sensitive comments (internal ticket remarks) or technical documents they are not authorized to view.
* **Mitigations**:
  - **Internal Comments Filtering**: Spring Security evaluates authority before returning internal comments:
    ```kotlin
    val canViewInternal = authentication.authorities.any { it.authority in listOf("SRS_ASSIGN", "SRS_RESOLVE", "SRS_WRITE") }
    ```
  - Error messages sanitization: Stack traces are suppressed from REST API error responses (handled by `GlobalExceptionHandler`).

### 1.5 Denial of Service (DoS)
* **Threat**: Attacker floods file upload endpoints with massive attachments to exhaust disk space/memory, or loops request endpoints.
* **Mitigations**:
  - Max upload boundaries (10MB for EPS documents, 5MB for SRS attachments) checked at ingress.
  - Core pagination model enforced on search endpoints.

### 1.6 Elevation of Privilege
* **Threat**: Technician bypasses UI controls and calls `/api/v1/eps/change-requests/approve` directly.
* **Mitigations**:
  - **Backend-First Authorization**: Every REST endpoint is protected with method-level security (`@PreAuthorize("hasAuthority(...)")`).
  - Web UI guards are used strictly for UX convenience, not security.

---

## 2. Threat Specific Mitigation Table

| Threat Vector | Source / Target | Severity | Implemented Mitigation |
|---|---|---|---|
| **SQL Injection** | REST Search Queries | Critical | Use Spring Data JPA Named Parameters / Hibernate Parameter Binding. Raw SQL string concatenation is forbidden. |
| **Malicious Attachments (XSS/RCE)** | SRS Attachment / EPS Document Upload | High | Restrict allowed MIME types (PDF, JPG, PNG, DOCX, ZIP). Check original filenames for path traversal (`../`). |
| **SSRF (Server-Side Request Forgery)** | SCADA / ERP Integrations | High | Outbound requests from backend integration services restricted to whitelist IPs/domains. |
| **Session Fixation** | Core login endpoints | Medium | Spring Security session regeneration upon authentication. |
| **Audit Logs Modification** | Audit Schema | High | DB user roles restrictions (app user has INSERT privilege only on `audit_log` tables). |
