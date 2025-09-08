# Deployment en Vercel

Este proyecto está configurado para deployarse en Vercel usando un monorepo con Next.js (frontend) y Node.js (backend).

## Pasos para el deployment

### 1. Configurar la base de datos
Necesitas una base de datos PostgreSQL. Opciones recomendadas:
- **Vercel Postgres** (integración directa)
- **Supabase** (gratis hasta cierto límite)
- **Railway** (incluye PostgreSQL)
- **Neon** (PostgreSQL serverless)

### 2. Variables de entorno en Vercel
Configura estas variables en tu proyecto de Vercel:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=tu-clave-secreta-jwt-muy-larga-y-segura
FRONTEND_URL=https://tu-app.vercel.app
BLOB_READ_WRITE_TOKEN=tu-token-de-vercel-blob
```

### 3. Ejecutar migraciones
Después del primer deploy, necesitas ejecutar las migraciones de la base de datos:

1. Conecta a tu base de datos PostgreSQL
2. Ejecuta los archivos de migración en orden desde `backend/migrations/`

### 4. Deploy automático
Una vez configurado, cada push a la rama main se deployará automáticamente.

## URLs después del deployment
- Frontend: `https://tu-app.vercel.app`
- API Backend: `https://tu-app.vercel.app/api/`

## Comandos útiles

```bash
# Para desarrollo local
npm run dev        # frontend
npm run dev        # backend

# Para build de producción
npm run build      # frontend
npm run build      # backend
```

## Estructura del proyecto
```
/
├── frontend/      # Next.js app
├── backend/       # Node.js API
├── vercel.json    # Configuración principal
└── env.example    # Variables de entorno ejemplo
```
