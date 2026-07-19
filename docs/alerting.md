# Alerting — Tasaheel Platform

## 1. Deploy Failure — Telegram Bot

### Trigger

GitHub Actions workflow fails (any job in `deploy.yml`).

### Message Format

```
🚨 Deploy FAILED
Repo: org/tasaheel-platform
Branch: main
Author: username
Run: [View Logs](GitHub Actions URL)
```

### Setup

1. Create a Telegram bot via [@BotFather](https://t.me/botfather)
2. Get your chat ID via [@userinfobot](https://t.me/userinfobot)
3. Add to GitHub Secrets:

| Secret | Value |
|--------|-------|
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_CHAT_ID` | `-1001234567890` (group) or `123456789` (private) |

### Code (in `.github/workflows/deploy.yml`)

```yaml
- name: Notify Telegram
  if: failure()
  run: |
    curl -s -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
      -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
      -d parse_mode="Markdown" \
      -d text="🚨 *Deploy FAILED*
    Repo: ${{ github.repository }}
    Branch: ${{ github.ref_name }}
    Author: ${{ github.triggering_actor }}
    Run: [View Logs](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})"
```

---

## 2. Downtime — UptimeRobot

### Setup

1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add a new monitor:

| Setting | Value |
|---------|-------|
| Monitor Type | HTTP(s) |
| URL | `https://salaba-backend.up.railway.app/actuator/health` |
| Interval | 1 minute |
| Timeout | 30 seconds |

3. Add alert contacts:
   - Email: team email
   - Telegram: via UptimeRobot Telegram integration (@UptimeRobotBot)

### Alert Conditions

- Down (5 consecutive failures)
- Slow response (>10s)

---

## 3. Application Errors — Sentry

### Alert Rules (Sentry Dashboard)

| Condition | Action | Threshold |
|-----------|--------|-----------|
| Error count spike | Email + Slack/Telegram | >100 errors in 5 minutes |
| New issue created | Email | Any new unhandled error |
| Regression detected | Email | Previously resolved error reappears |

### Setup

1. Create project in [sentry.io](https://sentry.io)
2. Get DSN from Project Settings → Client Keys
3. Set `VITE_SENTRY_DSN` in Vercel Dashboard for all 3 frontends
4. Configure alert rules in Sentry → Alerts

---

## 4. Database — Supabase Alerts

Enable via Supabase Dashboard:

```
Project → Database → Query Performance → Alerts
```

Recommended alerts:

| Condition | Threshold |
|-----------|-----------|
| Connection count | >80% of pool |
| Query duration | P99 > 1 second |
| Error rate | >1% of total queries |
| Failed auth attempts | >10 per minute |

---

## 5. Alert Severity Matrix

| Event | Severity | Channel | Response Time |
|-------|----------|---------|---------------|
| Deploy failure | High | Telegram | Immediate |
| Backend down | Critical | Telegram + Email | <5 min |
| Error spike | High | Sentry Alert | <15 min |
| Slow queries | Medium | Email | <1 hour |
| Connection pool | Medium | Email | <1 hour |
| Database errors | High | Telegram | <15 min |

---

## 6. Runbooks

### Backend Down
1. Check Railway Dashboard for build/restart errors
2. Check Railway logs for OOM or DB connection failures
3. Verify Supabase is reachable
4. Restart service from Railway Dashboard
5. If persists: rollback via `git revert HEAD && git push`

### Deploy Failure
1. Check GitHub Actions logs for error details
2. Fix the issue in code
3. Push fix to main (auto-triggers new deploy)
4. Verify health check passes

### Error Spike
1. Open Sentry → Issues
2. Identify the error with highest occurrence
3. Check logs for `X-Request-ID` correlation
4. Reproduce locally with same input
5. Deploy fix via standard pipeline
