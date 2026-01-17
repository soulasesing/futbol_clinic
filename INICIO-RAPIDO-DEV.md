# 🚀 Inicio Rápido - Modo Desarrollo

## ✅ Problema SSL Resuelto

He creado una solución completa para desarrollo que **resuelve el error SSL** que viste.

## ⚠️ IMPORTANTE - Base de Datos Externa

Este proyecto está configurado para usar **tu base de datos PostgreSQL existente**.

**Antes de iniciar**, configura la conexión en `docker-compose.dev.yml`:

```yaml
DATABASE_URL: postgresql://TU_USUARIO:TU_PASSWORD@host.docker.internal:5432/futbol_clinic
```

📚 **Guía completa**: [`CONFIGURACION-BD-EXTERNA.md`](./CONFIGURACION-BD-EXTERNA.md)

---

## 🏃 Iniciar Ahora (3 pasos)

### 1️⃣ Desde la raíz del proyecto ejecuta:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### 2️⃣ Espera ~2 minutos (primera vez)

Verás algo como:
```
✅ database is healthy
✅ backend started on port 4000
```

### 3️⃣ Prueba que funciona:

```bash
curl http://localhost:4000/api/health
```

Deberías ver: `{"status":"ok"}`

## 🎉 ¡Listo! Ya puedes desarrollar

- ✅ **Hot Reload**: Cambia código en `backend/src/` y se reinicia automáticamente
- ✅ **Base de datos**: Tu PostgreSQL externo (configurado en DATABASE_URL)
- ✅ **Backend API**: http://localhost:4000

## 📝 Ver Logs

```bash
# Ver todos los logs
docker-compose -f docker-compose.dev.yml logs -f

# Ver solo backend
docker-compose -f docker-compose.dev.yml logs -f backend
```

## 🛑 Detener

```bash
docker-compose -f docker-compose.dev.yml down
```

## 🔧 ¿Qué se creó?

1. **`backend/Dockerfile.dev`** - Imagen Docker para desarrollo con SSL fix
2. **`docker-compose.dev.yml`** - Orquestación completa (DB + Backend + pgAdmin)
3. **`backend/README-DEV.md`** - Documentación completa de desarrollo

## 📚 Documentación Completa

Para más detalles, troubleshooting y comandos avanzados:
- Lee **`backend/README-DEV.md`**

## 🐛 Si algo falla

### SSL Error persiste:
```bash
docker builder prune -a
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Puerto ocupado:
```bash
docker-compose -f docker-compose.dev.yml down
lsof -i :4000
```

### No se conecta a la DB:
```bash
docker-compose -f docker-compose.dev.yml logs database
docker-compose -f docker-compose.dev.yml restart database backend
```

---

## 💡 Diferencia con Producción

**Desarrollo (`docker-compose.dev.yml`)**:
- Hot reload automático
- Código montado como volumen
- Debugging habilitado
- No optimizado para tamaño

**Producción (`docker-compose.yml`)**:
- Build optimizado
- Multi-stage para menor tamaño
- Sin hot reload
- Más seguro

---

¿Preguntas? Consulta `backend/README-DEV.md` para guía completa.

