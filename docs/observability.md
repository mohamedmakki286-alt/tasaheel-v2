# Observability — Tasaheel Platform

## Unified Flow

```
User Request
   ↓
Frontend (Sentry captures UI errors + performance traces)
   ↓
HTTP (X-Request-ID header injected by browser/dev)
   ↓
Spring Boot (RequestLoggingFilter logs method, URI, status, duration)
   ↓
Exception Handler logs security events (failed login, access denied, 500s)
   ↓
Supabase (slow query tracking via Dashboard)
   ↓
Monitoring (UptimeRobot pings /actuator/health every 1 min)
   ↓
Alerts (Telegram on deploy failure + UptimeRobot on downtime)
```

---

## 1. Backend — Spring Boot

### Actuator Endpoints

| Endpoint | Purpose | Visibility |
|----------|---------|------------|
| `GET /actuator/health` | Liveness + readiness probe | Public (no auth) |
| `GET /actuator/info` | App metadata | Restricted |
| `GET /actuator/metrics` | JVM, CPU, memory, thread metrics | Restricted |
| `GET /actuator/prometheus` | Prometheus scrape endpoint | Restricted |
| `GET /actuator/loggers` | Dynamic log level changes | Restricted |

Configured in `application-prod.yml`:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,loggers
  endpoint:
    health:
      show-details: when-authorized
```

### Request Tracing

Each HTTP request gets a correlation ID via `RequestLoggingFilter`:

- **Header:** `X-Request-ID` (client can pass it; auto-generated if missing)
- **Logged:** every request logs `METHOD /path → STATUS (DURATIONms)`
- **MDC:** `X-Request-ID` is available in all subsequent log statements via `[%X{X-Request-ID}]` in the log pattern

### Logging Format

```
2026-06-15 14:30:22.456 [http-nio-8080-exec-1] INFO  c.s.config.RequestLoggingFilter [a1b2c3d4] - POST /api/auth/login → 200 (45ms)
2026-06-15 14:30:22.789 [http-nio-8080-exec-2] WARN  c.s.exception.GlobalExceptionHandler [a1b2c3d4] - Failed login attempt
```

### Metrics (Micrometer + Prometheus)

Dependency: `micrometer-registry-prometheus`

Available metrics via `/actuator/metrics` and `/actuator/prometheus`:

| Metric | Description |
|--------|-------------|
| `jvm.memory.used` | JVM heap + non-heap usage |
| `jvm.threads.live` | Active thread count |
| `http.server.requests` | HTTP request count + duration (histogram) |
| `hikaricp.connections.active` | Active DB connections |
| `logback.events` | Log event counts by level |
| `process.cpu.usage` | CPU usage |

### Security Observability

The `GlobalExceptionHandler` logs security events at WARN level:

- Failed login attempts (`BadCredentialsException`)
- Unauthorized access attempts (`AccessDeniedException`)
- Unhandled exceptions logged at ERROR level with full stack trace

---

## 2. Frontends — Sentry (3 apps)

### Integration

Sentry is initialized in `main.tsx` for all 3 frontends:

```ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
});
```

### Env Var (set in Vercel Dashboard)

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SENTRY_DSN` | Sentry project DSN | ✅ |

### Captured Events

- Unhandled React errors (automatic via `@sentry/react`)
- Unhandled promise rejections (automatic)
- Console errors (if configured)
- Performance traces (20% sample rate via `tracesSampleRate: 0.2`)

---

## 3. Database — Supabase

Enable via Supabase Dashboard:

```
Project → Database → Query Performance → Enable Logs
Project → Authentication → Logs → Enable
```

Track:

- Slow queries (>500ms)
- Failed auth attempts
- Connection pool exhaustion
- Error logs

---

## 4. Uptime Monitoring — UptimeRobot

Create a monitor:

| Setting | Value |
|---------|-------|
| URL | `https://salaba-backend.up.railway.app/actuator/health` |
| Interval | 1 minute |
| Alert contacts | Email + Telegram |

---

## 5. Railway Logs

- Available in Railway Dashboard for each service
- All structured logs with timestamps and request IDs
- Logs persist for 7 days (default plan)
