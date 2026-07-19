# FINAL PRODUCTION STATUS — Tasaheel Platform

**Date:** 2026-06-15  
**Branch:** `cleanup-production`  
**Audit Scope:** Repository cleanup, deployment configs, build verification, hardcoded URL audit

---

## 1. Deployment Readiness

| Area | Status | Details |
|------|--------|---------|
| **Cleanup** | ✅ Ready | Render/Koyeb/GitHub Actions deleted; docs updated |
| **Dockerfile** | ✅ Ready | Clean `COPY pom.xml` / `COPY src` (no `backend/` prefix) |
| **railway.json** | ✅ Ready | `builder: NIXPACKS` |
| **nixpacks.toml** | ✅ Created | Maven Java 17 build + start command |
| **.gitignore** | ✅ Updated | Added `supabase/.temp/` |
| **Frontend builds** | ✅ All 3 pass | web-admin (32s), web-workshop (21s), web-customer (21s) |
| **Backend build (Maven)** | ❌ Not tested | Maven not available on local machine |
| **TypeScript check** | ✅ PASS | `tsc` runs as part of `npm run build` |
| **Lint** | ⚠️ None configured | No `npm run lint` scripts exist in any frontend |

## 2. Supabase & Database Configuration

| Config | Status | Notes |
|--------|--------|-------|
| **DatabaseUrlConfig.java** | ✅ Correct | Adds `jdbc:` prefix if missing from `SPRING_DATASOURCE_URL` |
| **application-prod.yml** | ✅ Correct | `ddl-auto: validate`, `sql.init.mode: never`, SSL required |
| **application.yml (dev)** | ✅ Acceptable | H2 in-memory for dev; `dev-jwt-secret-not-for-production` fallback |
| **Supabase .temp/** | ✅ Removed | Added to `.gitignore` |

## 3. BLOCKING: Hardcoded Render URLs

**8 files** still contain `salaba-backend.onrender.com` (shutdown platform):

### WebSocket Fallbacks (3 files — PRODUCTION CODE)
| File | Line | Bad URL |
|------|------|---------|
| `web-workshop/src/hooks/useWorkshopWebSocket.ts` | 7 | `wss://salaba-backend.onrender.com/ws` |
| `web-workshop/src/hooks/useRequestWebSocket.ts` | 6 | `wss://salaba-backend.onrender.com/ws` |
| `web-customer/src/hooks/useRequestWebSocket.ts` | 6 | `wss://salaba-backend.onrender.com/ws` |

These use `VITE_WS_URL` env var with Render URL as fallback. Production will connect to Render instead of Railway if `VITE_WS_URL` is not set in Vercel.

### Mobile App Fallbacks (4 files — NOT IN PRODUCTION)
| File | Line | Bad URL |
|------|------|---------|
| `mobile-customer/src/utils/env.ts` | 11 | `https://salaba-backend.onrender.com/api` |
| `mobile-driver/src/utils/constants.ts` | 3 | `https://salaba-backend.onrender.com/api` |
| `mobile-customer/app.json` | 27 | `https://salaba-backend.onrender.com/api` |
| `mobile-driver/app.json` | 27 | `https://salaba-backend.onrender.com/api` |

Mobile apps are not deployed. These would break when Mobile is released.

### Vite Dev Proxy (1 file — DEV ONLY)
| File | Line | Bad URL |
|------|------|---------|
| `web-customer/vite.config.ts` | 12, 15 | `https://salaba-backend.onrender.com` + `wss://` |

Dev proxy points to Render backend. Local dev will fail when Render is deactivated.

## 4. Outdated Documents

| File | Problem |
|------|---------|
| `DEPLOYMENT_AUDIT.md` | References old Dockerfile with `docker-entrypoint.sh`, `backend/` COPY prefix, and old `railway.json` (DOCKERFILE). Needs updated to reflect Nixpacks + current state. |

## 5. Remaining Production Risks

| Risk | Severity | Details |
|------|----------|---------|
| No Maven build verification | Medium | Can't confirm `mvn package` succeeds after changes |
| No automated tests | High | Never had tests; any refactor is blind |
| WebSocket hardcoded Render URL | **CRITICAL** | Vercel must set `VITE_WS_URL` or WS will break in prod |
| `dev-jwt-secret-not-for-production` fallback in `application.yml` | Low | Overridden by `application-prod.yml` but risky if profile is wrong |
| Empty API key fallbacks (Moyasar, Google Maps, Gemini, SendGrid) in prod | Medium | Set to empty string; will fail silently |
| HikariCP pool of 5 connections | Medium | May be too small under load |

## 6. Go / No-Go Recommendation

### 🛑 **NO-GO** — Do not push to main

**Blocking issues to fix before push:**
1. Update `VITE_WS_URL` in Vercel Dashboard for all 3 frontends (or fix hardcoded fallbacks)
2. Fix `web-customer/vite.config.ts` → proxy to `localhost:8080` (matching admin/workshop)
3. Mobile apps: update `onrender.com` URLs (low priority since not deployed, but good practice)
4. Run `mvn clean package -DskipTests` locally (requires Maven installation) or use GitHub Actions
5. Update `DEPLOYMENT_AUDIT.md` to reflect current configuration

**After fixes, re-run this audit before pushing.**
