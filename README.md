# MRO Platform Monorepo (Initial Skeleton)

Current status:

- `backend/` Spring Boot 3 + Kotlin + Flyway modules (Core, EPS, MMS, WMS, SRS + Audit)
- `frontend/` Angular placeholder structure
- `docker-compose.yml` with PostgreSQL 16, backend container, and Nginx reverse proxy

## Local Run

1. Start full local stack:

```bash
docker compose up --build
```

2. Verify services:

- Backend health: `http://localhost:8080/actuator/health`
- OpenAPI: `http://localhost:8080/v3/api-docs`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Nginx frontend placeholder: `http://localhost/`
- Nginx API proxy: `http://localhost/api/v1/core/me` (Basic Auth `viewer/viewer` or `admin/admin`)
