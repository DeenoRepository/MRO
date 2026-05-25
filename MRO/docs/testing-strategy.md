# Testing Strategy & Pyramid

This document defines the testing architecture, layers, mocking guidelines, Testcontainers execution policies, coverage objectives, and testing best practices for the MRO/CMMS platform.

---

## 1. The MRO Testing Pyramid

The testing strategy is organized to ensure fast local developer feedback and reliable integration verification:

```text
       /\
      /  \      E2E Tests (Selenium/Playwright/Cypress) -> Validate full flows
     /----\
    /      \    Integration / Security Tests (@SpringBootTest/MockMvc) -> Verify APIs & boundaries
   /--------\
  /          \  Repository Tests (@DataJpaTest + Testcontainers) -> Validate queries/migrations
 /------------\
/   Unit      \ Service / Entity Unit Tests (MockK/Mockito) -> Core business rules
--------------
```

---

## 2. Test Layer Guidelines

### 2.1 Service Unit Tests (MockK / Mockito)
* **Goal**: Validate business rules, invariants, and transitions in isolation.
* **Mocking Policy**: Mock all external dependencies (repositories, cross-module lookup services, audits).
* **Execution Time**: Fast ($\le 10\text{ ms}$ per test case).

### 2.2 Repository Tests (Testcontainers)
* **Goal**: Validate custom SQL queries and query methods against a real database instance rather than H2.
* **Testcontainers Policy**: Use the official PostgreSQL test container.
* **Execution**: Disabled by default in quick local builds, run as part of the integration test suite in CI.

### 2.3 API Security & Web Integration Tests (`MockMvc`)
* **Goal**: Validate REST controllers authorization rules (`@PreAuthorize`) and serialization/deserialization schemas.
* **WebMvcTest Context**: Use `@WebMvcTest` + `@Import` to pull in the security configs and exception handlers:
  ```kotlin
  @WebMvcTest(TicketController::class)
  @Import(SecurityConfig::class, GlobalExceptionHandler::class)
  class TicketControllerSecurityTest { ... }
  ```

---

## 3. Coverage & Quality Gates

* **Minimum Coverage**: Core business logic packages (services, validation logic) must achieve a **minimum of 80% line coverage**.
* **Critical Focus Areas**:
  - State machine transitions (work order completion, reservation releases).
  - Security configuration paths (401 and 403 response validations).
  - Business equations (SLA calculation hours, WMS stock quantity available checks).

---

## 4. Flaky Test Mitigation Policy

* **No sleep statements**: Avoid using `Thread.sleep()` to wait for asynchronous tasks. Use conditional await utilities (e.g. `awaitility` library).
* **Test Isolation**: Ensure database cleanup script runs between test class executions (e.g. using transactional `@Rollback` annotations) to prevent state leaks.
