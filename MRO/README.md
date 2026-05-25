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

## systemd Deployment (Linux)

Artifacts:

- `deploy/systemd/mro-backend.service`
- `deploy/systemd/mro-backend.env.example`

Minimal rollout:

1. Build backend JAR (for example: `backend/build/libs/*.jar`) and place it at `/opt/mro/backend/app.jar`.
2. Copy env template to `/etc/mro/mro-backend.env` and set real DB credentials.
3. Install systemd unit to `/etc/systemd/system/mro-backend.service`.
4. Reload and start:
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable --now mro-backend`
5. Health check:
   - `curl http://127.0.0.1:8080/actuator/health`
6. Logs:
   - `journalctl -u mro-backend -f`

Flyway migrations are applied automatically on backend startup.
