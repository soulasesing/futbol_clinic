# 🗄️ Configuración de Base de Datos Externa

## 📌 Situación Actual

Ya tienes una base de datos PostgreSQL corriendo en Docker y quieres usarla con tu backend de Futbol Clinic en desarrollo.

## ✅ Servicios Comentados

He comentado en `docker-compose.dev.yml`:
- ✅ Servicio `database` (PostgreSQL)
- ✅ Servicio `pgadmin` (opcional)
- ✅ Volúmenes relacionados

Ahora solo se levanta el **backend** y se conecta a tu BD existente.

---

## 🔧 Configurar la Conexión

### Paso 1: Identificar tu Base de Datos

Primero, necesitas saber cómo acceder a tu PostgreSQL existente:

```bash
# Listar contenedores de PostgreSQL corriendo
docker ps | grep postgres

# Ejemplo de salida:
# abc123  postgres:15  "docker-entrypoint..."  5432/tcp  mi_postgres_db
```

Anota:
- **Nombre del contenedor**: (ej: `mi_postgres_db`)
- **Puerto**: (ej: `5432`)
- **Usuario**: (ej: `postgres`)
- **Contraseña**: (tu contraseña)
- **Nombre de la BD**: (ej: `futbol_clinic`)

### Paso 2: Editar docker-compose.dev.yml

Abre `docker-compose.dev.yml` y busca la línea con `DATABASE_URL` (línea ~53):

```yaml
DATABASE_URL: postgresql://postgres:postgres123@host.docker.internal:5432/futbol_clinic
```

**Opciones según tu configuración:**

#### Opción A: BD en el mismo Host (Mac/Windows)
```yaml
DATABASE_URL: postgresql://TU_USUARIO:TU_PASSWORD@host.docker.internal:5432/futbol_clinic
```

#### Opción B: BD en otro contenedor Docker
```yaml
DATABASE_URL: postgresql://TU_USUARIO:TU_PASSWORD@NOMBRE_CONTENEDOR:5432/futbol_clinic
```

Si usas esta opción, también necesitas conectar ambos contenedores a la misma red:

```yaml
# En docker-compose.dev.yml, en el servicio backend, agrega:
networks:
  - futbol_clinic_dev
  - tu_red_postgres  # La red de tu contenedor PostgreSQL existente

# Al final del archivo:
networks:
  futbol_clinic_dev:
    driver: bridge
  tu_red_postgres:
    external: true  # Indica que la red ya existe
```

#### Opción C: BD en IP Específica
```yaml
DATABASE_URL: postgresql://TU_USUARIO:TU_PASSWORD@192.168.1.100:5432/futbol_clinic
```

---

## 🔍 Verificar la Conexión

### 1. Verificar que tu BD está corriendo
```bash
# Si está en Docker
docker ps | grep postgres

# Probar conexión directa
psql -h localhost -U tu_usuario -d futbol_clinic
```

### 2. Crear la base de datos (si no existe)
```bash
# Conectar a PostgreSQL
docker exec -it NOMBRE_CONTENEDOR psql -U postgres

# Dentro de psql:
CREATE DATABASE futbol_clinic;
\q
```

### 3. Ejecutar migraciones
```bash
# Ver las migraciones disponibles
ls -la backend/migrations/

# Ejecutar cada migración
docker exec -i NOMBRE_CONTENEDOR psql -U postgres -d futbol_clinic < backend/migrations/001_init.sql
docker exec -i NOMBRE_CONTENEDOR psql -U postgres -d futbol_clinic < backend/migrations/002_players_and_reset.sql
# ... y así sucesivamente
```

O ejecutarlas todas de una vez:
```bash
for migration in backend/migrations/*.sql; do
  echo "Ejecutando: $migration"
  docker exec -i NOMBRE_CONTENEDOR psql -U postgres -d futbol_clinic < "$migration"
done
```

---

## 🚀 Iniciar el Backend

Una vez configurado el `DATABASE_URL`, inicia el backend:

```bash
# Opción 1: Con script helper
./dev.sh start

# Opción 2: Con docker-compose
docker-compose -f docker-compose.dev.yml up --build
```

---

## ✅ Verificar que Funciona

```bash
# 1. Verificar que el backend inició
./dev.sh check

# O manualmente:
curl http://localhost:4000/api/health
# Debe retornar: {"status":"ok"}

# 2. Verificar conexión a BD
curl http://localhost:4000/api/db-test
# Debe retornar: {"dbTime":"2024-10-21T..."}
```

Si el segundo comando falla, hay un problema de conexión a la BD.

---

## 🐛 Troubleshooting

### Error: "could not connect to server"

**Causa**: El backend no puede alcanzar tu PostgreSQL.

**Soluciones**:

1. **Verifica que PostgreSQL está corriendo**:
   ```bash
   docker ps | grep postgres
   ```

2. **Prueba conectarte desde tu host**:
   ```bash
   psql -h localhost -U postgres -d futbol_clinic
   ```

3. **Si tu BD está en otro contenedor, usa el nombre del contenedor**:
   ```yaml
   DATABASE_URL: postgresql://user:pass@nombre_contenedor:5432/futbol_clinic
   ```

4. **Conecta ambos contenedores a la misma red Docker**:
   ```bash
   # Ver redes disponibles
   docker network ls
   
   # Inspeccionar red de tu BD
   docker network inspect nombre_red
   
   # Agregar esa red en docker-compose.dev.yml
   ```

### Error: "password authentication failed"

**Causa**: Usuario o contraseña incorrectos.

**Solución**: Verifica las credenciales en tu `DATABASE_URL`.

### Error: "database does not exist"

**Causa**: La base de datos `futbol_clinic` no existe.

**Solución**: Créala:
```bash
docker exec -it NOMBRE_CONTENEDOR psql -U postgres -c "CREATE DATABASE futbol_clinic;"
```

### Error: "relation does not exist"

**Causa**: Las tablas no existen (migraciones no ejecutadas).

**Solución**: Ejecuta las migraciones:
```bash
for migration in backend/migrations/*.sql; do
  docker exec -i NOMBRE_CONTENEDOR psql -U postgres -d futbol_clinic < "$migration"
done
```

---

## 📊 Ejemplo Completo

Supongamos que tu PostgreSQL se llama `my_postgres` y está en Docker:

### 1. Ver información del contenedor
```bash
docker inspect my_postgres | grep IPAddress
# Resultado: "IPAddress": "172.17.0.2"
```

### 2. Configurar DATABASE_URL
```yaml
# En docker-compose.dev.yml
DATABASE_URL: postgresql://postgres:mipassword@my_postgres:5432/futbol_clinic
```

### 3. Conectar las redes
```yaml
# En docker-compose.dev.yml
services:
  backend:
    # ... resto de configuración
    networks:
      - futbol_clinic_dev
      - bridge  # Red por defecto donde está my_postgres

networks:
  futbol_clinic_dev:
    driver: bridge
  bridge:
    external: true
```

### 4. Iniciar backend
```bash
./dev.sh start
```

### 5. Verificar
```bash
./dev.sh check
```

---

## 🎯 Comandos Útiles del Script

```bash
./dev.sh check        # Verifica conexión al backend y BD
./dev.sh migrations   # Muestra cómo ejecutar migraciones
./dev.sh db           # Muestra cómo conectar a tu BD
./dev.sh logs-backend # Ver logs del backend para debug
```

---

## 📝 Resumen de Cambios

✅ **docker-compose.dev.yml**:
- Servicio `database` comentado
- Servicio `pgadmin` comentado
- `depends_on` de database comentado
- Volúmenes de PostgreSQL comentados
- Instrucciones agregadas para configurar `DATABASE_URL`

✅ **dev.sh**:
- `check` ahora verifica conexión a BD externa
- `migrations` muestra instrucciones en lugar de ejecutar
- `db` muestra instrucciones en lugar de conectar
- Mensajes actualizados para BD externa

---

## 💡 Recomendación

Si trabajas frecuentemente en este proyecto, considera:

1. **Crear un script de conexión rápida**:
   ```bash
   #!/bin/bash
   # quick-db.sh
   docker exec -it NOMBRE_CONTENEDOR psql -U postgres -d futbol_clinic
   ```

2. **Usar pgAdmin**:
   - Más fácil para ejecutar migraciones
   - Interface visual para consultas
   - Puedes instalarlo localmente o en Docker

3. **Variables de entorno en archivo**:
   ```bash
   # Crear .env.local
   cp backend/.env.dev.example backend/.env.local
   # Editar con tus credenciales
   ```

---

¿Necesitas ayuda con la configuración? Revisa los logs:
```bash
./dev.sh logs-backend
```

