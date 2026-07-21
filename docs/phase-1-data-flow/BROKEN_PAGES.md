# Broken Pages & Features

## Critical

| # | Page | File Path | What's Broken | Root Cause | Severity |
|---|---|---|---|---|---|
| 1 | Invoices (Admin/Workshop) | `admin/pages/InvoicesPage.tsx` | Perpetual loading spinner, no data shown | `GET /invoices` fails — JPQL `CAST(i.paidAt AS date)` syntax error in `InvoiceRepository.java:31` | Critical |
| 2 | Maintenance Requests | `admin/pages/MaintenancePage.tsx` | Perpetual loading spinner, no data shown | `GET /maintenance-requests` fails — JPQL `CAST(r.createdAt AS date)` in `MaintenanceRequestRepository.java:24`; SQL-style JOIN in line 26 | Critical |
| 3 | Chat (all apps) | `chats.api.ts` | Messages may fail to display | Double unwrapping: `response.data.json()` called on already-parsed JSON | Critical |
| 4 | WebSocket connections (all apps) | `apiClient.ts` | WebSocket connects to `localhost` in production | No `.env` files in web-customer, web-workshop; fallback `ws://localhost:8080` | Critical |

## High

| # | Page | File Path | What's Broken | Root Cause | Severity |
|---|---|---|---|---|---|
| 5 | Home Page (Customer) | `web-customer/pages/HomePage.tsx` | Shows only hardcoded mock workshops | `MOCK_WORKSHOPS` array hardcoded instead of fetching from API | High |
| 6 | Forgot Password | `auth.api.ts` | No auth interceptors, no error handling | Raw `fetch()` bypasses `apiClient` token handling | High |
| 7 | Reset Password | `auth.api.ts` | No auth interceptors, no error handling | Raw `fetch()` bypasses `apiClient` token handling | High |
| 8 | Notifications (Customer) | `NotificationsPage.tsx` | Click notification goes to wrong page | Routes to `/requests/:id` but orders page expects `/orders/:id` | High |
| 9 | Toggle User Status (Admin) | `admin.api.ts` | Toggle status may fail for workshops | Uses `/admin/users/workshop/:id` — inconsistent with other user endpoints | High |
| 10 | Service Listings (Workshop) | `serviceListings.api.ts` | Console.log in production code (line 97) | Debug `console.log` left in production API calls | High |

## Medium

| # | Page | File Path | What's Broken | Root Cause | Severity |
|---|---|---|---|---|---|
| 11 | Search (Customer) | `HomePage.tsx` | Search input does nothing | Search input is decorative — no handler wired | Medium |
| 12 | Search (Workshop Chats) | `ChatsPage.tsx` | Chat search doesn't filter | Search input is decorative — no filtering logic | Medium |
| 13 | Gallery Add (Workshop) | `ServicesPage.tsx` | No image upload capability | Uses `window.prompt()` for URL input instead of file upload | Medium |
| 14 | Offers Edit (Workshop) | `OffersPage.tsx` | Cannot edit existing offers | Edit functionality not implemented | Medium |
| 15 | Register Page (Workshop) | `RegisterPage.tsx` | Dead code — never reached | Route redirects to `/login`; component exists but is unreachable | Medium |
| 16 | Console.log (Workshop) | `ServicesPage.tsx:420-421` | Debug output in production | `console.log` left in component render path | Medium |

## Low

| # | Page | File Path | What's Broken | Root Cause | Severity |
|---|---|---|---|---|---|
| 17 | Legacy /app redirect | `App.tsx` (multiple) | `/app` routes redirect through chain | Legacy redirect from `/app` prefix creates unnecessary routing hops | Low |
| 18 | Biometric Auth (Customer) | `LoginPage.tsx` | Biometric button shown but non-functional | UI element exists with no backend implementation | Low |
| 19 | .env.example (Admin) | `web-admin/.env.example` | Points to Railway staging URL | `salaba-backend-production.up.railway.app` instead of actual production | Low |
