# Futbol Clinic

Plataforma multi-tenant para gestión de escuelas de fútbol.

## Estructura del Proyecto

- `/backend`: API RESTful, Node.js, TypeScript, Express, PostgreSQL
- `/frontend`: Next.js, TypeScript, TailwindCSS
- `docker-compose.yml`: Orquestación de servicios (producción)
- `docker-compose.dev.yml`: Orquestación de servicios (desarrollo)

## 🚀 Inicio Rápido - Desarrollo

```bash
# Script helper (recomendado)
chmod +x dev.sh
./dev.sh start

# O con docker-compose directamente
docker-compose -f docker-compose.dev.yml up --build
```

**Backend**: http://localhost:4000  
**pgAdmin**: http://localhost:5050  
**PostgreSQL**: localhost:5432

📚 **Documentación Completa de Desarrollo**: [`README-DESARROLLO.md`](./README-DESARROLLO.md)

## 📖 Guías Disponibles

- **[README-DESARROLLO.md](./README-DESARROLLO.md)** - Guía principal de desarrollo
- **[INICIO-RAPIDO-DEV.md](./INICIO-RAPIDO-DEV.md)** - Inicio rápido en 3 pasos
- **[SOLUCION-SSL.md](./SOLUCION-SSL.md)** - Solución al error SSL de Docker
- **[backend/README-DEV.md](./backend/README-DEV.md)** - Documentación completa del backend

SuperAdmin
##########
superadmin@futbolclinic.com
admin123

Escuela Demo
------------
admin@escuelademo.com
admin123456
3292ecf6-aff2-43a6-995e-1c8c48d3a8a1