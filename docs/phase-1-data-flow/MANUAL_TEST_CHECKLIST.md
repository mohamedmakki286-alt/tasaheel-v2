# Manual Testing Checklist

## Customer App (`web-customer`)

### Authentication
- [ ] Navigate to login page
- [ ] Enter ahmed@test.com / 123456
- [ ] Click login → verify redirect to dashboard
- [ ] Verify user name displayed in header
- [ ] Click logout → verify redirect to login
- [ ] Click "Forgot Password" → verify form appears
- [ ] Enter email → submit → verify success message

### Home Page
- [ ] Login as customer
- [ ] Verify workshops are displayed (currently shows mock data)
- [ ] Verify search input is present
- [ ] Type in search input → verify filtering works (currently decorative)
- [ ] Click on a workshop → verify navigation to workshop detail

### Service Requests
- [ ] Navigate to "My Requests" / "My Orders"
- [ ] Verify list of requests displayed
- [ ] Click "New Request" → verify form appears
- [ ] Fill in vehicle details (make, model, year)
- [ ] Select a service from dropdown
- [ ] Add description
- [ ] Submit request → verify success message
- [ ] Verify new request appears in list
- [ ] Click on request → verify detail view

### Chat
- [ ] Navigate to Chat section
- [ ] Verify chat list loads (may fail — double unwrap issue)
- [ ] Click on a chat → verify messages load
- [ ] Type a message → click send
- [ ] Verify message appears in chat
- [ ] Verify real-time updates work (WebSocket)

### Notifications
- [ ] Click notification bell icon
- [ ] Verify notification list loads
- [ ] Click on a notification → verify correct page navigation
- [ ] ⚠️ Known issue: routes to `/requests/:id` instead of `/orders/:id`

### Profile
- [ ] Navigate to profile page
- [ ] Verify user info is displayed
- [ ] Update profile info → save → verify changes persist

---

## Workshop App (`web-workshop`)

### Authentication
- [ ] Navigate to login page
- [ ] Enter tech@workshop.com / 123456
- [ ] Click login → verify redirect to dashboard
- [ ] Verify user name displayed in header
- [ ] Click logout → verify redirect to login
- [ ] ⚠️ Register page is dead code (redirects to /login)

### Dashboard
- [ ] Verify workshop stats are displayed
- [ ] Verify recent requests shown
- [ ] Verify notifications count

### Service Listings
- [ ] Navigate to Services / Listings page
- [ ] Verify list of services displayed
- [ ] Click "Add Listing" → verify form appears
- [ ] Fill in service details
- [ ] Submit → verify listing created
- [ ] ⚠️ Console.log output may appear in browser
- [ ] Verify image upload works (currently uses window.prompt)

### Gallery
- [ ] Navigate to Gallery section
- [ ] Verify existing images displayed
- [ ] Click "Add Image" → verify upload dialog appears
- [ ] ⚠️ Currently uses window.prompt for URL — verify it works
- [ ] Select image → verify upload completes
- [ ] Delete image → verify removal

### Offers
- [ ] Navigate to Offers page
- [ ] Verify list of offers displayed
- [ ] Click "Create Offer" → verify form appears
- [ ] Fill in offer details (price, timeline)
- [ ] Submit → verify offer created
- [ ] ⚠️ No edit functionality — verify cannot edit existing offers
- [ ] Delete offer → verify removal

### Requests
- [ ] Navigate to Requests / Incoming Requests
- [ ] Verify list of customer requests displayed
- [ ] Click on request → verify detail view
- [ ] Accept request → verify status change
- [ ] Decline request → verify status change

### Chat
- [ ] Navigate to Chat section
- [ ] Verify chat list loads
- [ ] Click on a chat → verify messages load
- [ ] Type a message → click send
- [ ] Verify message appears
- [ ] ⚠️ Search input is decorative — verify it doesn't filter

### Maintenance Requests
- [ ] Navigate to Maintenance section
- [ ] ⚠️ Backend broken — verify loading spinner appears (will not resolve)

---

## Admin Panel (`web-admin`)

### Authentication
- [ ] Navigate to login page
- [ ] Enter admin@test.com / 123456
- [ ] Click login → verify redirect to dashboard
- [ ] Verify admin role displayed
- [ ] Click logout → verify redirect to login

### Dashboard
- [ ] Navigate to Dashboard / Stats
- [ ] Verify total workshops count displayed
- [ ] Verify total customers count displayed
- [ ] Verify total requests count displayed
- [ ] Verify revenue stats displayed
- [ ] Verify monthly stats displayed

### User Management
- [ ] Navigate to Users / Workshops list
- [ ] Verify list of users displayed
- [ ] Click on user → verify detail view
- [ ] Toggle user status → verify status changes
- [ ] ⚠️ Verify toggle uses correct endpoint for workshops
- [ ] Search/filter users → verify filtering works

### Service Catalog
- [ ] Navigate to Service Catalog
- [ ] Verify 8 categories displayed
- [ ] Verify 67 services displayed
- [ ] Click category → verify services filter
- [ ] Click service → verify detail view

### Invoices
- [ ] Navigate to Invoices page
- [ ] ❌ Expected: perpetual loading spinner (backend JPQL error)
- [ ] Verify page does NOT crash
- [ ] Verify loading indicator is visible
- [ ] ⚠️ Will not show data until backend is fixed

### Maintenance Requests
- [ ] Navigate to Maintenance Requests page
- [ ] ❌ Expected: perpetual loading spinner (backend JPQL error)
- [ ] Verify page does NOT crash
- [ ] Verify loading indicator is visible
- [ ] ⚠️ Will not show data until backend is fixed

### Notifications
- [ ] Navigate to Notifications
- [ ] Verify notification list loads
- [ ] Click notification → verify correct navigation

---

## Cross-App Testing

### WebSocket
- [ ] Open customer + workshop apps simultaneously
- [ ] Customer creates request → workshop receives notification
- [ ] Workshop sends offer → customer receives notification
- [ ] Both apps send messages → real-time delivery works
- [ ] ⚠️ Verify WebSocket connects (check browser console for URL)

### Auth Flow
- [ ] Login as customer → verify token stored
- [ ] Refresh page → verify session persists
- [ ] Login as workshop → verify separate session
- [ ] Login as admin → verify separate session
- [ ] Try accessing protected route without token → verify redirect to login

### Error Handling
- [ ] Disconnect network → verify error messages shown
- [ ] Enter wrong password → verify error message
- [ ] Submit empty forms → verify validation messages
- [ ] Navigate to non-existent page → verify 404 handling

---

## Test Results Log

| Date | Tester | App | Result | Notes |
|---|---|---|---|---|
| | | | | |
| | | | | |

---

## Known Issues During Testing

| Issue | Expected Behavior | Actual Behavior | Workaround |
|---|---|---|---|
| Invoices page | Shows invoice list | Loading spinner forever | None — backend broken |
| Maintenance page | Shows maintenance list | Loading spinner forever | None — backend broken |
| Home page workshops | Shows real workshops | Shows mock data | None — needs API integration |
| Chat messages | Loads messages | May fail (double unwrap) | Refresh page |
| WebSocket | Connects to production | Connects to localhost | Create .env file |
| Offer edit | Edit button available | No edit option | Recreate offer instead |
