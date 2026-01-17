# 🎯 Solución Completa - Error SSL en Docker

## ❌ Problema Original

```
Error: unable to get local issuer certificate
```

Este error ocurría durante `yarn install` en el Docker build.

## ✅ Solución Implementada

He creado una **configuración completa de desarrollo** que resuelve este problema.

### 🔧 Qué se Arregló

1. **Certificados CA**: Instalados y actualizados en Alpine Linux
2. **Configuración Yarn**: Ajustado para manejar SSL correctamente
3. **Network Timeout**: Aumentado para conexiones lentas
4. **Modo Desarrollo**: Hot-reload automático sin reconstruir

### 📦 Archivos Creados

```
✅ backend/Dockerfile.dev          - Imagen Docker para desarrollo
✅ docker-compose.dev.yml          - Orquestación completa
✅ backend/README-DEV.md           - Guía completa de desarrollo
✅ backend/.dockerignore.dev       - Optimización de build
✅ INICIO-RAPIDO-DEV.md            - Guía de inicio rápido
✅ dev.sh                          - Script helper (ejecutable)
```

## 🚀 Inicio Rápido

### Método 1: Script Helper (Más Fácil)

```bash
# Dar permisos de ejecución (solo primera vez)
chmod +x dev.sh

# Iniciar desarrollo
./dev.sh start
```

### Método 2: Docker Compose Directo

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Método 3: Docker Manual

```bash
cd backend
docker build -f Dockerfile.dev -t futbol-clinic-backend:dev .
docker run -d \
  --name futbol-backend-dev \
  -p 4000:4000 \
  -v $(pwd)/src:/app/src \
  -e DATABASE_URL="postgresql://postgres:postgres123@host.docker.internal:5432/futbol_clinic" \
  -e JWT_SECRET="dev-jwt-secret-at-least-32-characters-long" \
  futbol-clinic-backend:dev
```

## 🎮 Comandos del Script Helper

```bash
./dev.sh start         # Iniciar con logs visibles
./dev.sh start-bg      # Iniciar en background
./dev.sh stop          # Detener servicios
./dev.sh logs          # Ver logs en tiempo real
./dev.sh check         # Verificar que todo funciona
./dev.sh restart       # Reiniciar backend
./dev.sh clean         # Limpiar todo y empezar de cero
./dev.sh migrations    # Ejecutar migraciones
./dev.sh db            # Conectar a PostgreSQL
./dev.sh help          # Ver todos los comandos
```

## 🔍 Verificar que Funciona

```bash
# 1. Verificar health
curl http://localhost:4000/api/health
# Debe retornar: {"status":"ok"}

# 2. Verificar database
curl http://localhost:4000/api/db-test
# Debe retornar: {"dbTime":"2024-..."}

# 3. Ver servicios corriendo
./dev.sh status
# O: docker-compose -f docker-compose.dev.yml ps
```

## 🎨 Servicios Disponibles

| Servicio    | Puerto | URL                        | Descripción              |
|-------------|--------|----------------------------|--------------------------|
| Backend     | 4000   | http://localhost:4000      | API con hot-reload       |
| Database    | 5432   | postgresql://localhost:5432| PostgreSQL 15            |
| pgAdmin     | 5050   | http://localhost:5050      | Admin de base de datos   |
| Debug Port  | 9229   | -                          | Para VSCode debugging    |

### Credenciales pgAdmin
- **Email**: admin@futbolclinic.com
- **Password**: admin123

## 🔥 Hot Reload

Los cambios en `backend/src/` se detectan **automáticamente**:

1. Edita cualquier archivo `.ts` en `backend/src/`
2. Guarda el archivo (Cmd+S / Ctrl+S)
3. Espera ~1-2 segundos
4. ¡El servidor se reinicia automáticamente!

```bash
# Ver el hot-reload en acción
./dev.sh logs-backend
# Haz un cambio en src/app.ts y verás:
# "Restarting: src/app.ts has been modified"
```

## 🐛 Troubleshooting

### Si el SSL error persiste

```bash
# Limpiar cache de Docker
./dev.sh clean

# O manualmente:
docker builder prune -a
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Si el puerto está ocupado

```bash
# Detener servicios
./dev.sh stop

# Ver qué usa el puerto
lsof -i :4000

# Matar proceso si es necesario
kill -9 <PID>
```

### Si no se conecta a la base de datos

```bash
# Ver logs de la base de datos
docker-compose -f docker-compose.dev.yml logs database

# Reiniciar servicios
./dev.sh restart
```

### Si los cambios no se reflejan

```bash
# Verificar que los volúmenes están montados
docker inspect futbol_clinic_backend_dev | grep -A 10 Mounts

# Reiniciar backend
./dev.sh restart
```

## 📊 Comparación: Desarrollo vs Producción

| Característica        | Desarrollo (Dockerfile.dev) | Producción (Dockerfile)    |
|-----------------------|-----------------------------|----------------------------|
| Hot Reload            | ✅ Sí (ts-node-dev)         | ❌ No                      |
| Código como volumen   | ✅ Sí                       | ❌ No (copiado)            |
| Multi-stage build     | ❌ No (más simple)          | ✅ Sí (optimizado)         |
| Tamaño de imagen      | ~400MB                      | ~250MB                     |
| Tiempo de build       | ~2 min (primera vez)        | ~3 min                     |
| Debugging             | ✅ Puerto 9229 expuesto     | ❌ No                      |
| Seguridad             | ⚠️ Media (dev only)         | ✅ Alta (usuario no-root)  |
| Variables de entorno  | Definidas en compose        | Producción real            |

## 🎯 Flujo de Trabajo Recomendado

```bash
# 1. Iniciar servicios (solo una vez)
./dev.sh start-bg

# 2. Verificar que funciona
./dev.sh check

# 3. Ver logs si necesitas
./dev.sh logs-backend

# 4. Desarrollar normalmente
# Los cambios se reflejan automáticamente

# 5. Cuando termines
./dev.sh stop
```

## 📚 Documentación Adicional

- **`INICIO-RAPIDO-DEV.md`**: Guía de inicio de 3 pasos
- **`backend/README-DEV.md`**: Documentación completa de desarrollo
- **`backend/DOCKER-BUILD-GUIDE.md`**: Guía de troubleshooting Docker

## 💡 Tips Adicionales

### Ejecutar comandos dentro del contenedor

```bash
# Shell interactivo
docker-compose -f docker-compose.dev.yml exec backend sh

# Ejecutar comando específico
docker-compose -f docker-compose.dev.yml exec backend yarn --version
```

### Ver uso de recursos

```bash
docker stats
```

### Backup de base de datos

```bash
docker-compose -f docker-compose.dev.yml exec database \
  pg_dump -U postgres futbol_clinic > backup_$(date +%Y%m%d).sql
```

### Restore de base de datos

```bash
docker-compose -f docker-compose.dev.yml exec -T database \
  psql -U postgres -d futbol_clinic < backup.sql
```

## ✅ Checklist de Verificación

Después de iniciar, verifica:

- [ ] `./dev.sh check` muestra todos los servicios ✅
- [ ] `curl http://localhost:4000/api/health` retorna `{"status":"ok"}`
- [ ] `curl http://localhost:4000/api/db-test` retorna timestamp
- [ ] Puedes acceder a pgAdmin en http://localhost:5050
- [ ] Los cambios en código se reflejan automáticamente
- [ ] Los logs se muestran correctamente con `./dev.sh logs`

## 🎉 ¡Todo Listo!

Si todos los checks están ✅, tu entorno de desarrollo está funcionando perfectamente.

---

**¿Dudas?** Consulta `backend/README-DEV.md` para más detalles o ejecuta `./dev.sh help` para ver todos los comandos disponibles.

