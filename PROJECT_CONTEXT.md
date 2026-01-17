# Futbol Clinic - Project Context & Rules

## 📋 Project Overview

**Futbol Clinic** is a multi-tenant SaaS platform for managing football (soccer) schools. It provides comprehensive management tools for players, teams, coaches, trainings, matches, attendance, statistics, and physical tests.

### Key Features
- Multi-tenant architecture with complete data isolation
- Role-based access control (super_admin, admin, coach, parent)
- Dynamic branding per tenant (colors, logos, banners)
- Calendar-based training and match management
- Player statistics and physical test tracking
- Attendance tracking
- Match convocations
- Parent dashboard

---

## 🏗️ Architecture

### System Architecture
- **Frontend**: Next.js 14 (Pages Router) with TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Row Level Security (RLS) for multi-tenancy
- **Deployment**: Vercel (monorepo)
- **File Storage**: Vercel Blob Storage

### Multi-Tenancy Strategy
- **Database-level isolation**: PostgreSQL Row Level Security (RLS)
- **Tenant context**: Set via `app.current_tenant` session variable
- **Middleware**: `setTenant` middleware automatically sets tenant context from JWT
- **Super Admin**: Special role with `tenant_id = NULL`, bypasses tenant isolation

---

## 🛠️ Technology Stack

### Frontend
```json
{
  "next": "^14.2.0",
  "react": "^18.2.0",
  "typescript": "^5.4.4",
  "tailwindcss": "^3.4.1",
  "@fullcalendar/react": "^6.1.18",
  "lucide-react": "^0.535.0"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "typescript": "^5.4.4",
  "pg": "^8.11.1",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.0",
  "@vercel/blob": "^1.1.1",
  "multer": "^1.4.5-lts.1",
  "nodemailer": "^6.9.11",
  "uuid": "^11.1.0"
}
```

### Database
- PostgreSQL 14+
- UUID primary keys (using `pgcrypto` extension)
- Row Level Security (RLS) policies
- Database triggers for automatic tenant_id assignment

---

## 📁 Project Structure

```
futbol_clinic/
├── frontend/
│   ├── components/          # Reusable React components
│   ├── contexts/            # React Context providers (Auth, Branding)
│   ├── pages/               # Next.js pages (Pages Router)
│   ├── styles/              # Global CSS and Tailwind config
│   └── utils/               # Frontend utilities
│
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers (thin layer)
│   │   ├── services/         # Business logic
│   │   ├── routes/           # Express route definitions
│   │   ├── middlewares/      # Express middlewares
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utilities (db, jwt, hash)
│   │   ├── app.ts            # Express app configuration
│   │   └── server.ts         # Server entry point
│   ├── migrations/           # SQL migration files (numbered)
│   └── tests/                # Backend tests
│
├── docker-compose.yml        # Local development setup
├── vercel.json               # Vercel deployment config
└── env.example               # Environment variables template
```

---

## 🗄️ Database Schema

### Core Tables

#### `tenants` (Schools)
- Stores tenant information
- Branding fields: `logo_url`, `banner_url`, `primary_color`, `secondary_color`
- Social media links, contact info, description, slogan

#### `users`
- Multi-tenant users with roles
- `tenant_id` can be NULL for super_admin
- Roles: `super_admin`, `admin`, `coach`, `parent`
- Password reset tokens

#### `teams`
- Teams belong to tenants
- Linked to categories and coaches

#### `players`
- Player information with parent contact details
- Photo and document URLs
- Can belong to multiple teams (via `player_teams` junction table)

#### `coaches`
- Coach information with photo URL

#### `trainings`
- Recurring training sessions
- Supports recurrence patterns
- Linked to teams

#### `matches`
- Match information with local/visitor teams
- Status tracking, results, convocations

#### `attendance`
- Training attendance records

#### `stats`
- Player statistics per match (goals, assists, cards)

#### `physical_tests`
- Physical test records for players

#### `categories`
- Age categories for teams

### Multi-Tenancy Implementation

**Row Level Security (RLS)**:
```sql
-- Example policy
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

**Automatic Tenant Assignment**:
```sql
-- Trigger function
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := current_setting('app.current_tenant')::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔐 Authentication & Authorization

### JWT Structure
```typescript
interface JwtPayload {
  userId: string;
  tenantId: string | null;  // null for super_admin
  role: string;
}
```

### Authentication Flow
1. User logs in with `email`, `password`, `tenantId`
2. Backend validates credentials
3. Returns JWT token
4. Frontend stores JWT in `localStorage`
5. JWT included in `Authorization: Bearer <token>` header for all API calls

### Middleware Chain
```typescript
// Route example
router.get('/players', requireAuth, setTenant, playerController.getAll);
```

**Middleware Order**:
1. `requireAuth` - Validates JWT, extracts user info
2. `setTenant` - Sets PostgreSQL session variable for RLS
3. Controller - Handles request

### Role-Based Access
- **super_admin**: Full system access, can manage tenants
- **admin**: Full access within their tenant
- **coach**: Limited access (view/manage assigned teams)
- **parent**: Read-only access to their child's data

---

## 🌐 API Patterns

### Backend Architecture Pattern

**3-Layer Architecture**:
1. **Routes** (`routes/`) - Define endpoints, apply middlewares
2. **Controllers** (`controllers/`) - Handle HTTP requests/responses (thin)
3. **Services** (`services/`) - Business logic, database operations

### Route Definition Pattern
```typescript
// routes/playerRoutes.ts
import { Router } from 'express';
import * as playerController from '../controllers/playerController';
import { requireAuth, requireAdminAuth } from '../middlewares/authMiddleware';
import { setTenant } from '../middlewares/tenantMiddleware';

const router = Router();

router.get('/', requireAuth, setTenant, playerController.getAll);
router.post('/', requireAuth, setTenant, requireAdminAuth, playerController.create);
router.put('/:id', requireAuth, setTenant, requireAdminAuth, playerController.update);
router.delete('/:id', requireAuth, setTenant, requireAdminAuth, playerController.delete);

export default router;
```

### Controller Pattern
```typescript
// controllers/playerController.ts
export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const players = await playerService.getAll();
    res.json(players);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
```

### Service Pattern
```typescript
// services/playerService.ts
export const getAll = async () => {
  const result = await pool.query(
    'SELECT * FROM players ORDER BY nombre'
  );
  return result.rows;
};
```

### API Response Format
- **Success**: `200 OK` with JSON data
- **Error**: `400/401/403/500` with `{ message: string }`

### API Endpoints Structure
```
/api/auth/*              - Authentication
/api/tenants/*           - Tenant management
/api/players/*           - Player management
/api/teams/*             - Team management
/api/coaches/*           - Coach management
/api/trainings/*         - Training sessions
/api/matches/*           - Matches
/api/attendance/*        - Attendance records
/api/stats/*             - Statistics
/api/physical-tests/*    - Physical tests
/api/categories/*        - Categories
/api/branding/*          - Branding configuration
/api/upload              - File upload
```

---

## 🎨 Frontend Patterns

### Component Structure
- **Pages** (`pages/`) - Next.js pages, handle routing and data fetching
- **Components** (`components/`) - Reusable UI components
- **Contexts** (`contexts/`) - Global state management

### Context Providers
```typescript
// _app.tsx
<AuthProvider>
  <BrandingProvider>
    <Component {...pageProps} />
  </BrandingProvider>
</AuthProvider>
```

**AuthContext**:
- Manages user authentication state
- Stores JWT in localStorage
- Provides `user`, `jwt`, `login()`, `logout()`, `isAuthenticated`

**BrandingContext**:
- Fetches tenant branding data
- Applies dynamic CSS variables for theming
- Provides `branding`, `loading`, `refreshBranding()`, `applyColors()`

### API Call Pattern
```typescript
const { jwt } = useAuth();

const fetchData = async () => {
  const response = await fetch('/api/players', {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  const data = await response.json();
  // Handle data
};
```

### Dynamic Theming
Branding colors are applied via CSS custom properties:
```css
:root {
  --color-primary: #22c55e;
  --color-secondary: #0d9488;
  --color-primary-50: rgba(34, 197, 94, 0.05);
  /* ... more variations */
}
```

Usage in components:
```tsx
<div className="theme-primary">Primary color background</div>
<div className="theme-primary-text">Primary color text</div>
<div className="theme-gradient">Gradient background</div>
```

---

## 📤 File Upload

### Upload Flow
1. Frontend sends file via `FormData` to `/api/upload`
2. Backend uses `multer` to handle multipart/form-data
3. File uploaded to Vercel Blob Storage
4. Returns public URL
5. URL stored in database

### Upload Route
```typescript
// routes/uploadRoutes.ts
router.post('/', upload.single('file'), async (req, res) => {
  const blob = await put(req.file.originalname, req.file.buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  res.json({ url: blob.url });
});
```

### Frontend Upload Helper
```typescript
const uploadImage = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${jwt}` }
  });
  const data = await res.json();
  return data.url;
};
```

---

## 🎨 Styling Guidelines

### Tailwind CSS
- **Primary styling method**: Tailwind utility classes
- **Avoid**: Inline styles, separate CSS files (except globals.css)
- **Custom classes**: Defined in `globals.css` for theming

### Theme Classes
- `.theme-primary` - Primary color background
- `.theme-secondary` - Secondary color background
- `.theme-primary-text` - Primary color text
- `.theme-gradient` - Gradient background
- `.custom-scrollbar` - Custom scrollbar styling

### Component Styling Pattern
```tsx
<div className="w-full p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-2xl font-bold theme-primary-text mb-4">
    Title
  </h2>
</div>
```

---

## 📝 Coding Conventions

### TypeScript
- **Strict mode**: Enabled
- **Type definitions**: Use interfaces for object shapes
- **Type inference**: Prefer inference where possible
- **Any types**: Avoid, use `unknown` if necessary

### Naming Conventions
- **Components**: PascalCase (`PlayerCard.tsx`)
- **Functions/Constants**: camelCase (`const fetchPlayers = () => {}`)
- **Event handlers**: `handle` prefix (`handleClick`, `handleSubmit`)
- **Types/Interfaces**: PascalCase (`interface Player {}`)
- **Files**: Match export (component file = component name)

### Code Style
- **Early returns**: Prefer for readability
- **Const over function**: `const myFunc = () => {}` not `function myFunc() {}`
- **Descriptive names**: Use clear, descriptive variable/function names
- **DRY principle**: Don't repeat yourself
- **No TODOs**: Complete implementations, no placeholders

### React Patterns
- **Functional components**: Use function components, not classes
- **Hooks**: Use React hooks for state and side effects
- **Context**: Use for global state (auth, branding)
- **Props**: Define interfaces for component props

### Error Handling
```typescript
// Backend
try {
  const result = await service.method();
  res.json(result);
} catch (error: any) {
  res.status(400).json({ message: error.message });
}

// Frontend
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error('Request failed');
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
  // Handle error
}
```

---

## 🚀 Deployment

### Vercel Configuration
- **Monorepo**: Both frontend and backend in same repo
- **Builds**: Separate builds for frontend and backend
- **Routing**: 
  - `/api/*` → Backend
  - `/*` → Frontend

### Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-app.vercel.app
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### Database Migrations
- Migrations in `backend/migrations/` (numbered sequentially)
- Run manually after first deployment
- Order matters: execute in numerical order

### Local Development
```bash
# Using Docker Compose
docker-compose up

# Manual
cd backend && yarn dev    # Port 4000
cd frontend && yarn dev   # Port 3000
```

---

## 🔄 Data Flow

### Typical Request Flow
1. **User Action** → Frontend component
2. **API Call** → `fetch('/api/endpoint', { headers: { Authorization: 'Bearer <jwt>' } })`
3. **Next.js Rewrite** → Proxies to backend in dev, direct in production
4. **Express Route** → Matches route pattern
5. **Middleware** → `requireAuth` → `setTenant`
6. **Controller** → Calls service
7. **Service** → Database query (RLS automatically filters by tenant)
8. **Response** → JSON data back to frontend
9. **State Update** → React state updated, UI re-renders

### Multi-Tenant Data Isolation
1. JWT contains `tenantId`
2. `setTenant` middleware sets `app.current_tenant` PostgreSQL variable
3. RLS policies automatically filter queries
4. No manual tenant filtering needed in queries

---

## 📚 Key Concepts

### Multi-Tenancy
- **Complete data isolation** per tenant
- **Shared infrastructure** (single database, single codebase)
- **Tenant context** set per request via middleware
- **Super admin** bypasses tenant isolation

### Row Level Security (RLS)
- PostgreSQL feature for row-level access control
- Policies automatically applied to all queries
- Transparent to application code
- Ensures data isolation at database level

### Dynamic Branding
- Each tenant can customize colors, logos, banners
- Applied via CSS custom properties
- Loaded on authentication
- Cached in React context

### Calendar Integration
- FullCalendar for training/match scheduling
- Supports recurring events
- Date range filtering for performance

---

## 🧪 Testing

### Backend
- **Framework**: Jest + Supertest
- **Location**: `backend/tests/`
- **Pattern**: Test services and controllers

### Frontend
- **Framework**: Jest + React Testing Library
- **Location**: `frontend/tests/`
- **Pattern**: Test component rendering and interactions

---

## 🔧 Development Workflow

### Adding a New Feature

1. **Database**:
   - Create migration file in `backend/migrations/`
   - Number sequentially (e.g., `018_new_feature.sql`)
   - Include RLS policies if needed

2. **Backend**:
   - Create service in `backend/src/services/`
   - Create controller in `backend/src/controllers/`
   - Create routes in `backend/src/routes/`
   - Register routes in `backend/src/app.ts`

3. **Frontend**:
   - Create page in `frontend/pages/` or component in `frontend/components/`
   - Use `useAuth()` for authentication
   - Fetch data with JWT in headers
   - Apply branding classes for styling

### Migration Workflow
1. Create SQL migration file
2. Test locally
3. Deploy to production
4. Run migration manually on production database

---

## 📖 Additional Notes

### Super Admin Access
- Email: `superadmin@futbolclinic.com`
- Can manage all tenants
- `tenant_id = NULL` in database
- Special routes: `/tenants` management

### Demo Tenant
- Email: `admin@escuelademo.com`
- Tenant ID: `3292ecf6-aff2-43a6-995e-1c8c48d3a8a1`

### Security Considerations
- JWT tokens expire after 7 days
- Passwords hashed with bcrypt
- RLS ensures data isolation
- File uploads validated and stored securely
- CORS enabled for frontend domain

### Performance
- Database indexes on foreign keys
- Date range filtering for large datasets
- Lazy loading where appropriate
- Vercel Blob for CDN file delivery

---

## 🎯 Best Practices

1. **Always use TypeScript types** - Define interfaces for all data structures
2. **Follow the 3-layer architecture** - Routes → Controllers → Services
3. **Use middleware for cross-cutting concerns** - Auth, tenant context
4. **Apply RLS policies** - For all tenant-scoped tables
5. **Handle errors gracefully** - User-friendly error messages
6. **Use early returns** - Improve code readability
7. **Keep components focused** - Single responsibility
8. **Use context for global state** - Auth, branding
9. **Follow naming conventions** - Consistent across codebase
10. **Complete implementations** - No TODOs or placeholders

---

This document should be updated as the project evolves. Keep it synchronized with actual implementation patterns and architectural decisions.
