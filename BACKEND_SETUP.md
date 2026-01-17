# Backend Setup Guide

This guide will help you initialize and run the backend for the first time.

## Prerequisites

- ✅ PostgreSQL database `futbol_clinic` created
- ✅ Database user with proper permissions
- ✅ Node.js v20+ installed
- ✅ Yarn package manager installed

## Step-by-Step Setup

### 1. Verify .env Configuration

Navigate to the `backend` directory and ensure your `.env` file has the following variables:

```env
DATABASE_URL=postgres://username:password@localhost:5432/futbol_clinic
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
PORT=4000
```

**Important:**
- Replace `username` and `password` with your PostgreSQL credentials
- Replace `localhost:5432` if your database is on a different host/port
- Generate a strong `JWT_SECRET` (you can use: `openssl rand -base64 32`)

### 2. Install Dependencies

```bash
cd backend
yarn install
```

This will install all required npm packages.

### 3. Run Database Migrations

You have three options:

#### Option A: Using the Root Migration File (Recommended - Easiest)

The project includes a `run_migrations.sql` file in the root directory that runs all migrations in order:

```bash
# From the project root directory
psql postgres://username:password@localhost:5432/futbol_clinic -f run_migrations.sql
```

Or if you prefer to connect first and then run:

```bash
# Connect to your database
psql postgres://username:password@localhost:5432/futbol_clinic

# Then inside psql, run:
\i run_migrations.sql
```

#### Option B: Using the Migration Script

```bash
cd backend
./run-migrations.sh
```

#### Option C: Manual Migration (if other options don't work)

Run each migration file individually:

```bash
cd backend
psql postgres://username:password@localhost:5432/futbol_clinic -f migrations/001_init.sql
psql postgres://username:password@localhost:5432/futbol_clinic -f migrations/002_players_and_reset.sql
# ... continue with all 17 migrations
```

### 4. Verify Database Connection

Test the database connection:

```bash
cd backend
yarn dev
```

If the connection is successful, you should see:
```
Servidor escuchando en puerto 4000
```

If you see errors, check:
- Database is running: `pg_isready` or `psql -U username -d futbol_clinic -c "SELECT 1;"`
- DATABASE_URL in .env is correct
- Database user has proper permissions

### 5. Test the API

Once the server is running, test the health endpoint:

```bash
curl http://localhost:4000/api/health
```

You should get: `{"status":"ok"}`

Test database connection:

```bash
curl http://localhost:4000/api/db-test
```

You should get a response with the current database time.

## Troubleshooting

### Error: "Cannot find module"
**Solution:** Run `yarn install` in the backend directory.

### Error: "Connection refused" or "ECONNREFUSED"
**Solution:** 
- Verify PostgreSQL is running: `pg_isready` or check service status
- Verify DATABASE_URL in .env is correct
- Check if PostgreSQL is listening on the correct port (default: 5432)

### Error: "password authentication failed"
**Solution:**
- Verify username and password in DATABASE_URL
- Check PostgreSQL user permissions

### Error: "database does not exist"
**Solution:**
- Create the database: `createdb futbol_clinic`
- Or connect to PostgreSQL and run: `CREATE DATABASE futbol_clinic;`

### Error: "relation does not exist"
**Solution:**
- Migrations haven't been run yet
- Run all migrations in order (see Step 3)

### Migration Errors
**Solution:**
- Check if previous migrations ran successfully
- Some migrations may have "IF NOT EXISTS" clauses, so re-running is usually safe
- Check PostgreSQL logs for detailed error messages

## Next Steps

Once the backend is running:

1. **Test Authentication:**
   - The super admin user should be created (from migration 009)
   - Email: `superadmin@futbolclinic.com`
   - Password: Check migration file or reset it

2. **Create a Tenant:**
   - Use the API or create directly in the database
   - Example: `POST /api/tenants` (requires super admin)

3. **Start Frontend:**
   - Navigate to `frontend` directory
   - Run `yarn install && yarn dev`

## Quick Commands Reference

```bash
# Install dependencies
cd backend && yarn install

# Run migrations (from project root)
psql postgres://username:password@localhost:5432/futbol_clinic -f run_migrations.sql

# Or using the shell script
cd backend && ./run-migrations.sh

# Start development server
cd backend && yarn dev

# Build for production
cd backend && yarn build

# Run production server
cd backend && yarn start
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/futbol_clinic` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (optional) | For file uploads |
| `FRONTEND_URL` | Frontend URL (optional) | `http://localhost:3000` |

---

**Need Help?** Check the main README.md or PROJECT_CONTEXT.md for more details.
