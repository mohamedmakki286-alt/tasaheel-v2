# Changed Files — Phase 1: Data Flow Audit

## Backend Changes

| # | File | Change Description | Status |
|---|---|---|---|
| 1 | `MaintenanceRequestService.java` | Fixed Arabic text encoding — replaced hardcoded Arabic strings with parameterized values | ✅ Fixed |
| 2 | `CustomerService.java` | Added `preferredWorkshopId` column support to customer entity | ✅ Fixed |

### Pending Backend Fixes

| # | File | Issue | Status |
|---|---|---|---|
| 3 | `InvoiceRepository.java:31` | `CAST(i.paidAt AS date)` — invalid JPQL syntax | ❌ Not Fixed |
| 4 | `MaintenanceRequestRepository.java:24` | `CAST(r.createdAt AS date)` — invalid JPQL syntax | ❌ Not Fixed |
| 5 | `MaintenanceRequestRepository.java:26` | SQL-style `INNER JOIN` — should be JPQL entity join | ❌ Not Fixed |

## Frontend Changes

### web-customer
| # | File | Change Description | Status |
|---|---|---|---|
| 1 | `apiClient.ts` | Identified WebSocket localhost fallback issue | ⚠️ Documented |
| 2 | `HomePage.tsx` | Identified hardcoded `MOCK_WORKSHOPS` | ⚠️ Documented |
| 3 | `chats.api.ts` | Identified double `.json()` unwrap bug | ⚠️ Documented |
| 4 | `auth.api.ts` | Identified raw `fetch()` in forgotPassword/resetPassword | ⚠️ Documented |
| 5 | `NotificationsPage.tsx` | Identified `/requests/:id` vs `/orders/:id` navigation bug | ⚠️ Documented |

### web-workshop
| # | File | Change Description | Status |
|---|---|---|---|
| 1 | `serviceListings.api.ts:97` | Identified `console.log` in production code | ⚠️ Documented |
| 2 | `ServicesPage.tsx:420-421` | Identified `console.log` in production code | ⚠️ Documented |
| 3 | `RegisterPage.tsx` | Identified dead code (redirected to /login) | ⚠️ Documented |
| 4 | `OffersPage.tsx` | Identified missing edit functionality | ⚠️ Documented |
| 5 | `ChatsPage.tsx` | Identified decorative search input | ⚠️ Documented |

### web-admin
| # | File | Change Description | Status |
|---|---|---|---|
| 1 | `.env.example` | Identified Railway staging URL (salaba-backend-production.up.railway.app) | ⚠️ Documented |
| 2 | `admin.api.ts` | Identified inconsistent toggle-status endpoint `/admin/users/workshop/:id` | ⚠️ Documented |

## Documentation Created

| # | File | Description |
|---|---|---|
| 1 | `docs/phase-1-data-flow/API_MAPPING.md` | Complete API endpoint mapping |
| 2 | `docs/phase-1-data-flow/BROKEN_PAGES.md` | All broken pages/features |
| 3 | `docs/phase-1-data-flow/DATA_FETCH_AUDIT.md` | Data fetching issues |
| 4 | `docs/phase-1-data-flow/SAVE_OPERATIONS_AUDIT.md` | Save operation issues |
| 5 | `docs/phase-1-data-flow/TEST_RESULTS.md` | Test results and credentials |
| 6 | `docs/phase-1-data-flow/REMAINING_BLOCKERS.md` | Production blockers |
| 7 | `docs/phase-1-data-flow/MANUAL_TEST_CHECKLIST.md` | Manual testing checklist |
| 8 | `docs/phase-1-data-flow/CHANGED_FILES.md` | This file |

## Summary

| Category | Fixed | Documented | Total |
|---|---|---|---|
| Backend | 2 | 3 | 5 |
| Frontend | 0 | 13 | 13 |
| Documentation | 0 | 8 | 8 |
| **Total** | **2** | **24** | **26** |
