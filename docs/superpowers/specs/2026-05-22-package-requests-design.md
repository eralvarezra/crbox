# Package Request System — Design Spec
**Date:** 2026-05-22

## Overview

Customers (logged-in or guest) can submit a request to have their package added to the tracking system. The admin reviews the request, verifies the invoice image, and either approves (automatically creating the package) or rejects (with a reason). The customer is notified via WhatsApp in both cases.

---

## 1. Data Model

### New table: `packageRequests`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `trackingNumber` | varchar(100) | |
| `customerName` | varchar(200) | null if logged-in user (name taken from Clerk) |
| `whatsappNumber` | varchar(20) | always required — used for notifications |
| `invoiceUrl` | varchar(500) | Vercel Blob URL of uploaded invoice image |
| `clerkUserId` | varchar(200) | null if guest |
| `status` | enum | `pending` \| `approved` \| `rejected` |
| `rejectionReason` | text | null unless rejected |
| `createdAt` | timestamp | default now |

### Status enum values
- `pending` — awaiting admin review
- `approved` — admin approved, package created
- `rejected` — admin rejected with reason

### Storage
Invoice images are uploaded to **Vercel Blob** before form submission. The resulting URL is stored in `invoiceUrl`. Requires `BLOB_READ_WRITE_TOKEN` environment variable.

---

## 2. Pages & Components

### `/request` — Public submission form
- Accessible to everyone (no auth required)
- **Guest fields:** name, WhatsApp, tracking number, invoice image upload
- **Logged-in fields:** tracking number, WhatsApp, invoice image upload (name taken from Clerk)
- Image uploaded to Vercel Blob client-side before form submit
- On success: shows confirmation message — "Tu solicitud fue recibida. Te notificaremos por WhatsApp."

### `/admin/requests` — Request list (admin only)
- Table with columns: tracking number, customer name, date, status badge
- Status filter: All / Pending / Approved / Rejected
- Each row links to the detail page
- Menu entry "Solicitudes" with a pending count badge

### `/admin/requests/[id]` — Request detail (admin only)
- Displays all request fields + invoice image (click to open full size)
- **Approve button (green):** creates the package, sends WhatsApp, marks approved, redirects to `/admin/requests`
- **Reject section (red):** text input for rejection reason + confirm button, sends WhatsApp, marks rejected, redirects to `/admin/requests`

### Navigation changes
- Home page (`/`): add "Registrar mi paquete" button linking to `/request`
- Admin layout: add "Solicitudes" link with pending count badge

---

## 3. Server Actions

### `submitPackageRequest(formData)`
- Validates required fields (name + WhatsApp required for guests; only WhatsApp required for logged-in users)
- Receives `invoiceUrl` as already-uploaded Vercel Blob URL
- Inserts into `packageRequests` with `status: 'pending'`
- Links `clerkUserId` if user is authenticated

### `approveRequest(requestId)`
- Requires admin role
- Inserts into `packages`: tracking number, customer name (from request or Clerk), WhatsApp, clerkUserId
- Inserts initial `statusHistory` entry with `received_usa`
- Updates `packageRequests.status` to `approved`
- Sends WhatsApp to request's `whatsappNumber`:
  > "Hola [nombre], tu solicitud para el paquete [tracking] fue aprobada. Ya puedes rastrear tu paquete en nuestro sistema."
- Redirects to `/admin/requests`

### `rejectRequest(requestId, formData)`
- Requires admin role
- Updates `packageRequests.status` to `rejected`, saves `rejectionReason`
- Sends WhatsApp to request's `whatsappNumber`:
  > "Hola [nombre], tu solicitud para el paquete [tracking] fue rechazada. Motivo: [reason]."
- Redirects to `/admin/requests`

---

## 4. WhatsApp Notifications

Reuses existing `sendStatusUpdate` helper pattern from `src/lib/whatsapp.ts`. Two new message types added to `whatsapp.ts`:
- `sendRequestApproved({ to, customerName, trackingNumber })`
- `sendRequestRejected({ to, customerName, trackingNumber, reason })`

Errors are caught and logged; they do not block the approve/reject action. On WhatsApp failure, redirect back to the request detail with a `?whatsapp_error=1` param (same pattern as the existing status update flow).

---

## 5. Schema Changes

Edit `src/db/schema.ts`:
- Add `requestStatusEnum` pgEnum: `['pending', 'approved', 'rejected']`
- Add `packageRequests` table with columns described above
- Run `npm run db:push` after changes

---

## 6. Environment Variables

Add to `.env.local`:
```
BLOB_READ_WRITE_TOKEN=
```

---

## 7. Files Affected / Created

| File | Action |
|---|---|
| `src/db/schema.ts` | Add `requestStatusEnum` + `packageRequests` table |
| `src/lib/whatsapp.ts` | Add `sendRequestApproved` and `sendRequestRejected` |
| `src/lib/actions/requests.ts` | New — `submitPackageRequest`, `approveRequest`, `rejectRequest` |
| `src/app/request/page.tsx` | New — public submission form |
| `src/app/admin/requests/page.tsx` | New — admin request list |
| `src/app/admin/requests/[id]/page.tsx` | New — admin request detail |
| `src/app/page.tsx` | Add "Registrar mi paquete" button |
| `src/app/admin/layout.tsx` | Add "Solicitudes" nav link with pending badge |
