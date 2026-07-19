# Post-Deployment: 15-Minute Health Check

Run this checklist immediately after every production deploy.

---

## Minute 0-2: Backend Health

```bash
# 1. Actuator health
curl -s https://salaba-backend.up.railway.app/actuator/health | jq .
# Expected: {"status":"UP","components":{"db":{"status":"UP"},"ping":{"status":"UP"}}}

# 2. Response time
time curl -sf https://salaba-backend.up.railway.app/actuator/health
# Expected: < 500ms
```

### Pass Criteria
| Check | Expected | Actual |
|-------|----------|--------|
| `status` | `UP` | |
| `db.status` | `UP` | |
| Response time | `< 500ms` | |

---

## Minute 2-4: Database Connectivity

```bash
# 3. Metrics — connection pool
curl -s https://salaba-backend.up.railway.app/actuator/metrics/hikaricp.connections.active
curl -s https://salaba-backend.up.railway.app/actuator/metrics/hikaricp.connections.idle
```

### Pass Criteria
- `hikaricp.connections.active` < 5
- `hikaricp.connections.idle` > 0
- No authentication errors in Railway logs

---

## Minute 4-6: API Core Endpoints

```bash
# 4. Login
curl -s -X POST https://salaba-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ahmed@test.com","password":"0575903086"}' | jq .
# Expected: 200 + JWT token

# 5. Services (public)
curl -sf https://salaba-backend.up.railway.app/api/services | jq .
# Expected: 200 + array

# 6. Workshops (public)
curl -sf https://salaba-backend.up.railway.app/api/workshops | jq .
# Expected: 200 + array
```

### Pass Criteria
| Endpoint | Expected | Actual |
|----------|----------|--------|
| `POST /api/auth/login` | `200` + JWT | |
| `GET /api/services` | `200` + array | |
| `GET /api/workshops` | `200` + array | |

Response time per endpoint: `< 1000ms`

---

## Minute 6-10: Frontends

### Open each app in browser:

| App | URL | Checks |
|-----|-----|--------|
| Admin | `https://web-admin-seven-taupe.vercel.app` | Login, Dashboard loads |
| Workshop | `https://web-workshop-opal.vercel.app` | Login, Requests load |
| Customer | `https://salaba-platform.vercel.app` | Home page, Workshop list |

### Per app, open DevTools Console and verify:
```
✅ No 4xx or 5xx API errors
✅ No CORS errors
✅ WebSocket connected (ws:// or wss://)
✅ No unhandled promise rejections
✅ No console.error messages
✅ VITE_WS_URL — verify no localhost fallback (must be production wss://)
```

---

## Minute 10-12: WebSocket Stability

```javascript
// In browser DevTools Console:
// Check STOMP/WebSocket connection
// Look for: WebSocket connected or STOMP: connected
// Verify URL is wss:// (production) not ws://localhost
```

### Pass Criteria
- WebSocket connects within 5 seconds
- No reconnect loops (>3 reconnects = WARN)
- URL uses `wss://` (production) not `ws://localhost`
- No STOMP errors in console

---

## Minute 12-14: Sentry Error Monitoring

```bash
# Check Sentry dashboard (sentry.io)
# Verify:
```

| Check | Expected | Actual |
|-------|----------|--------|
| Error volume | No spike vs previous 15 min | |
| New issues | 0 new issues | |
| Throughput | Consistent with baseline | |

---

## Minute 14-15: Railway Logs

```bash
# In Railway Dashboard → Service → Logs
# Search for:
```

| Pattern | Severity | Action |
|---------|----------|--------|
| `NullPointerException` | CRITICAL | Rollback |
| `Connection refused` | CRITICAL | Check Supabase |
| `SQLException` | HIGH | Check DB |
| `Timeout` | WARN | Review if rising |
| `OutOfMemoryError` | CRITICAL | Rollback |

---

## Status Summary

| Area | GO | WARN | NO-GO |
|------|----|------|-------|
| Backend Health | | | |
| DB Connectivity | | | |
| API Endpoints | | | |
| Frontend Stability | | | |
| WebSocket | | | |
| Sentry Errors | | | |
| Logs | | | |

### Final Verdict

- **GO** → All checks pass. Deploy is stable.
- **WARN** → Minor issues (e.g. slow response). Monitor for 30 min.
- **NO-GO** → CRITICAL failure. `git revert HEAD && git push` immediately.

---

## Quick Rollback Commands

```bash
# Revert code
git revert HEAD --no-edit
git push origin main

# Force Railway rollback
curl -X POST $RAILWAY_ROLLBACK_HOOK

# Force Vercel rollback
npx vercel rollback web-admin --prod --token=$VERCEL_TOKEN
npx vercel rollback web-workshop --prod --token=$VERCEL_TOKEN
npx vercel rollback web-customer --prod --token=$VERCEL_TOKEN
```
