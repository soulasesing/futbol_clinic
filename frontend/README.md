# Frontend - Futbol Clinic

Dashboard multi-tenant para escuelas de fútbol.

## Stack Tecnológico

### Core
- **Next.js** v14.2.0 (React Framework)
- **React** v18.2.0
- **TypeScript** v5.4.4
- **TailwindCSS** v3.4.1

### Dependencias principales
- **Styling**: TailwindCSS, PostCSS, Autoprefixer
- **Testing**: Jest, React Testing Library
- **Development**: TypeScript, ESLint

### Arquitectura
- **Server-Side Rendering (SSR)** con Next.js
- **Static Site Generation (SSG)** para páginas optimizadas
- **API Routes** para proxy al backend
- **Responsive Design** con TailwindCSS

## Requisitos previos

- Node.js v20+
- Yarn package manager
- Docker y Docker Compose (opcional)

## Instalación y configuración

### 1. Instalación de dependencias
```bash
yarn install
```

### 2. Variables de entorno
Crear archivo `.env.local` con:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NODE_ENV=development
```

### 3. Configuración del proxy
El frontend está configurado para hacer proxy de las requests `/api/*` al backend en `localhost:4000`

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
pages/                  # Rutas de la aplicación (Next.js App Router)
├── _app.tsx           # Configuración global de la app
├── index.tsx          # Página de inicio
├── login.tsx          # Página de login
├── dashboard.tsx      # Dashboard principal
├── players.tsx        # Gestión de jugadores
├── coaches.tsx        # Gestión de entrenadores
├── teams.tsx          # Gestión de equipos
├── tenants.tsx        # Gestión de escuelas (SuperAdmin)
├── configuracion.tsx  # Configuración de escuela
├── register.tsx       # Registro de usuarios
├── forgot.tsx         # Recuperación de contraseña
└── reset.tsx          # Reset de contraseña

components/            # Componentes reutilizables
├── Navbar.tsx         # Barra de navegación
├── UserMenu.tsx       # Menú de usuario
├── LandingHero.tsx    # Hero de landing page
├── LandingFeatures.tsx # Características del producto
├── LandingBenefits.tsx # Beneficios del producto
└── LandingFooter.tsx  # Footer de landing page

contexts/              # Context API para estado global
├── AuthContext.tsx    # Contexto de autenticación
└── [otros contexts]   # Otros contextos según necesidad

utils/                 # Utilidades y helpers
hooks/                 # Custom React hooks
styles/               # Estilos globales
├── globals.css       # Estilos base y TailwindCSS
tests/                # Pruebas automatizadas
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

# 2. Configurar variables de entorno
# 3. Asegurar que el backend esté corriendo en puerto 4000

# 4. Iniciar servidor de desarrollo
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## Características principales

### Autenticación y autorización
- Login multi-tenant con JWT
- Contexto de autenticación global
- Protección de rutas por roles
- Gestión de sesiones

### Dashboard multi-tenant
- Vista adaptada según rol del usuario
- SuperAdmin: acceso a todas las escuelas
- Admin de escuela: acceso limitado a su tenant
- Métricas y estadísticas personalizadas

### Gestión de jugadores
- Lista completa con filtros y búsqueda
- Formularios de creación y edición
- Upload de documentos e imágenes
- Vista detallada de cada jugador
- **Pruebas físicas** (nuevo): formulario y historial

### Gestión de equipos
- CRUD completo de equipos
- Asignación de jugadores
- Gestión de categorías de edad
- Asignación de entrenadores

### Personalización por escuela
- Upload de logo personalizado
- Banner personalizable
- Esquema de colores customizable
- Configuración desde el dashboard

### Landing page
- Hero section responsive
- Características del producto
- Beneficios destacados
- Footer informativo
- Diseño moderno y atractivo

## Configuración avanzada

### TailwindCSS
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // Personalizaciones aquí
    },
  },
  plugins: [],
};
```

### Next.js
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};
```

## Multi-tenant Frontend

### Arquitectura
- Detección automática de tenant mediante JWT
- UI adaptativa según configuración de escuela
- Aislamiento de datos en el frontend
- Personalización visual por tenant

### Flujo de autenticación
1. Usuario ingresa credenciales en `/login`
2. Frontend envía request al backend
3. Backend retorna JWT con `tenant_id`
4. Context guarda token y datos de usuario
5. UI se adapta según rol y tenant

## Páginas principales

### `/` - Landing Page
- Información del producto
- Call-to-action para registro
- Características destacadas

### `/login` - Autenticación
- Login multi-tenant
- Links a registro y recuperación

### `/dashboard` - Panel principal
- Métricas y estadísticas
- Accesos rápidos
- Vista adaptada por rol

### `/players` - Gestión de jugadores
- Lista con filtros avanzados
- Formularios de creación/edición
- **Pruebas físicas integradas**

### `/configuracion` - Configuración
- Personalización de escuela
- Upload de assets
- Configuración de colores

## Testing

```bash
# Ejecutar todos los tests
yarn test

# Ejecutar tests en modo watch
yarn test --watch

# Ejecutar tests con coverage
yarn test --coverage
```

### Estructura de tests
- Unit tests para componentes
- Integration tests para páginas
- Tests de contextos y hooks
- Tests de utilidades

## Deployment

### Variables de entorno de producción
```env
NEXT_PUBLIC_API_URL=https://api.futbolclinic.com
NODE_ENV=production
```

### Build y deployment
```bash
# Build para producción
yarn build

# Verificar build localmente
yarn start
```

### Docker deployment
```bash
docker build -t futbol-clinic-frontend .
docker run -p 3000:3000 --env-file .env futbol-clinic-frontend
```

## Idioma y localización
- **Español** como idioma principal
- Preparado para internacionalización futura
- Textos organizados para fácil traducción

## Contribución

1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/nueva-funcionalidad`)
3. Seguir las convenciones de código:
   - Usar TypeScript estricto
   - Seguir patrones de React/Next.js
   - Usar TailwindCSS para estilos
   - Componentes funcionales con hooks
4. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
5. Push al branch (`git push origin feature/nueva-funcionalidad`)
6. Crear Pull Request

## Próximas funcionalidades

- [ ] Internacionalización (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Dark mode
- [ ] Notificaciones push
- [ ] Chat en tiempo real
- [ ] Reportes avanzados
- [ ] Integración con calendarios 