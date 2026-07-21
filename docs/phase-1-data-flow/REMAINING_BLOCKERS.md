# Remaining Blockers for Production

## Critical Blockers

### 1. Backend JPQL CAST Syntax Errors
**Status:** ❌ Blocks 2 features
**Files:**
- `InvoiceRepository.java:31` — `CAST(i.paidAt AS date)` invalid in JPQL
- `MaintenanceRequestRepository.java:24` — `CAST(r.createdAt AS date)` invalid in JPQL
- `MaintenanceRequestRepository.java:26` — SQL-style `INNER JOIN` instead of JPQL entity join

**Fix Required:**
```java
// BEFORE (broken):
@Query("SELECT i FROM Invoice i WHERE CAST(i.paidAt AS date) = CURRENT_DATE ...")

// AFTER (JPQL-compliant):
@Query("SELECT i FROM Invoice i WHERE FUNCTION('DATE', i.paidAt) = CURRENT_DATE ...")
```

**Impact:** Invoices and Maintenance Requests pages completely broken in admin panel.

---

### 2. Missing Frontend .env Files
**Status:** ❌ Blocks WebSocket in production
**Affected Apps:**
- `web-customer` — no `.env` file
- `web-workshop` — no `.env` file
- `web-admin` — `.env.example` has Railway staging URL, no actual `.env`

**Fix Required:**
```env
# web-customer/.env
VITE_API_URL=https://your-production-api.com
VITE_WS_URL=wss://your-production-api.com

# web-workshop/.env
VITE_API_URL=https://your-production-api.com
VITE_WS_URL=wss://your-production-api.com

# web-admin/.env
VITE_API_URL=https://your-production-api.com
```

**Impact:** WebSocket falls back to `ws://localhost:8080` in production — chat/notifications won't work.

---

### 3. Response Shape Mismatches
**Status:** ❌ Blocks chat and maintenance features
**Issues:**
- `chats.api.ts` — double unwrapping `.json()` on already-parsed response
- `maintenance.api.ts` — expects `{ data: [...] }` but backend returns `{ content: [...], totalElements }`

**Fix Required:**
```typescript
// chats.api.ts - REMOVE .json() call
const response = await apiClient.get(`/chats/${chatId}/messages`);
return response.data; // NOT response.data.json()

// maintenance.api.ts - handle correct shape
const response = await apiClient.get('/maintenance-requests');
return response.data.content; // NOT response.data.data
```

---

## High Blockers

### 4. Frontend Console.log in Production
**Status:** ⚠️ Security/info leak
**Files:**
- `serviceListings.api.ts:97` — logs API response data
- `ServicesPage.tsx:420-421` — logs component state

**Fix Required:** Remove all `console.log` statements or wrap in `if (import.meta.env.DEV)` guards.

---

### 5. Inconsistent Admin Endpoint
**Status:** ⚠️ May break workshop user management
**File:** `admin.api.ts`
**Issue:** Toggle status uses `/admin/users/workshop/:id` instead of `/admin/users/:id/toggle-status`
**Fix Required:** Verify backend route and align frontend.

---

### 6. Frontend Notification Navigation Bug
**Status:** ⚠️ Wrong page navigation
**File:** `NotificationsPage.tsx`
**Issue:** Routes to `/requests/:requestId` but orders page is at `/orders/:requestId`
**Fix Required:** Update notification click handler to use `/orders/:requestId`.

---

## Medium Blockers

### 7. Missing Edit UI for Offers (Workshop)
**Status:** ⚠️ Incomplete feature
**File:** `OffersPage.tsx`
**Issue:** `updateOffer()` API exists but no edit UI in workshop app
**Impact:** Workshop users cannot modify existing offers.

---

### 8. Dead Register Page (Workshop)
**Status:** ⚠️ Dead code
**File:** `RegisterPage.tsx`
**Issue:** Route redirects to `/login` — register page is unreachable
**Impact:** New workshop registration requires direct URL or different flow.

---

### 9. Gallery Image Upload (Workshop)
**Status:** ⚠️ Poor UX
**File:** `ServicesPage.tsx`
**Issue:** Uses `window.prompt()` for image URL input instead of file upload
**Impact:** Users must manually paste URLs instead of uploading files.

---

## Low Blockers

### 10. Biometric Auth UI (Customer)
**Status:** ℹ️ Cosmetic only
**File:** `LoginPage.tsx`
**Issue:** Biometric button shown but has no implementation
**Impact:** Misleading UX — button does nothing.

---

### 11. Legacy /app Redirect Chain
**Status:** ℹ️ Technical debt
**File:** `App.tsx` (all apps)
**Issue:** `/app` prefix routes redirect through unnecessary chain
**Impact:** Minor performance/UX issue.

---

## Blocker Summary

| Priority | Count | Blocks |
|---|---|---|
| Critical | 3 | Backend queries, WebSocket, chat/maintenance |
| High | 3 | Security, user management, navigation |
| Medium | 3 | Offers editing, registration, image upload |
| Low | 2 | Biometric UI, redirect chain |
| **Total** | **11** | |

## Resolution Order

1. Fix JPQL CAST syntax → unblock Invoices + Maintenance
2. Add .env files to all frontend apps → enable WebSocket in production
3. Fix response shape mismatches → unblock chat + maintenance
4. Remove console.log statements → prevent info leaks
5. Fix admin endpoint inconsistency → enable user management
6. Fix notification navigation → correct user flow
7. Add offer edit UI → complete workshop features
8. Fix register page redirect → enable workshop registration
9. Replace window.prompt with file upload → improve UX
10. Remove biometric button or implement → clean UX
11. Remove legacy redirect chain → simplify routing
