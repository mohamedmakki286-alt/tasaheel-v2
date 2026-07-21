# Data Fetching Audit

## Pages That Don't Fetch Data

| Page | File Path | Issue | Severity |
|---|---|---|---|
| Home Page (Customer) | `web-customer/pages/HomePage.tsx` | Hardcoded `MOCK_WORKSHOPS` array; no API call to `GET /workshops` | High |
| Biometric Login (Customer) | `web-customer/pages/LoginPage.tsx` | Button shown but no fetch — UI-only placeholder | Medium |

## Pages With Eternal Loading States

| Page | File Path | Issue | Root Cause | Severity |
|---|---|---|---|---|
| Invoices Page | `admin/pages/InvoicesPage.tsx` | Spinner never resolves | Backend `GET /invoices` returns 500 — JPQL CAST syntax error | Critical |
| Maintenance Requests | `admin/pages/MaintenancePage.tsx` | Spinner never resolves | Backend `GET /maintenance-requests` returns 500 — JPQL CAST syntax error + SQL JOIN syntax | Critical |

## Mock Data Fallbacks

| File | Mock Data | Fallback Behavior | Issue |
|---|---|---|---|
| `web-customer/pages/HomePage.tsx` | `MOCK_WORKSHOPS` (hardcoded array) | Always shows mock data, never fetches real workshops | User sees fake workshop listings in all environments |
| `serviceListings.api.ts` | None | Console logs instead of proper error handling | Silent failures — user sees no feedback |

## Response Shape Mismatches

| File | Expected Shape | Actual Shape | Impact |
|---|---|---|---|
| `chats.api.ts` | `{ data: message }` (single JSON object) | Response already parsed — calling `.json()` again throws | Chat messages may fail to load |
| `maintenance.api.ts` | `{ data: [...] }` | Backend returns `{ content: [...], totalElements, totalPages }` | Component receives `undefined` data, infinite loading |
| `admin.api.ts` | Flat response | Backend wraps in `{ success: true, data: {...} }` | Stats data not extracted from wrapper |

## Missing Error Handling

| File | Function | Issue | Severity |
|---|---|---|---|
| `auth.api.ts` | `forgotPassword()` | Raw `fetch()` — no try/catch, no error mapping, no interceptor | High |
| `auth.api.ts` | `resetPassword()` | Raw `fetch()` — no try/catch, no error mapping, no interceptor | High |
| `chats.api.ts` | `sendMessage()` | No error handling on failed send | Medium |
| `serviceListings.api.ts` | `createServiceListing()` | Console.log only — no user-facing error | Medium |
| `offers.api.ts` | `createOffer()` | No error handling for failed offer creation | Medium |
| `workshop.api.ts` | `getWorkshops()` | No error handling — failures silently swallowed | Medium |

## Data Fetching Flow Summary

```
┌─────────────────────────────────────────────────┐
│                  Frontend Apps                    │
├─────────────────────────────────────────────────┤
│  web-customer    │  web-workshop  │  web-admin   │
│  ────────────    │  ────────────  │  ──────────  │
│  ✅ Login        │  ✅ Login      │  ✅ Login    │
│  ✅ Home(fail)   │  ✅ Services   │  ✅ Stats    │
│  ⚠️ Chat         │  ⚠️ Chats      │  ❌ Invoices │
│  ⚠️ Orders       │  ⚠️ Offers     │  ❌ Maint.   │
│  ⚠️ Notif.       │  ✅ Listings   │  ✅ Users    │
│  ❌ Mock data    │  ✅ Gallery    │  ⚠️ Notif.   │
└─────────────────────────────────────────────────┘

✅ = Working    ⚠️ = Partial    ❌ = Broken
```

## Root Causes by Category

### Backend JPQL Errors (2 endpoints broken)
- `InvoiceRepository.java:31` — `CAST(i.paidAt AS date)` invalid in JPQL
- `MaintenanceRequestRepository.java:24` — `CAST(r.createdAt AS date)` invalid in JPQL
- `MaintenanceRequestRepository.java:26` — SQL `INNER JOIN` syntax, should be JPQL entity join

### Frontend Response Parsing (2 issues)
- `chats.api.ts` — double unwrapping `.json()` on pre-parsed data
- `maintenance.api.ts` — expects `{ data: [...] }` but gets `{ content: [...] }`

### Missing .env Configuration (3 apps)
- `web-customer` — no `.env` → WebSocket fallback to localhost
- `web-workshop` — no `.env` → WebSocket fallback to localhost
- `web-admin` — no `.env` with correct production URL
