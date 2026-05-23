# 17track Webhook Integration — Design Spec

**Date:** 2026-05-23  
**Status:** Approved

## Overview

Integrate 17track's webhook API to automatically track packages in transit from the USA. When an admin approves a package request, the tracking number is registered with 17track. 17track monitors the carrier and pushes status updates via webhook. Once the package is delivered to Costa Rica (marked as `in_customs`), auto-tracking stops and the admin takes full manual control.

## Architecture

```
Admin approves request
        │
        ▼
approveRequest() in lib/actions/requests.ts
        ├─→ Creates package in DB (existing)
        ├─→ Sends WhatsApp to customer (existing)
        └─→ Calls registerTracking(trackingNumber) ← new
                │
                └─→ POST /api/track17/register
                        └─→ Sets packages.trackingRegistered = true on success

17track monitors carrier
        │
        ▼ (webhook POST)
/api/webhooks/17track
        ├─→ Verify HMAC signature (TRACK17_WEBHOOK_SECRET)
        ├─→ Map 17track event → CRBox status
        ├─→ Check current package status (boundary guard)
        └─→ If allowed: update packages + insert statusHistory
```

## Status Mapping

| 17track event | CRBox status | Notes |
|---|---|---|
| `NotFound` / `Pending` | — | Ignore, wait |
| `InTransit` | `in_transit` | Update DB |
| `Delivered` | `in_customs` | Update DB + stops auto-tracking |
| `Undelivered` / `Exception` | — | Ignore, admin decides |
| Any other | — | Ignore |

**Boundary rule:** if the package is already at `in_customs`, `ready_pickup`, or `delivered`, all incoming 17track webhook events are silently ignored. The admin has full control from `in_customs` onwards.

## Schema Change

One new field on the `packages` table:

```ts
// src/db/schema.ts
trackingRegistered: boolean('tracking_registered').notNull().default(false)
```

`false` means 17track registration failed or was never attempted. The admin panel shows a warning badge on packages where this is `false`.

## New Files

### `src/lib/17track.ts`

- `registerTracking(trackingNumber: string): Promise<boolean>` — POSTs to 17track API to register a tracking number. Returns `true` on success, `false` on failure (never throws, failure is non-blocking).
- `verifyWebhookSignature(rawBody: string, signature: string): boolean` — Validates HMAC-SHA256 signature using `TRACK17_WEBHOOK_SECRET`.

### `src/app/api/webhooks/17track/route.ts`

- `POST` handler only
- Reads raw body for HMAC verification before parsing JSON
- Looks up package by tracking number
- Applies boundary guard
- Updates `packages.status` and inserts into `statusHistory`
- Always returns `200 OK` for valid signatures (even if package not found) so 17track doesn't retry unnecessarily
- Returns `401` for invalid signatures

## Modified Files

### `src/lib/actions/requests.ts` — `approveRequest()`

After the package is created and WhatsApp is sent, call `registerTracking()`. Failure is caught and logged — it never blocks the approval flow. The `trackingRegistered` field on the package reflects the result.

### `src/app/admin/packages/[id]/page.tsx`

Show a yellow warning badge when `trackingRegistered = false`:  
_"Este paquete no está siendo rastreado automáticamente"_

### `src/db/schema.ts`

Add `trackingRegistered` boolean field to `packages`.

## Environment Variables

```
TRACK17_API_KEY=        # 17track API key
TRACK17_WEBHOOK_SECRET= # Secret for HMAC webhook verification
```

## Error Handling

| Scenario | Behavior |
|---|---|
| `registerTracking` fails at approval | Approval completes normally; `trackingRegistered` stays `false`; admin sees warning in panel |
| Webhook arrives for unknown tracking number | Respond `200 OK`, ignore silently |
| Webhook has invalid HMAC signature | Respond `401`, log warning |
| 17track doesn't recognize the carrier | No webhooks will arrive; package falls back to 100% manual admin control |
| Package already at `in_customs` or beyond | Webhook event ignored silently, respond `200 OK` |

## Out of Scope

- WhatsApp notifications for automatic status changes (only manual admin changes trigger WhatsApp)
- Admin UI to manually re-trigger 17track registration (future)
- Retry logic for failed `registerTracking` calls (future)
