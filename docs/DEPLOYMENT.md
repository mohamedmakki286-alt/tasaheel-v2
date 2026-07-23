# Deployment Guide

## Repository

- **GitHub:** `mohamedmakki286-alt/tasaheel-v2`
- **Production Branch:** `main`
- **Feature Branches:** Create Preview Deployments automatically

## Vercel Projects

### Customer
- **Project:** `tasaheel-customer`
- **Root Directory:** `web-customer`
- **Framework:** Vite
- **URL:** Vercel default (no custom domain)

### Workshop
- **Project:** `tasaheel-workshop`
- **Root Directory:** `web-workshop`
- **Framework:** Vite
- **URL:** Vercel default (no custom domain)

### Admin
- **Project:** `tasaheel-admin`
- **Root Directory:** `web-admin`
- **Framework:** Vite
- **URL:** `admin.salabaa.com`

## Deployment Pipeline

### Preview (Feature Branches)
```
Push to feature branch → Vercel Preview Deployment
```

### Production (main)
```
Merge to main → Vercel Production Deployment
```

## Environment Variables

Required per project (set in Vercel Dashboard):

- `VITE_API_URL` — Backend API base URL
- `VITE_WS_URL` — WebSocket URL

Do not commit environment variable values to this repository.

## Rules

- **Do not use** `vercel deploy` or `vercel --prod` CLI commands
- **Do not upload** `dist/` manually
- **Do not** drag and drop deployments
- The only deployment path is GitHub → Vercel via Git Integration
- The only custom domain is `admin.salabaa.com`

## Local Development

```bash
# Backend
cd backend && mvn spring-boot:run

# Customer
cd web-customer && npm install && npm run dev

# Workshop
cd web-workshop && npm install && npm run dev

# Admin
cd web-admin && npm install && npm run dev
```
