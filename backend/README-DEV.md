# 🚀 Guía de Desarrollo - Futbol Clinic Backend

## 📋 Problema Resuelto

✅ **SSL Certificate Error**: Solucionado mediante CA certificates y configuración de yarn  
✅ **Modo Desarrollo**: Hot-reload automático con ts-node-dev  
✅ **Multi-tenant**: Base de datos PostgreSQL con RLS  

## 🏃 Inicio Rápido

### Opción 1: Docker Compose (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose -f docker-compose.dev.yml up --build

# La primera vez puede tardar 2-3 minutos
# Luego de construir, los cambios se reflejan automáticamente
```

Esto iniciará:
- ✅ PostgreSQL en puerto 5432
- ✅ Backend con hot-reload en puerto 4000
- ✅ pgAdmin en puerto 5050 (opcional)

### Opción 2: Docker Manual

```bash
# 1. Construir la imagen de desarrollo
cd backend
docker build -f Dockerfile.dev -t futbol-clinic-backend:dev .

# 2. Ejecutar el contenedor (asegúrate de tener PostgreSQL corriendo)
docker run -d \
  --name futbol-backend-dev \
  -p 4000:4000 \
  -p 9229:9229 \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/public:/app/public \
  -e DATABASE_URL="postgresql://postgres:postgres123@host.docker.internal:5432/futbol_clinic" \
  -e JWT_SECRET="dev-jwt-secret-at-least-32-characters-long" \
  -e NODE_ENV="development" \
  futbol-clinic-backend:dev

# 3. Ver logs en tiempo real
docker logs -f futbol-backend-dev
```

### Opción 3: Local (Sin Docker)

```bash
cd backend

# Instalar dependencias
yarn install

# Crear archivo .env.local
cp .env.dev.example .env.local
# Editar .env.local con tus configuraciones

# Iniciar en modo desarrollo
yarn dev

# El servidor se reiniciará automáticamente al guardar cambios
```

## 🔍 Verificar que Funciona

```bash
# 1. Health check
curl http://localhost:4000/api/health
# Respuesta esperada: {"status":"ok"}

# 2. Database test
curl http://localhost:4000/api/db-test
# Respuesta esperada: {"dbTime":"2024-..."}

# 3. Ver logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

## 🛠️ Características del Modo Desarrollo

### Hot Reload Automático
- ✅ Los cambios en `/src` se detectan automáticamente
- ✅ El servidor se reinicia en ~1-2 segundos
- ✅ No necesitas reconstruir la imagen Docker

### Debugging
- Puerto 9229 expuesto para debugging con VSCode o Chrome DevTools
- Sourcemaps habilitados para debugging de TypeScript

### Base de Datos
- PostgreSQL con migraciones automáticas en el inicio
- pgAdmin disponible en http://localhost:5050
  - Email: admin@futbolclinic.com
  - Password: admin123

### Volúmenes Montados
```
./backend/src      → /app/src       (código fuente)
./backend/public   → /app/public    (uploads)
node_modules       → volumen Docker (no sobreescribir desde host)
```

## 📂 Estructura de Archivos Docker

```
backend/
├── Dockerfile.dev           # Dockerfile para desarrollo (este usa)
├── Dockerfile              # Dockerfile para producción
├── Dockerfile.npm          # Alternativa con NPM
├── .dockerignore           # Archivos excluidos del build
├── .env.dev.example        # Ejemplo de variables de entorno
├── docker-compose.dev.yml  # Orquestación para desarrollo
└── README-DEV.md          # Esta guía
```

## 🐛 Solución de Problemas

### Error: "unable to get local issuer certificate"

✅ **Solucionado en Dockerfile.dev** mediante:
- Instalación de ca-certificates
- Actualización de certificados
- Configuración de yarn sin strict-ssl

Si aún tienes el error:
```bash
# Limpiar cache de Docker
docker builder prune -a

# Reconstruir sin cache
docker-compose -f docker-compose.dev.yml build --no-cache backend
```

### Error: Puerto 4000 ya en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :4000

# Detener contenedor existente
docker-compose -f docker-compose.dev.yml down

# O matar el proceso
kill -9 <PID>
```

### Error: No se puede conectar a la base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker-compose -f docker-compose.dev.yml ps

# Ver logs de la base de datos
docker-compose -f docker-compose.dev.yml logs database

# Reiniciar servicios
docker-compose -f docker-compose.dev.yml restart database backend
```

### Los cambios no se reflejan automáticamente

```bash
# Verificar que los volúmenes están montados
docker inspect futbol_clinic_backend_dev | grep Mounts -A 20

# Reiniciar el backend
docker-compose -f docker-compose.dev.yml restart backend

# Ver logs para verificar hot-reload
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Error: yarn install falla por red lenta

El Dockerfile.dev ya incluye `network-timeout` aumentado, pero si sigues teniendo problemas:

```bash
# Usar NPM en lugar de Yarn
# Edita Dockerfile.dev y cambia:
# RUN npm ci || npm install
# CMD ["npm", "run", "dev"]
```

## 🔧 Comandos Útiles

```bash
# Iniciar servicios
docker-compose -f docker-compose.dev.yml up

# Iniciar en background
docker-compose -f docker-compose.dev.yml up -d

# Detener servicios
docker-compose -f docker-compose.dev.yml down

# Detener y eliminar volúmenes
docker-compose -f docker-compose.dev.yml down -v

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs solo del backend
docker-compose -f docker-compose.dev.yml logs -f backend

# Reconstruir backend
docker-compose -f docker-compose.dev.yml build backend

# Reiniciar backend
docker-compose -f docker-compose.dev.yml restart backend

# Ejecutar comandos en el contenedor
docker-compose -f docker-compose.dev.yml exec backend sh

# Ver servicios corriendo
docker-compose -f docker-compose.dev.yml ps

# Ver uso de recursos
docker stats futbol_clinic_backend_dev
```

## 🗄️ Gestión de Base de Datos

### Ejecutar Migraciones

```bash
# Opción 1: Desde el contenedor
docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d futbol_clinic -f /migrations/001_init.sql

# Opción 2: Desde pgAdmin
# Ve a http://localhost:5050 y ejecuta los SQL manualmente
```

### Conectar con psql

```bash
# Desde fuera del contenedor
docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d futbol_clinic

# Consultas útiles
\dt                    # Listar tablas
\d+ users             # Describir tabla users
SELECT * FROM tenants; # Ver tenants
```

### Backup y Restore

```bash
# Backup
docker-compose -f docker-compose.dev.yml exec database pg_dump -U postgres futbol_clinic > backup.sql

# Restore
docker-compose -f docker-compose.dev.yml exec -T database psql -U postgres -d futbol_clinic < backup.sql
```

## 🎯 Flujo de Trabajo Recomendado

1. **Iniciar Docker Compose**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Esperar a que inicie** (~30 segundos la primera vez)
   - Ver logs hasta que aparezca: "Server running on port 4000"

3. **Hacer cambios en el código**
   - Edita archivos en `backend/src/`
   - El servidor se reiniciará automáticamente

4. **Probar cambios**
   ```bash
   curl http://localhost:4000/api/health
   ```

5. **Ver logs si hay errores**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```

## 🔒 Variables de Entorno

Las variables están definidas en `docker-compose.dev.yml`. Para desarrollo local sin Docker, crea `.env.local`:

```bash
cp .env.dev.example .env.local
# Edita .env.local según necesites
```

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### Ver solo errores
```bash
docker-compose -f docker-compose.dev.yml logs | grep -i error
```

### Estadísticas de contenedores
```bash
docker stats
```

## 🧪 Testing

```bash
# Ejecutar tests dentro del contenedor
docker-compose -f docker-compose.dev.yml exec backend yarn test

# O localmente
yarn test
```

## 🚀 Pasar a Producción

Cuando estés listo para producción, usa el Dockerfile principal:

```bash
# Construir para producción
docker build -t futbol-clinic-backend:latest .

# O usa docker-compose.yml (producción)
docker-compose up --build
```

## 📚 Recursos Adicionales

- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [ts-node-dev para Hot Reload](https://github.com/wclr/ts-node-dev)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)

## 💡 Tips

1. **Primera ejecución**: Puede tardar 2-3 minutos en construir
2. **Ejecuciones subsecuentes**: Inician en ~10 segundos
3. **Hot Reload**: Los cambios se reflejan en 1-2 segundos
4. **Debugging**: Usa VSCode con puerto 9229
5. **Base de datos**: Se mantiene entre reinicios (volumen persistente)

---

## ✅ Checklist de Verificación

- [ ] Docker Desktop está corriendo
- [ ] Puerto 4000 está libre
- [ ] Puerto 5432 está libre (PostgreSQL)
- [ ] Tienes al menos 2GB de RAM disponible
- [ ] `docker-compose -f docker-compose.dev.yml up` ejecuta sin errores
- [ ] `curl http://localhost:4000/api/health` retorna `{"status":"ok"}`
- [ ] Los cambios en código se reflejan automáticamente
- [ ] Puedes ver los logs con `docker-compose logs -f`

Si todos los checks están ✅, ¡estás listo para desarrollar! 🎉

