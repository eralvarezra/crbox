# CRBox — Package Tracking Web App Design Spec

**Date:** 2026-05-21  
**Status:** Approved

---

## Overview

A web application for CRBox, a company that ships packages from the United States to Costa Rica. Clients can track the status of their packages by entering a tracking number. Admins manage all packages and update statuses, which triggers WhatsApp notifications to the client.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions, TypeScript) |
| Auth | Clerk |
| Database | Neon (PostgreSQL) via Drizzle ORM |
| WhatsApp Notifications | Twilio WhatsApp API |
| Deploy | Vercel |

---

## Roles

**Admin** — Assigned via Clerk `publicMetadata: { role: "admin" }`. Can create packages, update statuses, view all packages.

**Registered User** — Any Clerk account. Can view their own linked packages in a personal dashboard.

**Guest** — No account required. Can search any tracking number and view its status.

---

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Everyone | Search tracking number (guest or logged in) |
| `/track/[trackingNumber]` | Everyone | View package status timeline |
| `/dashboard` | Registered users | List of all packages linked to their account |
| `/admin` | Admins only | Full package list with search and filters |
| `/admin/packages/new` | Admins only | Register a new package |
| `/admin/packages/[id]` | Admins only | Edit package status and details |

---

## Package Statuses

Packages move through exactly 5 statuses in order:

1. `received_usa` — Recibido en bodega USA
2. `in_transit` — En tránsito
3. `in_customs` — En aduana CR
4. `ready_pickup` — Listo para retirar
5. `delivered` — Entregado

---

## Data Model

### `packages` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `tracking_number` | varchar UNIQUE | Client-provided (FedEx, UPS, etc.) |
| `description` | text nullable | Package description |
| `status` | enum | One of the 5 statuses above |
| `customer_name` | varchar | Recipient name |
| `whatsapp_number` | varchar nullable | E.164 format, e.g. +50688888888 |
| `clerk_user_id` | varchar nullable | Links package to a registered user |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `status_history` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `package_id` | uuid FK | References `packages.id` |
| `status` | enum | The new status set |
| `note` | text nullable | Admin comment (e.g. "Retenido en aduana") |
| `created_at` | timestamp | Timestamp of the status change |

**Note:** User data (name, email) is not duplicated in Neon. Only `clerk_user_id` is stored to link packages to accounts. User info is read from Clerk when needed.

---

## Key User Flows

### Guest Tracking
1. User visits `/`
2. Enters tracking number in search box
3. Redirected to `/track/[trackingNumber]`
4. Sees status timeline with all 5 steps, current step highlighted
5. Full `status_history` shown with timestamps and admin notes

### Registered User
1. Same as guest, plus:
2. Can log in via Clerk
3. `/dashboard` shows all packages where `clerk_user_id` matches their Clerk ID
4. **Package linking — two paths:**
   - Admin can assign `clerk_user_id` when creating a package (if they know the client's account)
   - A logged-in user who searches a tracking number sees a "Vincular a mi cuenta" button on `/track/[id]` — clicking it sets `clerk_user_id` on that package to their Clerk ID via a Server Action

### Admin — Create Package
1. Admin visits `/admin/packages/new`
2. Fills in: tracking number, customer name, description (optional), WhatsApp number (optional), Clerk user ID (optional, to link to an account)
3. Initial status set to `received_usa`
4. Package saved to Neon

### Admin — Update Status
1. Admin visits `/admin` or `/admin/packages/[id]`
2. Selects new status from dropdown
3. Optionally adds a note
4. On save: Server Action updates `packages.status`, inserts row into `status_history`
5. If `whatsapp_number` is set: Twilio API call sends WhatsApp notification with new status
6. Admin sees success confirmation

---

## WhatsApp Notification

**Trigger:** Admin saves a status update and the package has a `whatsapp_number`.

**Flow:**
1. Server Action updates DB
2. Calls Twilio WhatsApp API with a message template:
   > "Hola [customer_name], tu paquete [tracking_number] ha sido actualizado: *[status_label]*. [note if present]"
3. If Twilio call fails, log the error but do not block the status update (non-blocking).

**Provider:** Twilio WhatsApp Sandbox (dev) → Twilio WhatsApp Business (prod).

---

## Auth & Route Protection

- Clerk middleware protects `/admin/*` routes — redirects to login if not authenticated, returns 403 if authenticated but not admin.
- Clerk middleware protects `/dashboard` — redirects to login if not authenticated.
- `/` and `/track/[trackingNumber]` are fully public.
- Admin role check: read `auth().sessionClaims?.metadata?.role === "admin"` server-side.

---

## UI Design Notes

- **Status timeline:** Vertical stepper. Completed steps in indigo, current step in amber with pulse animation, pending steps in gray.
- **Status badges:** Color-coded in admin list — amber for in-customs, green for ready/delivered, blue for in-transit.
- **Search:** Single input on homepage, redirects on submit. No login required.
- **Admin table:** Sortable by status and date, searchable by tracking number or customer name.

---

## Error Handling

- Tracking number not found: show friendly "No encontramos este tracking number" message on `/track/[id]`.
- WhatsApp failure: log to console/server logs, do not surface to admin as a blocking error — show a non-critical warning.
- Duplicate tracking number: DB unique constraint + friendly validation error in admin form.
