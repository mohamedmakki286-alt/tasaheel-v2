# Deployment Audit Report — Railway + Vercel + Supabase

## Project Overview

| Item | Value |
|------|-------|
| **Backend** | Spring Boot 3.2.0 / Java 17 / Maven |
| **Database** | Supabase PostgreSQL 15 |
| **Deployment** | Railway (Nixpacks builder) |
| **Frontends** | Vercel (Vite + React) |
| **WebSocket** | STOMP over SockJS |

## Architecture

```
Vercel (React SPA) ──HTTPS──▶ Railway (Spring Boot) ──JDBC/SSL──▶ Supabase (PostgreSQL)
       │                              │
       │ VITE_API_URL                 │ SPRING_DATASOURCE_URL
       │ VITE_WS_URL                  │ APPLICATION_JWT_SECRET
```

## Environment Variables

### Backend (Railway Dashboard)
| Variable | Required | Notes |
|----------|----------|-------|
| `SPRING_DATASOURCE_URL` | ✅ | Supabase connection string (`postgresql://` or `jdbc:postgresql://`) |
| `SPRING_DATASOURCE_USERNAME` | ✅ | Supabase user (e.g. `postgres.wrztvomdentxtcizotpv`) |
| `SPRING_DATASOURCE_PASSWORD` | ✅ | Supabase project password |
| `SPRING_PROFILES_ACTIVE` | ✅ | Set to `prod` |
| `APPLICATION_JWT_SECRET` | ✅ | 256-bit secret (Base64 or raw) |

### Frontends (Vercel Dashboard)
| Variable | Required | Dev Fallback |
|----------|----------|--------------|
| `VITE_API_URL` | ✅ | `http://localhost:8080/api` |
| `VITE_WS_URL` | ✅ | `ws://localhost:8080/ws` |

## Build Configuration

### Backend — Railway (Nixpacks)
- `nixpacks.toml` at repo root configures Maven + Java 17
- Build: `mvn -B clean package -DskipTests`
- Start: `java -jar target/salaba-backend-1.0.0.jar`
- No Dockerfile required for Railway deploy (Nixpacks auto-generates)

### Backend — Local (Docker)
- `backend/Dockerfile` available for local `docker build`
- Uses multi-stage: Maven compile → JRE runtime
- Paths: `COPY pom.xml .` / `COPY src ./src` (no `backend/` prefix)
- Run: `docker build -f backend/Dockerfile backend/`

### Frontends — Vercel
- Each frontend auto-deploys from `main` via Vercel Git integration
- Build: `npm run build` (tsc + vite)
- All env vars set in Vercel Dashboard per project

## Files Cleaned

### Deleted
| File | Reason |
|------|--------|
| `render.yaml` | Render platform (migrated to Railway) |
| `.koyeb.yaml` | Koyeb platform (unused) |
| `.github/workflows/deploy-backend.yml` | Render workflow |
| `.github/workflows/keep-alive.yml` | Render pinger |
| `ARCHITECTURE_FINAL.md` | Referenced Render |
| `CLEANUP_REPORT.md` | Outdated cleanup log |
| `DEPLOY.md` | Render deployment guide |
| `FINAL_AUDIT_REPORT.md` | Audit with Render references |
| `backend/docker-entrypoint.sh` | Replaced by DatabaseUrlConfig.java |
| `backend/start.bat`, `run-ddl.bat` | Old Windows scripts |
| `backend/ddl-generate.properties` | Old config |
| `backend/package.json`, `package-lock.json` | Stray Node.js files |
| `backend/*.err`, `*.log` | Old error logs |

### URLs Removed
| File | Old Value | New Value |
|------|-----------|-----------|
| `web-workshop/src/hooks/useWorkshopWebSocket.ts` | `wss://salaba-backend.onrender.com/ws` | `ws://localhost:8080/ws` (fallback) |
| `web-workshop/src/hooks/useRequestWebSocket.ts` | `wss://salaba-backend.onrender.com/ws` | `ws://localhost:8080/ws` (fallback) |
| `web-customer/src/hooks/useRequestWebSocket.ts` | `wss://salaba-backend.onrender.com/ws` | `ws://localhost:8080/ws` (fallback) |
| `web-customer/vite.config.ts` | `https://salaba-backend.onrender.com` + `wss://` | `http://localhost:8080` + `ws://` |
| `mobile-customer/src/utils/env.ts` | `https://salaba-backend.onrender.com/api` | `''` (env-var only) |
| `mobile-driver/src/utils/constants.ts` | `https://salaba-backend.onrender.com/api` | `''` (env-var only) |
| `mobile-customer/app.json` | `"apiUrl": "https://salaba-backend.onrender.com/api"` | `"apiUrl": ""` |
| `mobile-driver/app.json` | `"apiUrl": "https://salaba-backend.onrender.com/api"` | `"apiUrl": ""` |

## Design Decisions

1. **DatabaseUrlConfig.java** replaces `docker-entrypoint.sh` — converts `postgresql://` → `jdbc:postgresql://` at Spring Boot startup
2. **Nixpacks** instead of Dockerfile for Railway — simpler, no Dockerfile path issues
3. **All URLs** driven by env vars — zero hardcoded endpoints in production code
4. **Mobile apps** kept as source, not deployed — API URLs left empty to fail fast if used without config
5. **WebSocket** uses `ws://` for local, `wss://` for production (set via `VITE_WS_URL`)
