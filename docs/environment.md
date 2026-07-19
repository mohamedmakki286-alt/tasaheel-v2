# Environment Variables — Tasaheel Platform

## Backend (Railway Dashboard)

| Variable | Source | Required | Default |
|----------|--------|----------|---------|
| `SPRING_DATASOURCE_URL` | Supabase PostgreSQL | ✅ | `jdbc:postgresql://localhost:5432/salaba_db` |
| `SPRING_DATASOURCE_USERNAME` | Supabase PostgreSQL | ✅ | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Supabase PostgreSQL | ✅ | — |
| `SPRING_PROFILES_ACTIVE` | Fixed | ✅ | `prod` |
| `APPLICATION_JWT_SECRET` | Custom (256-bit) | ✅ | — |
| `RESEND_API_KEY` | Resend.com | ❌ | — |
| `APPLICATION_UPLOAD_DIR` | Custom | ❌ | `/tmp/tasaheel/uploads` |
| `MOYASAR_SECRET_KEY` | Moyasar | ❌ | — |
| `GOOGLE_MAPS_API_KEY` | Google Cloud | ❌ | — |
| `GEMINI_API_KEY` | Google AI | ❌ | — |

## Frontends (Vercel Dashboard)

All 3 frontends share the same env var:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://salaba-backend-xxxxx.up.railway.app/api` | ✅ |

## CI/CD Pipeline (GitHub Actions Secrets)

| Secret | Required | Used In |
|--------|----------|---------|
| `RAILWAY_DEPLOY_HOOK` | ✅ | Railway deploy trigger (POST webhook) |
| `VERCEL_TOKEN` | ✅ | Vercel CLI authentication |
| `BACKEND_URL` | ✅ | Post-deploy health check |
| `SUPABASE_URL` | ❌ | (optional, managed via Railway vars) |

Pipeline: `.github/workflows/deploy.yml` — runs on `git push main`

Flow:
```
push main → Build Backend → Railway Deploy → Health Check → Build Frontends → Vercel Deploy → Done
```

## Mobile Apps (not deployed)

| File | Key |
|------|-----|
| `mobile-customer/src/utils/env.ts` | `apiUrl` |
| `mobile-driver/src/utils/constants.ts` | `API_URL` |

## Local Development

| Service | Command | URL |
|---------|---------|-----|
| Backend | `cd backend && mvn spring-boot:run` | `http://localhost:8080` |
| Web-Admin | `cd web-admin && npm run dev` | `http://localhost:5173` |
| Web-Workshop | `cd web-workshop && npm run dev` | `http://localhost:5174` |
| Web-Customer | `cd web-customer && npm run dev` | `http://localhost:5175` |
| Database | Supabase Local CLI | `postgresql://localhost:54322/postgres` |
