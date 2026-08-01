# Vercel Pro deployment

Deploy this monorepo as two Vercel projects. Do not deploy the repository root
as a single project.

## 1. Database

Create a PostgreSQL database with a pooled runtime URL and a direct migration
URL (for example, Neon pooled and direct endpoints).

Before the first production deployment:

```bash
cd backend
MIGRATOR_DATABASE_URL='postgresql://...' yarn migrate
```

Run migrations from CI or an administrator workstation. Never run them during a
serverless function request or application build.

## 2. Backend project

- Root Directory: `backend`
- Framework preset: Other
- Production branch: `main`
- Build command: `yarn vercel-build`

Production environment variables:

```text
NODE_ENV=production
DATABASE_URL=<pooled application-role URL>
MIGRATOR_DATABASE_URL=<direct migration-role URL; CI only>
DATABASE_MAX_CONNECTIONS=3
JWT_SECRET=<at least 32 random characters>
FRONTEND_URL=https://<frontend-domain>
CORS_ORIGINS=https://<frontend-domain>
BLOB_READ_WRITE_TOKEN=<public store token for logos and banners>
PRIVATE_BLOB_READ_WRITE_TOKEN=<private store token for personal files and proofs>
EMAIL_MOCK=false
GMAIL_USER=<mailer account>
GMAIL_PASS=<mailer app password>
EMAIL_FROM=<verified sender address>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
```

Do not expose database, JWT, Blob, or mail credentials to Preview deployments.
Use a separate preview database and Blob store if previews require backend data.

## 3. Frontend project

- Root Directory: `frontend`
- Framework preset: Next.js
- Production branch: `main`

Production environment variables:

```text
NEXT_PUBLIC_API_URL=/api
BACKEND_API_URL=https://<backend-domain>
```

`BACKEND_API_URL` is server-only and powers the Next.js rewrite. Do not put
secrets in variables prefixed with `NEXT_PUBLIC_`.

## 4. Release checks

1. Confirm `GET https://<backend-domain>/api/ready` returns `{"status":"ok"}`.
2. Confirm the frontend `/api/ready` rewrite reaches the same backend.
3. Test super-admin, admin, coach, and parent logins.
4. Suspend a test tenant and verify both new and existing sessions are blocked.
5. Upload and download a private test document.
6. Verify Pachuca cannot access another tenant's records.
7. Configure Vercel spend alerts and review function/Blob usage daily during the
   pilot.

## Rollback

Promote the previous successful Vercel deployment. Database migrations must be
backward-compatible; use the rollback notes in each migration if a database
rollback is unavoidable.
