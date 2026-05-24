# MRO Platform Monorepo (Initial Skeleton)

Initial skeleton only:

- `backend/` Spring Boot 3 + Kotlin + Flyway configuration
- `frontend/` Angular placeholder structure
- `docker-compose.yml` with PostgreSQL 16

## Local Run

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Run backend:

```bash
cd backend
gradle bootRun
```

3. Verify backend:

- Health: `http://localhost:8080/actuator/health`
- OpenAPI: `http://localhost:8080/v3/api-docs`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Secured endpoint: `http://localhost:8080/api/v1/core/me` (Basic Auth `viewer/viewer` or `admin/admin`)

4. Frontend placeholder:

```bash
cd frontend
npm run start
```
