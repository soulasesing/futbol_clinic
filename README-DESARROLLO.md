# 🎯 Desarrollo con Docker - Futbol Clinic

## ⚠️ IMPORTANTE - Base de Datos Externa

Este proyecto usa **tu base de datos PostgreSQL existente** (no se levanta una nueva).

**Antes de iniciar**, configura `DATABASE_URL` en `docker-compose.dev.yml`:

```yaml
DATABASE_URL: postgresql://TU_USUARIO:TU_PASSWORD@host.docker.internal:5432/futbol_clinic
```

📚 **Guía completa**: [`CONFIGURACION-BD-EXTERNA.md`](./CONFIGURACION-BD-EXTERNA.md)

---

## 🚀 Inicio Super Rápido (3 Comandos)

```bash
# 1. Dar permisos al script
chmod +x dev.sh

# 2. Iniciar desarrollo
./dev.sh start

# 3. Verificar que funciona
curl http://localhost:4000/api/health
```

✅ **Listo!** Tu backend está corriendo con hot-reload en http://localhost:4000

---

## 📁 Archivos Creados para Ti

```
✅ backend/Dockerfile.dev       → Imagen Docker para desarrollo
✅ docker-compose.dev.yml       → Orquestación DB + Backend + pgAdmin
✅ dev.sh                       → Script helper con comandos útiles
✅ INICIO-RAPIDO-DEV.md         → Guía rápida de 3 pasos
✅ SOLUCION-SSL.md              → Explicación del problema SSL resuelto
✅ backend/README-DEV.md        → Documentación completa
```

---

## 🎮 Comandos Principales

```bash
./dev.sh start         # ▶️  Iniciar servicios
./dev.sh stop          # ⏹️  Detener servicios
./dev.sh logs          # 📋 Ver logs
./dev.sh check         # ✅ Verificar que funciona
./dev.sh restart       # 🔄 Reiniciar backend
./dev.sh clean         # 🧹 Limpiar todo
./dev.sh help          # ❓ Ver todos los comandos
```

---

## 🌐 Servicios Disponibles

| Servicio | URL | Notas |
|----------|-----|-------|
| **Backend API** | http://localhost:4000 | Con hot-reload |
| **PostgreSQL** | Tu BD externa | Configurar en DATABASE_URL |

---

## 🔥 Hot Reload Automático

1. Edita código en `backend/src/`
2. Guarda (Cmd+S)
3. Espera 1-2 segundos
4. ¡Cambios aplicados automáticamente!

```bash
# Ver el hot-reload en acción
./dev.sh logs-backend
```

---

## ✅ Verificación Rápida

```bash
# Health check
curl http://localhost:4000/api/health
# ✅ {"status":"ok"}

# Database test
curl http://localhost:4000/api/db-test
# ✅ {"dbTime":"2024-..."}

# Estado de servicios
./dev.sh status
# ✅ Lista de contenedores corriendo
```

---

## 🐛 Problemas Comunes

### Puerto ocupado
```bash
./dev.sh stop
lsof -i :4000
```

### SSL Error persiste
```bash
./dev.sh clean
./dev.sh start
```

### Base de datos no conecta
```bash
docker-compose -f docker-compose.dev.yml logs database
./dev.sh restart
```

---

## 📚 Documentación Detallada

- **`CONFIGURACION-BD-EXTERNA.md`** → Configurar tu PostgreSQL existente
- **`INICIO-RAPIDO-DEV.md`** → 3 pasos para iniciar
- **`SOLUCION-SSL.md`** → Problema SSL explicado y resuelto
- **`backend/README-DEV.md`** → Guía completa con todos los detalles

---

## 💡 Tips

### Ver instrucciones de migraciones
```bash
./dev.sh migrations
# Muestra cómo ejecutar migraciones en tu BD externa
```

### Ver instrucciones para conectar a PostgreSQL
```bash
./dev.sh db
# Muestra opciones para conectar a tu BD externa
```

### Ver uso de recursos
```bash
docker stats
```

### Backup de base de datos
```bash
# Usar tu contenedor PostgreSQL externo
docker exec NOMBRE_CONTENEDOR pg_dump -U postgres futbol_clinic > backup.sql
```

---

## 🎯 Flujo de Trabajo

```
┌─────────────────┐
│  ./dev.sh start │  ← Iniciar (solo una vez)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Desarrollar    │  ← Editar código
│  en backend/src │  ← Cambios automáticos
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ./dev.sh check  │  ← Verificar
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ./dev.sh stop  │  ← Detener al terminar
└─────────────────┘
```

---

## 🎉 ¡Listo para Desarrollar!

Ejecuta `./dev.sh start` y comienza a programar. Los cambios se reflejan automáticamente.

**¿Necesitas ayuda?** Ejecuta `./dev.sh help` o consulta `backend/README-DEV.md`

