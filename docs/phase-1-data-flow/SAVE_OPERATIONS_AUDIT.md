# Save Operations Audit

## Create Operations

| Operation | Frontend File | Backend Endpoint | Status | Issues |
|---|---|---|---|---|
| Create Request | `requests.api.ts` → `createRequest()` | `POST /requests` | ✅ Working | None |
| Create Offer | `offers.api.ts` → `createOffer()` | `POST /offers` | ⚠️ Partial | No error handling for failed creation |
| Create Service Listing | `serviceListings.api.ts` → `createServiceListing()` | `POST /workshops/:id/listings` | ⚠️ Partial | `console.log` in production code |
| Create Chat Message | `chats.api.ts` → `sendMessage()` | `POST /chats/:chatId/messages` | ⚠️ Partial | Double unwrap on response |
| Create User (Register) | `auth.api.ts` → `register()` | `POST /auth/register` | ✅ Working | None |
| Create Invoice | `invoices.api.ts` | `POST /invoices` | ❌ Broken | JPQL error on related query |

## Update Operations

| Operation | Frontend File | Backend Endpoint | Status | Issues |
|---|---|---|---|---|
| Update Request | `requests.api.ts` → `updateRequest()` | `PUT /requests/:id` | ✅ Working | None |
| Update Offer | `offers.api.ts` → `updateOffer()` | `PUT /offers/:id` | ⚠️ Partial | No edit UI in Workshop OffersPage |
| Update Maintenance | `maintenance.api.ts` | `PUT /maintenance-requests/:id` | ❌ Broken | Backend query fails (JPQL CAST error) |
| Toggle User Status | `admin.api.ts` → `toggleUserStatus()` | `PATCH /admin/users/:id/toggle-status` | ⚠️ Partial | Uses `/admin/users/workshop/:id` — inconsistent |

## Delete Operations

| Operation | Frontend File | Backend Endpoint | Status | Issues |
|---|---|---|---|---|
| Delete Request | `requests.api.ts` → `deleteRequest()` | `DELETE /requests/:id` | ✅ Working | None |
| Delete Maintenance | `maintenance.api.ts` | `DELETE /maintenance-requests/:id` | ❌ Broken | Backend query fails |

## Missing @Transactional Annotations

| Repository/Service | Method | Risk | Severity |
|---|---|---|---|
| `InvoiceService` | `updateInvoiceStatus()` | Race condition on concurrent payment updates | Medium |
| `MaintenanceRequestService` | `updateStatus()` | Status transition not atomic | Medium |
| `OfferService` | `acceptOffer()` | Multiple offer acceptance race condition | Medium |

> **Note:** Full audit of `@Transactional` annotations requires access to all `*Service.java` files. The above are identified based on observed patterns. Complete audit pending.

## Payload Mismatches

| Frontend Sends | Backend Expects | Issue |
|---|---|---|
| `POST /requests` — `serviceId` as UUID | Backend expects `serviceId` as UUID | ✅ Match |
| `POST /requests` — optional `preferredWorkshopId` | Backend column `preferred_workshop_id` — previously missing | ✅ Fixed |
| `PATCH /admin/users/:id/toggle-status` | Backend route: `/admin/users/:id/toggle-status` | ⚠️ Frontend uses `/admin/users/workshop/:id` — potential mismatch |
| `POST /chats/:chatId/messages` — `{ content: string }` | Backend expects `{ content: string }` | ✅ Match |
| `PUT /offers/:id` — full offer object | Backend may expect partial update | ⚠️ Needs verification |

## Missing Error Handling

| Operation | Frontend File | Issue | Severity |
|---|---|---|---|
| Create Offer | `offers.api.ts` | No try/catch — error silently lost | High |
| Update Offer | `offers.api.ts` | No try/catch — error silently lost | High |
| Create Listing | `serviceListings.api.ts` | `console.log` instead of error handling | Medium |
| Send Message | `chats.api.ts` | No retry logic, no error feedback | Medium |
| Toggle Status | `admin.api.ts` | Inconsistent endpoint — may 404 on workshops | High |

## Cache Invalidation Issues

| Operation | Issue | Severity |
|---|---|---|
| After creating offer | Workshop listings page may show stale data | Medium |
| After toggling user status | Users list not refreshed — user may appear wrong status | High |
| After updating request | Orders page may not reflect new status | Medium |
| After sending chat message | Chat list not updated until page refresh | Low |
| After creating service listing | Service catalog cache not invalidated | Medium |

## Save Operation Flow Summary

```
Create Request ────────────────────────── ✅ Working
Create Offer ──────────────────────────── ⚠️ No error handling
Create Service Listing ────────────────── ⚠️ console.log leak
Create Chat Message ───────────────────── ⚠️ Double unwrap
Update Request ────────────────────────── ✅ Working
Update Offer ──────────────────────────── ⚠️ No edit UI
Update Maintenance ────────────────────── ❌ JPQL error
Toggle User Status ────────────────────── ⚠️ URL inconsistency
Delete Request ────────────────────────── ✅ Working
Delete Maintenance ────────────────────── ❌ JPQL error
```
