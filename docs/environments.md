# Environment Matrix

This document defines the configuration matrix across all deployment environments (Local, Dev, Test, Staging, Production) for the MRO/CMMS platform.

---

## 1. Environment Configuration Matrix

| Attribute / Config | Local | Dev | Test (CI) | Staging | Production |
|---|---|---|---|---|---|
| **Purpose** | Offline developer workspace | Internal development & demo | Automated CI test runs | Pre-production testing | Production workload |
| **Auth Mode** | Basic Auth (InMemory) | Basic Auth / LDAP | Mock/Disabled | LDAP / OpenID Connect | LDAP / OpenID Connect |
| **Database** | Docker PostgreSQL 16 | RDS / Cloud PostgreSQL 16 | Embedded/Testcontainers | Shared Cloud PostgreSQL 16 | HA Cluster PostgreSQL 16 |
| **Flyway Strategy** | Auto-migrate on start | Auto-migrate on start | Auto-migrate on start | CD pipeline validation | CD pipeline gate + manual |
| **Logging Level** | `DEBUG` | `INFO` | `WARN` | `INFO` | `INFO` (JSON format) |
| **Secrets Store** | Application properties | HashiCorp Vault / Env vars | Env vars / mock | Vault / AWS Secrets Mgr | Vault / AWS Secrets Mgr |
| **TLS Config** | Disabled (HTTP) | Self-signed HTTPS | Disabled | Valid CA TLS 1.3 | Valid CA TLS 1.3 (mTLS) |
| **SCADA Mock** | Yes (Simulated events) | Yes (Telemetry gen) | No (Disabled) | Real (Staging endpoints) | Real (Production endpoints) |
| **Observability** | Console logger / Actuator | Actuator / Prometheus | None | Prometheus / Grafana / Jaeger | Prometheus / Grafana / Jaeger |

---

## 2. Environment Details & Profiles

We map these configurations to Spring Boot **Active Profiles**:

### 2.1 Local Environment (`profile: local`)
- Developers compile and test locally using Docker Compose (`docker-compose.yml`) containing PostgreSQL and PgAdmin.
- Uses `InMemoryUserDetailsManager` with standard `admin` / `viewer` credentials.

### 2.2 Dev/Staging Environment (`profile: dev` / `profile: staging`)
- Deployed continuously via the pipeline to staging servers.
- Database runs on a cloud-managed service.
- Logs are exported to a central logging aggregator.

### 2.3 Production Environment (`profile: prod`)
- Runs in high-availability mode with multiple app servers behind Nginx.
- Memory thresholds, thread pools, and pool sizes are tuned:
  - Spring Datasource Pool (`maximum-pool-size`): 50 connections.
  - Active heap configurations tuned for production workload.
- Strict telemetry monitoring is enabled, and any actuator diagnostic actions (like `/actuator/heapdump`) are disabled for security.
