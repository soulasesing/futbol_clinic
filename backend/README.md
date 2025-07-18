# Backend - Futbol Clinic

API RESTful multi-tenant para gestión de escuelas de fútbol.

## Stack
- Node.js + TypeScript + Express
- PostgreSQL (multi-tenant, RLS)
- Docker

## Inicio rápido

```bash
docker-compose up --build
```

## Estructura
- `src/` código fuente
- `migrations/` scripts SQL
- `docs/` documentación OpenAPI
- `tests/` pruebas Jest

## Variables de entorno
- `DATABASE_URL` conexión a PostgreSQL

## Multi-tenant
- Cada request opera bajo un `tenant_id` aislado
- RLS y triggers en PostgreSQL 