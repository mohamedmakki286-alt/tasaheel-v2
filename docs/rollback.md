# Rollback Strategy — Tasaheel Platform

## Trigger Conditions

Rollback is triggered when ANY of the following occur:

| Condition | Detection | Source |
|-----------|-----------|--------|
| Health check fails | `GET /actuator/health` returns non-200 | GitHub Actions |
| Smoke test fails | API endpoint returns 5xx | GitHub Actions |
| Error rate > 5% | Sentry spike alert | Sentry |
| DB connection failure | HikariCP metrics = 0 active | Manual check |

---

## Automated Rollback Flow

```
                   ┌─────────────────────────┐
                   │  git push main          │
                   └─────────┬───────────────┘
                             ▼
                   ┌─────────────────────────┐
                   │  GitHub Actions Deploy  │
                   └─────────┬───────────────┘
                             ▼
                   ┌─────────────────────────┐
                   │  Health Gate (30 retries)│
                   └──────┬──────────┬───────┘
                          │          │
                      PASS ▼          ▼ FAIL
                   ┌──────────┐  ┌──────────────────┐
                   │ GO LIVE  │  │ Auto Rollback    │
                   └──────────┘  │ Railway + Vercel │
                                 └────────┬─────────┘
                                          ▼
                                 ┌──────────────────┐
                                 │ Telegram Alert   │
                                 │ "ROLLBACK DONE"  │
                                 └──────────────────┘
```

## How Rollback Works Per Platform

### Railway

Railway automatically keeps the previous deploy. Two rollback methods:

**Method 1: Automatic (via webhook)**
```bash
# Set as GitHub Secret: RAILWAY_ROLLBACK_HOOK
curl -X POST $RAILWAY_ROLLBACK_HOOK
```

**Method 2: Manual (CLI)**
```bash
railway rollback
# Or via Railway Dashboard → Deployments → Rollback
```

### Vercel

Vercel keeps all previous deployments. Rollback by re-assigning the production alias:

```bash
vercel rollback web-admin --token=$VERCEL_TOKEN --yes
vercel rollback web-workshop --token=$VERCEL_TOKEN --yes
vercel rollback web-customer --token=$VERCEL_TOKEN --yes
```

Or in Dashboard: Project → Deployments → ⋮ → Promote to Production

### Code

```bash
git revert HEAD --no-edit
git push origin main
```

This triggers a new deploy (with the reverted code) via the same pipeline.

---

## Rollback Pipeline

File: `.github/workflows/rollback.yml`

Triggers automatically when `CI/CD Pipeline` completes with `failure`.

### What it does:
1. Calls `RAILWAY_ROLLBACK_HOOK` → Railway reverts to last stable deploy
2. `vercel rollback` for all 3 frontends
3. Notifies Telegram with full details
4. Prints recovery instructions

### GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `RAILWAY_ROLLBACK_HOOK` | Railway deploy rollback webhook |
| `VERCEL_TOKEN` | Vercel CLI auth for rollback |
| `TELEGRAM_BOT_TOKEN` | Telegram notification |
| `TELEGRAM_CHAT_ID` | Telegram target chat |

---

## Recovery Runbook

### Issue: Backend health check fails
```
1. git revert HEAD --no-edit
2. git push origin main
3. Verify new deploy in GitHub Actions
4. Monitor health gate
5. Root cause analysis:
   - Check Railway logs for OOM or DB errors
   - Check Supabase connectivity
   - Verify env vars in Railway Dashboard
```

### Issue: Frontend broken after deploy
```
1. In Vercel Dashboard → Deployment → ⋮ → Promote to Production
2. git revert HEAD --no-edit
3. git push origin main
4. Check VITE_API_URL and VITE_WS_URL are correct
5. Ensure Sentry DSN is set
```

### Issue: Database migration failed
```
1. Rollback code (git revert)
2. Restore Supabase from backup if needed
3. Fix migration script
4. Deploy fix via standard pipeline
```

---

## Architecture

```
Git Push
   ↓
GitHub Actions Deploy
   ↓
Health Check (30 retries, 10s apart = 5 min max)
   ↓
IF PASS → Smoke Tests (health, info, prometheus)
   │           ↓
   │         All PASS → GO LIVE
   │
   └── IF ANY FAIL → Auto Rollback
                       ↓
              Railway → previous deploy
              Vercel  → previous alias
              Telegram → alert
                       ↓
              Manual Fix → git push → re-deploy
```
