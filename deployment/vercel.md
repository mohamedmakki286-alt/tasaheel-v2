# Vercel Deployment — Tasaheel Frontends

## Frontends

| App | Directory | Vercel URL |
|-----|-----------|------------|
| **Admin Dashboard** | `web-admin/` | `web-admin-seven-taupe.vercel.app` |
| **Workshop Dashboard** | `web-workshop/` | `web-workshop-opal.vercel.app` |
| **Customer Portal** | `web-customer/` | `salaba-platform.vercel.app` |

## Build Settings (per project)

Each frontend uses the same Vercel config:

- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Dir:** `dist/`
- **Install Command:** `npm ci`

## Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://salaba-backend-xxxxx.up.railway.app/api` |

Set per-project in Vercel Dashboard > Settings > Environment Variables.

## Custom Domains

Already configured in Vercel Dashboard for each project.

## Auto-Deploy

Vercel auto-deploys from the `main` branch via Git integration. Each frontend repo's `vercel.json` is in its own directory.
