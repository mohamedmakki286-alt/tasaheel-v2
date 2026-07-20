# Tasaheel Platform — تساهيل

منصة رقمية متكاملة تربط العملاء وورش الصيانة والسائقين لطلب وإدارة خدمات صيانة السيارات.

## Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Customer │  │  Admin   │  │ Workshop │  ← Vercel SPA (React + Vite)
│  Web App │  │ Web App  │  │  Web App │
└─────┬────┘  └────┬─────┘  └────┬─────┘
      └────────────┼──────────────┘
                   │ HTTPS /api/*
                   ▼
           ┌───────────────┐
           │   Railway     │  ← Spring Boot 3.2 / Java 17
           │  REST API     │
           └───────┬───────┘
                   │ JDBC (SSL)
                   ▼
           ┌───────────────┐
           │   Supabase    │  ← PostgreSQL 15
           │  PostgreSQL   │
           └───────────────┘
```

## Services in Production

| Service | Platform | Tech | Status |
|---------|----------|------|--------|
| Backend API | Railway | Spring Boot 3.2 + Java 17 | ✅ Live |
| Admin Dashboard | Vercel | React 18 + TypeScript | ✅ Live |
| Workshop Dashboard | Vercel | React 18 + TypeScript | ✅ Live |
| Customer Portal | Vercel | React 18 + TypeScript | ✅ Live |
| Database | Supabase | PostgreSQL 15 | ✅ Live |

## Local Development

```bash
# Backend
cd backend && mvn spring-boot:run

# Frontends (in separate terminals)
cd web-admin    && npm run dev   # :5173
cd web-workshop && npm run dev   # :5174
cd web-customer && npm run dev   # :5175
```

## Project Structure

```
├── backend/                 # Spring Boot API (controllers, services, entities)
├── web-admin/               # Admin dashboard (React + Vite)
├── web-workshop/            # Workshop dashboard (React + Vite)
├── web-customer/            # Customer portal (React + Vite)
├── mobile-customer/         # Customer mobile app (React Native + Expo)
├── mobile-driver/           # Driver mobile app (React Native + Expo)
├── supabase/                # DB migrations
├── docs/                    # Environment docs
└── deployment/              # Deployment guides
```

## Integrations

- **Google Maps API** — location, routing, live tracking
- **Firebase FCM** — push notifications
- **Moyasar** — payments (Mada, Visa, Apple Pay, STC Pay)
- **WebSocket** — chat + driver location
- **Resend** — email notifications

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | `ahmed@tasaheel.sa` | `123456` |
| Workshop | `workshop@tasaheel.sa` | `123456` |
| Workshop | `tech@tasaheel.sa` | `123456` |
| Workshop | `master@tasaheel.sa` | `123456` |
