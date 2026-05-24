# Repository Map

## Root

```text
mro-platform/
├── backend/
├── frontend/
├── deploy/
├── docs/
├── AGENTS.md
└── README.md
```

---

# Backend

```text
backend/
├── build.gradle.kts
├── settings.gradle.kts
└── src/
    ├── main/
    │   ├── kotlin/com/company/mro/
    │   │   ├── core/
    │   │   ├── eps/
    │   │   ├── mms/
    │   │   ├── wms/
    │   │   ├── srs/
    │   │   ├── audit/
    │   │   ├── notification/
    │   │   ├── reporting/
    │   │   └── shared/
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── db/migration/
    └── test/
```

---

# Backend Module Layout

Each business module should follow:

```text
module/
├── api/
├── application/
├── domain/
├── dto/
└── persistence/
```

Meaning:

| Directory | Purpose |
|---|---|
| `api` | REST controllers |
| `application` | services, use cases, transactions |
| `domain` | domain models, enums, business rules |
| `dto` | request/response DTOs |
| `persistence` | JPA entities, repositories, mappers |

---

# Frontend

```text
frontend/
├── package.json
├── angular.json
└── src/app/
    ├── core/
    ├── shared/
    ├── features/
    │   ├── eps/
    │   ├── mms/
    │   ├── wms/
    │   ├── srs/
    │   ├── reporting/
    │   └── admin/
    └── app.routes.ts
```

---

# Deploy

```text
deploy/
├── docker/
├── nginx/
└── systemd/
```

---

# Docs

```text
docs/
├── ARCHITECTURE.md
├── REPOSITORY_MAP.md
├── DEVELOPMENT_GUIDE.md
├── GLOSSARY.md
├── conventions.yaml
├── adr/
└── examples/
```
