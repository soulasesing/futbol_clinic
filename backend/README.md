# Backend - Futbol Clinic

API RESTful multi-tenant para gestión de escuelas de fútbol.

## Stack Tecnológico

### Core
- **Node.js** v20
- **TypeScript** v5.4.4
- **Express** v4.18.2
- **PostgreSQL** (multi-tenant con RLS)

### Dependencias principales
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **Database**: pg (PostgreSQL driver)
- **File upload**: multer, @vercel/blob
- **Email**: nodemailer
- **Utilities**: uuid, cors, dotenv

### Desarrollo
- **Hot reload**: ts-node-dev
- **Testing**: Jest + Supertest
- **Build**: TypeScript compiler
- **Containerization**: Docker

## Requisitos previos

- Node.js v20+
- PostgreSQL 14+
- Docker y Docker Compose (opcional)

## Instalación y configuración

### 1. Instalación de dependencias
```bash
yarn install
```

### 2. Variables de entorno
Crear archivo `.env` con:
```env
DATABASE_URL=postgres://usuario:password@localhost:5432/futbol_clinic
NODE_ENV=development
JWT_SECRET=tu_jwt_secret_aqui
PORT=4000
```

### 3. Base de datos
```bash
# Ejecutar migraciones
psql -d futbol_clinic -f migrations/001_init.sql
psql -d futbol_clinic -f migrations/002_players_and_reset.sql
# ... continuar con el resto de migraciones en orden
```

## Scripts disponibles

```bash
# Desarrollo con hot reload
yarn dev

# Build para producción
yarn build

# Ejecutar en producción
yarn start

# Ejecutar tests
yarn test
```

## Estructura del proyecto

```
src/
├── app.ts              # Configuración de Express
├── server.ts           # Punto de entrada
├── controllers/        # Controladores de rutas
├── services/           # Lógica de negocio
├── routes/             # Definición de rutas
├── middlewares/        # Middlewares personalizados
├── types/              # Tipos TypeScript
└── utils/              # Utilidades
migrations/             # Scripts SQL de migración
tests/                  # Pruebas automatizadas
docs/                   # Documentación OpenAPI
```

## Inicio rápido

### Con Docker (recomendado)
```bash
docker-compose up --build
```

### Sin Docker
```bash
# 1. Instalar dependencias
yarn install

# 2. Configurar base de datos PostgreSQL
# 3. Ejecutar migraciones
# 4. Configurar variables de entorno

# 5. Iniciar servidor de desarrollo
yarn dev
```

La API estará disponible en `http://localhost:4000`

## Multi-tenant

### Arquitectura
- Cada request opera bajo un `tenant_id` específico
- Aislamiento de datos mediante Row Level Security (RLS)
- Triggers automáticos para asignación de tenant_id

### Flujo de autenticación
1. Login con credenciales de escuela
2. JWT incluye `tenant_id`
3. Middleware extrae y valida tenant
4. Queries automáticamente filtradas por tenant

## Características principales

### Gestión de usuarios
- SuperAdmin (acceso global)
- Admin de escuela (acceso limitado a su tenant)
- Autenticación JWT
- Roles y permisos

### Gestión de jugadores
- CRUD completo de jugadores
- Asociación con equipos y categorías
- Upload de documentos e imágenes
- Relación con padres/tutores

### Equipos y categorías
- Gestión de equipos por escuela
- Categorías de edad
- Asignación de entrenadores

### Pruebas físicas (nuevo)
- Registro de métricas físicas
- Historial por jugador
- Endpoints RESTful completos

## API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Renovar token

### Jugadores
- `GET /players` - Listar jugadores
- `POST /players` - Crear jugador
- `GET /players/:id` - Obtener jugador
- `PUT /players/:id` - Actualizar jugador
- `DELETE /players/:id` - Eliminar jugador

### Pruebas físicas
- `POST /players/:playerId/physical-tests` - Crear prueba física
- `GET /players/:playerId/physical-tests` - Listar pruebas del jugador
- `GET /physical-tests/:id` - Obtener prueba específica
- `PUT /physical-tests/:id` - Actualizar prueba
- `DELETE /physical-tests/:id` - Eliminar prueba

## Configuración de producción

### Variables de entorno adicionales
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=secure_random_string
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email
EMAIL_PASS=tu_password
```

### Docker deployment
```bash
docker build -t futbol-clinic-backend .
docker run -p 4000:4000 --env-file .env futbol-clinic-backend
```

## Testing

```bash
# Ejecutar todos los tests
yarn test

# Ejecutar tests en modo watch
yarn test --watch

# Ejecutar tests con coverage
yarn test --coverage
```

## Contribución

1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request 