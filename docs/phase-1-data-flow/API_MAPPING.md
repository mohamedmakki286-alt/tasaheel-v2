# API Endpoint Mapping

## Backend Endpoints → Frontend API Calls

| # | Backend Endpoint | Method | Frontend File | Frontend Function | Auth | Status |
|---|---|---|---|---|---|---|
| 1 | `POST /auth/login` | POST | `auth.api.ts` | `login()` | No | ✅ Working |
| 2 | `POST /auth/register` | POST | `auth.api.ts` | `register()` | No | ✅ Working |
| 3 | `POST /auth/forgot-password` | POST | `auth.api.ts` | `forgotPassword()` | No | ⚠️ Raw fetch |
| 4 | `POST /auth/reset-password` | POST | `auth.api.ts` | `resetPassword()` | No | ⚠️ Raw fetch |
| 5 | `GET /auth/me` | GET | `auth.api.ts` | `getCurrentUser()` | Yes | ✅ Working |
| 6 | `GET /service-catalog` | GET | `serviceCatalog.api.ts` | `getServiceCatalog()` | No | ✅ Working |
| 7 | `GET /admin/stats` | GET | `admin.api.ts` | `getAdminStats()` | Yes | ✅ Working |
| 8 | `GET /admin/workshops` | GET | `admin.api.ts` | `getWorkshops()` | Yes | ✅ |
| 9 | `GET /admin/users` | GET | `admin.api.ts` | `getUsers()` | Yes | ✅ |
| 10 | `PATCH /admin/users/:id/toggle-status` | PATCH | `admin.api.ts` | `toggleUserStatus()` | Yes | ⚠️ URL inconsistency |
| 11 | `GET /workshops` | GET | `workshop.api.ts` | `getWorkshops()` | No | ✅ Working |
| 12 | `GET /workshops/:id` | GET | `workshop.api.ts` | `getWorkshop(id)` | No | ✅ Working |
| 13 | `GET /workshops/:id/listings` | GET | `serviceListings.api.ts` | `getServiceListings(id)` | No | ✅ Working |
| 14 | `POST /workshops/:id/listings` | POST | `serviceListings.api.ts` | `createServiceListing()` | Yes | ⚠️ No console guard |
| 15 | `GET /requests` | GET | `requests.api.ts` | `getRequests()` | Yes | ✅ Working |
| 16 | `POST /requests` | POST | `requests.api.ts` | `createRequest()` | Yes | ✅ Working |
| 17 | `GET /requests/:id` | GET | `requests.api.ts` | `getRequest(id)` | Yes | ✅ Working |
| 18 | `PUT /requests/:id` | PUT | `requests.api.ts` | `updateRequest()` | Yes | ✅ |
| 19 | `DELETE /requests/:id` | DELETE | `requests.api.ts` | `deleteRequest()` | Yes | ✅ |
| 20 | `GET /offers` | GET | `offers.api.ts` | `getOffers()` | Yes | ✅ |
| 21 | `POST /offers` | POST | `offers.api.ts` | `createOffer()` | Yes | ✅ |
| 22 | `PUT /offers/:id` | PUT | `offers.api.ts` | `updateOffer()` | Yes | ⚠️ Missing UI |
| 23 | `GET /invoices` | GET | `invoices.api.ts` | `getInvoices()` | Yes | ❌ JPQL error |
| 24 | `GET /maintenance-requests` | GET | `maintenance.api.ts` | `getMaintenanceRequests()` | Yes | ❌ JPQL error |
| 25 | `GET /chats` | GET | `chats.api.ts` | `getChats()` | Yes | ✅ |
| 26 | `POST /chats/:chatId/messages` | POST | `chats.api.ts` | `sendMessage()` | Yes | ✅ |
| 27 | `GET /notifications` | GET | `notifications.api.ts` | `getNotifications()` | Yes | ✅ |

## Request/Response Shapes

### POST /auth/login
```json
// Request
{ "email": "string", "password": "string", "role": "admin"|"customer"|"workshop" }

// Response
{
  "token": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "admin"|"customer"|"workshop",
    "name": "string"
  }
}
```

### GET /service-catalog
```json
// Response
{
  "categories": [
    {
      "id": "uuid",
      "name": "string",
      "services": [
        {
          "id": "uuid",
          "name": "string",
          "description": "string",
          "basePrice": 0.0,
          "estimatedTime": "string"
        }
      ]
    }
  ],
  "totalServices": 67,
  "totalCategories": 8
}
```

### GET /admin/stats
```json
// Response
{
  "totalWorkshops": 0,
  "activeWorkshops": 0,
  "totalCustomers": 0,
  "totalRequests": 0,
  "pendingRequests": 0,
  "completedRequests": 0,
  "totalRevenue": 0.0,
  "newUsersThisMonth": 0,
  "requestsThisMonth": 0
}
```

### POST /requests
```json
// Request
{
  "title": "string",
  "description": "string",
  "vehicleMake": "string",
  "vehicleModel": "string",
  "vehicleYear": 2020,
  "serviceId": "uuid",
  "urgencyLevel": "normal"|"urgent",
  "preferredWorkshopId": "uuid"
}

// Response
{
  "id": "uuid",
  "status": "pending",
  "createdAt": "iso-date"
}
```

## Mismatches Found

| Issue | Location | Description |
|---|---|---|
| Inconsistent admin user endpoint | `admin.api.ts` | Uses `/admin/users/workshop/:id` instead of `/admin/users/:id` for toggle-status |
| Raw fetch in forgotPassword | `auth.api.ts` | Uses raw `fetch()` instead of `apiClient`, no interceptors applied |
| Raw fetch in resetPassword | `auth.api.ts` | Uses raw `fetch()` instead of `apiClient`, no interceptors applied |
| Double unwrap in chat messages | `chats.api.ts` | Calls `.json()` on already-parsed response data |
| Notification navigation | `NotificationsPage.tsx` | Routes to `/requests/:requestId` instead of `/orders/:requestId` |
| Response shape mismatch | `maintenance.api.ts` | Expects `{ data: [...] }` but endpoint returns `{ content: [...], totalElements }` |
