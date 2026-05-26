# Carrier Tracking Integration Design

**Date:** 2026-05-25  
**Status:** Approved

## Overview

Add direct carrier API integration to CRBox so that package tracking status is automatically fetched from UPS, FedEx, USPS, and DHL — without relying on a third-party aggregator. The raw carrier status is stored and displayed alongside CRBox's own internal status system. A Vercel Cron Job refreshes all active packages every 6 hours.

---

## 1. Database Changes

Two additions to `src/db/schema.ts`:

```ts
export const carrierEnum = pgEnum('carrier', ['ups', 'fedex', 'usps', 'dhl'])
```

New columns on the `packages` table:

| Column | Type | Notes |
|---|---|---|
| `carrier` | `carrierEnum` | Nullable — existing packages won't have one |
| `carrierRawStatus` | `text` | Raw status string from carrier API |
| `carrierLastSynced` | `timestamp` | When the carrier API was last queried |

`carrier` is nullable in the schema to avoid breaking existing packages, but required in the admin form for new packages.

Run `npm run db:push` after updating the schema.

---

## 2. Carrier Abstraction Layer

Location: `src/lib/carriers/`

```
src/lib/carriers/
  types.ts        # Shared types
  ups.ts          # UPS Tracking API (OAuth 2.0)
  fedex.ts        # FedEx Track API (OAuth 2.0)
  usps.ts         # USPS Web Tools API (API key, XML)
  dhl.ts          # DHL Express Tracking API (API key)
  index.ts        # Dispatcher: getCarrierStatus(carrier, trackingNumber)
```

### Shared type (`types.ts`)

```ts
export type Carrier = 'ups' | 'fedex' | 'usps' | 'dhl'

export interface CarrierResult {
  rawStatus: string
  details?: string
}
```

### Each carrier module

Each file exports a single function with this signature:

```ts
export async function getStatus(trackingNumber: string): Promise<CarrierResult>
```

**UPS and FedEx** use OAuth 2.0. Access tokens expire every hour. Each module caches its token in memory (module-level variable) and refreshes it when expired — sufficient for a long-running Node process.

**USPS** uses an API key with an XML-based request/response format. Response is parsed with a simple XML parser.

**DHL Express** uses API key + secret passed as Basic Auth headers.

### Dispatcher (`index.ts`)

```ts
export async function getCarrierStatus(
  carrier: Carrier,
  trackingNumber: string
): Promise<CarrierResult> {
  switch (carrier) {
    case 'ups':   return ups.getStatus(trackingNumber)
    case 'fedex': return fedex.getStatus(trackingNumber)
    case 'usps':  return usps.getStatus(trackingNumber)
    case 'dhl':   return dhl.getStatus(trackingNumber)
  }
}
```

### Error handling

Carrier API errors (invalid tracking number, API down, auth failure) are caught at the call site — they never block package creation or the cron. On failure, `carrierRawStatus` remains `null`.

---

## 3. Package Creation Flow

### Form changes (`/admin/packages/new`)

Add a required `<select>` field for carrier, placed between tracking number and customer name:

```
[ Tracking Number * ]
[ Carrier *         ]  ← UPS / FedEx / USPS / DHL
[ Nombre del cliente * ]
```

### `createPackage` Server Action changes

After inserting the package, query the carrier API and save the result:

```ts
const carrier = formData.get('carrier') as Carrier
// ... insert package ...
const result = await getCarrierStatus(carrier, trackingNumber).catch(() => null)
await db.update(packages).set({
  carrier,
  carrierRawStatus: result?.rawStatus ?? null,
  carrierLastSynced: new Date(),
}).where(eq(packages.id, pkg.id))
```

The carrier query is fire-and-update. If it fails, the package is still created — just without an initial carrier status.

---

## 4. Cron Job

### API route

`src/app/api/cron/sync-tracking/route.ts`

- Protected with `CRON_SECRET` header (`Authorization: Bearer <secret>`)
- Fetches all packages where `carrier IS NOT NULL` and `status != 'delivered'`
- Processes in batches to avoid saturating carrier APIs
- Updates `carrierRawStatus` and `carrierLastSynced` for each package
- Returns a JSON summary: `{ updated: N, errors: M }`

### Vercel configuration

`vercel.json` (create at project root if not exists):

```json
{
  "crons": [{
    "path": "/api/cron/sync-tracking",
    "schedule": "0 */6 * * *"
  }]
}
```

Runs every 6 hours. Adjustable.

### Manual trigger

The cron route can be called manually via `curl` locally for testing:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/sync-tracking
```

### New environment variable

```
CRON_SECRET=<random-secret-string>
```

Add to `.env.local` and Vercel project settings.

---

## 5. UI Changes

### Admin: package list (`/admin`)

Add a "Carrier" column with a small badge (UPS, FedEx, USPS, DHL). Packages without a carrier show nothing.

### Admin: package detail (`/admin/packages/[id]`)

Add a "Tracking del carrier" card:

```
┌─────────────────────────────────────┐
│ Carrier: [UPS]                      │
│ Status: In Transit                  │
│ Última sync: hace 2 horas           │
│                    [Sincronizar]    │
└─────────────────────────────────────┘
```

The **Sincronizar** button triggers a new Server Action (`syncPackageCarrier`) that queries the carrier API for that specific package and updates `carrierRawStatus` and `carrierLastSynced` immediately — without waiting for the cron.

### Public tracking page (`/track/[trackingNumber]`)

Display `carrierRawStatus` below the CRBox status timeline as supplementary information, labeled by carrier name. Only shown when `carrierRawStatus` is not null.

---

## New Environment Variables

```
# Carrier APIs
UPS_CLIENT_ID=
UPS_CLIENT_SECRET=
FEDEX_CLIENT_ID=
FEDEX_CLIENT_SECRET=
USPS_USER_ID=
DHL_API_KEY=
DHL_API_SECRET=

# Cron protection
CRON_SECRET=
```

---

## Out of Scope

- Mapping carrier status to CRBox internal statuses — carrier status is stored and displayed as-is
- Support for carriers beyond UPS, FedEx, USPS, DHL
- Push notifications from carriers (webhooks) — polling via cron is sufficient for now
- Amazon Logistics — no public tracking API
