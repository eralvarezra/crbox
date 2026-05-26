# Carrier Tracking Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `carrier` field to packages and integrate UPS, FedEx, USPS, and DHL tracking APIs so that raw carrier status is fetched at creation and refreshed every 6 hours via a Vercel Cron Job.

**Architecture:** A per-carrier module in `src/lib/carriers/` each exposes a `getStatus(trackingNumber)` function with in-memory OAuth token caching (UPS/FedEx/USPS) or API-key auth (DHL). A central dispatcher picks the right module. The cron route at `/api/cron/sync-tracking` iterates all non-delivered packages with a carrier and calls the dispatcher.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + Neon, Vitest, Vercel Cron Jobs, native `fetch`.

---

## File Map

**New files:**
- `src/lib/carriers/types.ts` — `Carrier` type and `CarrierResult` interface
- `src/lib/carriers/ups.ts` — UPS OAuth 2.0 + tracking
- `src/lib/carriers/fedex.ts` — FedEx OAuth 2.0 + tracking
- `src/lib/carriers/usps.ts` — USPS OAuth 2.0 + tracking (JSON API)
- `src/lib/carriers/dhl.ts` — DHL Express API-key tracking
- `src/lib/carriers/index.ts` — dispatcher `getCarrierStatus(carrier, trackingNumber)`
- `src/test/carriers/ups.test.ts`
- `src/test/carriers/fedex.test.ts`
- `src/test/carriers/usps.test.ts`
- `src/test/carriers/dhl.test.ts`
- `src/test/carriers/index.test.ts`
- `src/app/api/cron/sync-tracking/route.ts`
- `vercel.json`

**Modified files:**
- `src/db/schema.ts` — add `carrierEnum`, 3 new columns on `packages`
- `src/lib/actions/packages.ts` — update `createPackage`, add `syncPackageCarrier`
- `src/app/admin/packages/new/page.tsx` — carrier `<select>` field
- `src/app/admin/page.tsx` — carrier column in table
- `src/app/admin/packages/[id]/page.tsx` — carrier status card + sync button
- `src/app/track/[trackingNumber]/page.tsx` — show `carrierRawStatus`

---

### Task 1: Update DB schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add carrierEnum and three new columns to schema.ts**

Replace the top of `src/db/schema.ts` with:

```ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const packageStatusEnum = pgEnum('package_status', [
  'received_usa',
  'in_transit',
  'in_customs',
  'ready_pickup',
  'delivered',
])

export const requestStatusEnum = pgEnum('request_status', [
  'pending',
  'approved',
  'rejected',
])

export const carrierEnum = pgEnum('carrier', ['ups', 'fedex', 'usps', 'dhl'])

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: packageStatusEnum('status').notNull().default('received_usa'),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  clerkUserId: varchar('clerk_user_id', { length: 200 }),
  carrier: carrierEnum('carrier'),
  carrierRawStatus: text('carrier_raw_status'),
  carrierLastSynced: timestamp('carrier_last_synced'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const statusHistory = pgTable('status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id')
    .notNull()
    .references(() => packages.id, { onDelete: 'cascade' }),
  status: packageStatusEnum('status').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const packageRequests = pgTable('package_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull(),
  customerName: varchar('customer_name', { length: 200 }),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }).notNull(),
  invoiceUrl: varchar('invoice_url', { length: 500 }).notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 200 }),
  status: requestStatusEnum('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

- [ ] **Step 2: Push schema to database**

Run: `npm run db:push`

Expected: Drizzle lists the new enum `carrier` and three new columns, then confirms the push. No data loss on existing rows — new columns are nullable.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add carrier enum and tracking columns to packages schema"
```

---

### Task 2: Carrier types module

**Files:**
- Create: `src/lib/carriers/types.ts`

- [ ] **Step 1: Create types.ts**

```ts
export type Carrier = 'ups' | 'fedex' | 'usps' | 'dhl'

export interface CarrierResult {
  rawStatus: string
  details?: string
}

export const CARRIER_LABELS: Record<Carrier, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  usps: 'USPS',
  dhl: 'DHL',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/carriers/types.ts
git commit -m "feat: add carrier types module"
```

---

### Task 3: UPS carrier module (TDD)

**Files:**
- Create: `src/lib/carriers/ups.ts`
- Create: `src/test/carriers/ups.test.ts`

Env vars needed: `UPS_CLIENT_ID`, `UPS_CLIENT_SECRET`

- [ ] **Step 1: Write the failing tests**

Create `src/test/carriers/ups.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Must reset the module between tests to clear the in-memory token cache
beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('UPS_CLIENT_ID', 'test-id')
  vi.stubEnv('UPS_CLIENT_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('ups.getStatus', () => {
  it('returns rawStatus from the most recent activity', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trackResponse: {
            shipment: [{
              package: [{
                activity: [{ status: { description: 'In Transit' } }],
              }],
            }],
          },
        }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/ups')
    const result = await getStatus('1Z999AA10123456784')

    expect(result).toEqual({ rawStatus: 'In Transit' })
  })

  it('throws when UPS tracking API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 404 })
    )

    const { getStatus } = await import('@/lib/carriers/ups')
    await expect(getStatus('INVALID')).rejects.toThrow('UPS API error: 404')
  })

  it('returns Unknown when activity is missing', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trackResponse: { shipment: [] } }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/ups')
    const result = await getStatus('1Z999AA10123456784')
    expect(result.rawStatus).toBe('Unknown')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/carriers/ups.test.ts`

Expected: FAIL — `Cannot find module '@/lib/carriers/ups'`

- [ ] **Step 3: Implement ups.ts**

Create `src/lib/carriers/ups.ts`:

```ts
import type { CarrierResult } from './types'

interface TokenCache {
  value: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value
  }
  const credentials = Buffer.from(
    `${process.env.UPS_CLIENT_ID}:${process.env.UPS_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`UPS auth error: ${res.status}`)
  const data = await res.json()
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return tokenCache.value
}

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const token = await getToken()
  const res = await fetch(
    `https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        transId: crypto.randomUUID(),
        transactionSrc: 'CRBox',
      },
    }
  )
  if (!res.ok) throw new Error(`UPS API error: ${res.status}`)
  const data = await res.json()
  const activity = data.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.[0]
  const rawStatus = activity?.status?.description ?? 'Unknown'
  return { rawStatus }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/carriers/ups.test.ts`

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/carriers/ups.ts src/test/carriers/ups.test.ts
git commit -m "feat: add UPS carrier module with OAuth token caching"
```

---

### Task 4: FedEx carrier module (TDD)

**Files:**
- Create: `src/lib/carriers/fedex.ts`
- Create: `src/test/carriers/fedex.test.ts`

Env vars needed: `FEDEX_CLIENT_ID`, `FEDEX_CLIENT_SECRET`

- [ ] **Step 1: Write the failing tests**

Create `src/test/carriers/fedex.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('FEDEX_CLIENT_ID', 'test-id')
  vi.stubEnv('FEDEX_CLIENT_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fedex.getStatus', () => {
  it('returns rawStatus from latestStatusDetail', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-fedex', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output: {
            completeTrackResults: [{
              trackResults: [{
                latestStatusDetail: { description: 'Shipment picked up' },
              }],
            }],
          },
        }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/fedex')
    const result = await getStatus('774899172137')

    expect(result).toEqual({ rawStatus: 'Shipment picked up' })
  })

  it('throws when FedEx tracking API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-fedex', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400 })
    )

    const { getStatus } = await import('@/lib/carriers/fedex')
    await expect(getStatus('INVALID')).rejects.toThrow('FedEx API error: 400')
  })

  it('returns Unknown when trackResults is empty', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-fedex', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ output: { completeTrackResults: [] } }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/fedex')
    const result = await getStatus('774899172137')
    expect(result.rawStatus).toBe('Unknown')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/carriers/fedex.test.ts`

Expected: FAIL — `Cannot find module '@/lib/carriers/fedex'`

- [ ] **Step 3: Implement fedex.ts**

Create `src/lib/carriers/fedex.ts`:

```ts
import type { CarrierResult } from './types'

interface TokenCache {
  value: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.FEDEX_CLIENT_ID ?? '',
    client_secret: process.env.FEDEX_CLIENT_SECRET ?? '',
  })
  const res = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`FedEx auth error: ${res.status}`)
  const data = await res.json()
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return tokenCache.value
}

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const token = await getToken()
  const res = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-locale': 'en_US',
    },
    body: JSON.stringify({
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      includeDetailedScans: false,
    }),
  })
  if (!res.ok) throw new Error(`FedEx API error: ${res.status}`)
  const data = await res.json()
  const description =
    data.output?.completeTrackResults?.[0]?.trackResults?.[0]?.latestStatusDetail?.description
  return { rawStatus: description ?? 'Unknown' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/carriers/fedex.test.ts`

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/carriers/fedex.ts src/test/carriers/fedex.test.ts
git commit -m "feat: add FedEx carrier module with OAuth token caching"
```

---

### Task 5: USPS carrier module (TDD)

**Files:**
- Create: `src/lib/carriers/usps.ts`
- Create: `src/test/carriers/usps.test.ts`

Env vars needed: `USPS_CLIENT_ID`, `USPS_CLIENT_SECRET`

USPS uses the modern USPS APIs (apis.usps.com) with OAuth 2.0 and returns JSON.

- [ ] **Step 1: Write the failing tests**

Create `src/test/carriers/usps.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('USPS_CLIENT_ID', 'test-id')
  vi.stubEnv('USPS_CLIENT_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('usps.getStatus', () => {
  it('returns rawStatus from eventSummary', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-usps', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trackSummary: {
            eventSummary: 'DELIVERED',
          },
        }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/usps')
    const result = await getStatus('9400111899223397988041')

    expect(result).toEqual({ rawStatus: 'DELIVERED' })
  })

  it('throws when USPS tracking API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-usps', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 404 })
    )

    const { getStatus } = await import('@/lib/carriers/usps')
    await expect(getStatus('INVALID')).rejects.toThrow('USPS API error: 404')
  })

  it('returns Unknown when eventSummary is missing', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-usps', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trackSummary: {} }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/usps')
    const result = await getStatus('9400111899223397988041')
    expect(result.rawStatus).toBe('Unknown')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/carriers/usps.test.ts`

Expected: FAIL — `Cannot find module '@/lib/carriers/usps'`

- [ ] **Step 3: Implement usps.ts**

Create `src/lib/carriers/usps.ts`:

```ts
import type { CarrierResult } from './types'

interface TokenCache {
  value: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.USPS_CLIENT_ID ?? '',
    client_secret: process.env.USPS_CLIENT_SECRET ?? '',
  })
  const res = await fetch('https://apis.usps.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`USPS auth error: ${res.status}`)
  const data = await res.json()
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return tokenCache.value
}

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const token = await getToken()
  const res = await fetch(
    `https://apis.usps.com/tracking/v3/tracking/${trackingNumber}?expand=SUMMARY`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )
  if (!res.ok) throw new Error(`USPS API error: ${res.status}`)
  const data = await res.json()
  const rawStatus = data.trackSummary?.eventSummary ?? 'Unknown'
  return { rawStatus }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/carriers/usps.test.ts`

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/carriers/usps.ts src/test/carriers/usps.test.ts
git commit -m "feat: add USPS carrier module with OAuth token caching"
```

---

### Task 6: DHL carrier module (TDD)

**Files:**
- Create: `src/lib/carriers/dhl.ts`
- Create: `src/test/carriers/dhl.test.ts`

Env vars needed: `DHL_API_KEY`

DHL Express Tracking API uses a single API key header — no OAuth token needed.

- [ ] **Step 1: Write the failing tests**

Create `src/test/carriers/dhl.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('DHL_API_KEY', 'test-dhl-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('dhl.getStatus', () => {
  it('returns rawStatus from the most recent shipment event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        shipments: [{
          events: [
            { description: 'Delivered - Signed for by: SMITH' },
            { description: 'In transit' },
          ],
        }],
      }),
    }))

    const { getStatus } = await import('@/lib/carriers/dhl')
    const result = await getStatus('1234567890')

    expect(result).toEqual({ rawStatus: 'Delivered - Signed for by: SMITH' })
  })

  it('throws when DHL API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 404 }))

    const { getStatus } = await import('@/lib/carriers/dhl')
    await expect(getStatus('INVALID')).rejects.toThrow('DHL API error: 404')
  })

  it('returns Unknown when shipments array is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shipments: [] }),
    }))

    const { getStatus } = await import('@/lib/carriers/dhl')
    const result = await getStatus('1234567890')
    expect(result.rawStatus).toBe('Unknown')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/carriers/dhl.test.ts`

Expected: FAIL — `Cannot find module '@/lib/carriers/dhl'`

- [ ] **Step 3: Implement dhl.ts**

Create `src/lib/carriers/dhl.ts`:

```ts
import type { CarrierResult } from './types'

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const res = await fetch(
    `https://api.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
    {
      headers: {
        'DHL-API-Key': process.env.DHL_API_KEY ?? '',
        Accept: 'application/json',
      },
    }
  )
  if (!res.ok) throw new Error(`DHL API error: ${res.status}`)
  const data = await res.json()
  const event = data.shipments?.[0]?.events?.[0]
  return { rawStatus: event?.description ?? 'Unknown' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/carriers/dhl.test.ts`

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/carriers/dhl.ts src/test/carriers/dhl.test.ts
git commit -m "feat: add DHL carrier module with API-key auth"
```

---

### Task 7: Carrier dispatcher (TDD)

**Files:**
- Create: `src/lib/carriers/index.ts`
- Create: `src/test/carriers/index.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/test/carriers/index.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/carriers/ups', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'UPS status' }),
}))
vi.mock('@/lib/carriers/fedex', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'FedEx status' }),
}))
vi.mock('@/lib/carriers/usps', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'USPS status' }),
}))
vi.mock('@/lib/carriers/dhl', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'DHL status' }),
}))

describe('getCarrierStatus dispatcher', () => {
  it('dispatches to UPS module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('ups', '1Z999AA10123456784')
    expect(result).toEqual({ rawStatus: 'UPS status' })
  })

  it('dispatches to FedEx module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('fedex', '774899172137')
    expect(result).toEqual({ rawStatus: 'FedEx status' })
  })

  it('dispatches to USPS module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('usps', '9400111899223397988041')
    expect(result).toEqual({ rawStatus: 'USPS status' })
  })

  it('dispatches to DHL module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('dhl', '1234567890')
    expect(result).toEqual({ rawStatus: 'DHL status' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/carriers/index.test.ts`

Expected: FAIL — `Cannot find module '@/lib/carriers/index'`

- [ ] **Step 3: Implement index.ts**

Create `src/lib/carriers/index.ts`:

```ts
import type { Carrier, CarrierResult } from './types'
import { getStatus as upsGetStatus } from './ups'
import { getStatus as fedexGetStatus } from './fedex'
import { getStatus as uspsGetStatus } from './usps'
import { getStatus as dhlGetStatus } from './dhl'

export { CARRIER_LABELS } from './types'
export type { Carrier, CarrierResult }

export async function getCarrierStatus(
  carrier: Carrier,
  trackingNumber: string
): Promise<CarrierResult> {
  switch (carrier) {
    case 'ups':   return upsGetStatus(trackingNumber)
    case 'fedex': return fedexGetStatus(trackingNumber)
    case 'usps':  return uspsGetStatus(trackingNumber)
    case 'dhl':   return dhlGetStatus(trackingNumber)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/carriers/index.test.ts`

Expected: PASS — 4 tests pass

- [ ] **Step 5: Run the full test suite to confirm no regressions**

Run: `npm test`

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/carriers/index.ts src/test/carriers/index.test.ts
git commit -m "feat: add carrier dispatcher"
```

---

### Task 8: Update createPackage action + new package form

**Files:**
- Modify: `src/lib/actions/packages.ts`
- Modify: `src/app/admin/packages/new/page.tsx`

- [ ] **Step 1: Update createPackage in packages.ts**

Replace the `createPackage` function in `src/lib/actions/packages.ts`. Also add the import for the carrier module at the top:

Add to imports at top of file:
```ts
import { getCarrierStatus } from '@/lib/carriers'
import type { Carrier } from '@/lib/carriers'
```

Replace the `createPackage` function:
```ts
export async function createPackage(formData: FormData) {
  await requireAdmin()

  const trackingNumber = formData.get('trackingNumber')?.toString()?.trim()?.toUpperCase()
  const customerName = formData.get('customerName')?.toString()?.trim()
  if (!trackingNumber || !customerName) throw new Error('Missing required fields')

  const description = (formData.get('description') as string)?.trim() || null
  const whatsappNumber = (formData.get('whatsappNumber') as string)?.trim() || null
  const clerkUserId = (formData.get('clerkUserId') as string)?.trim() || null
  const carrier = (formData.get('carrier') as string)?.trim() || null

  let pkg: typeof packages.$inferSelect
  try {
    const [inserted] = await db
      .insert(packages)
      .values({ trackingNumber, customerName, description, whatsappNumber, clerkUserId, carrier: carrier as Carrier | null })
      .returning()

    await db.insert(statusHistory).values({
      packageId: inserted.id,
      status: 'received_usa',
      note: null,
    })

    pkg = inserted
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('23505') || msg.includes('unique')) {
      throw new Error(`Tracking number ${trackingNumber} already exists`)
    }
    throw err
  }

  if (carrier) {
    const result = await getCarrierStatus(carrier as Carrier, trackingNumber).catch(() => null)
    await db
      .update(packages)
      .set({
        carrierRawStatus: result?.rawStatus ?? null,
        carrierLastSynced: new Date(),
      })
      .where(eq(packages.id, pkg.id))
  }

  redirect('/admin')
}
```

- [ ] **Step 2: Add carrier dropdown to the new package form**

In `src/app/admin/packages/new/page.tsx`, add the carrier select between the tracking number and customer name fields. Insert after the tracking number `</div>` block:

```tsx
<div>
  <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
    Carrier *
  </label>
  <select
    name="carrier"
    required
    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
  >
    <option value="">Selecciona un carrier</option>
    <option value="ups">UPS</option>
    <option value="fedex">FedEx</option>
    <option value="usps">USPS</option>
    <option value="dhl">DHL</option>
  </select>
</div>
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/packages.ts src/app/admin/packages/new/page.tsx
git commit -m "feat: add carrier field to createPackage action and new package form"
```

---

### Task 9: Add syncPackageCarrier Server Action

**Files:**
- Modify: `src/lib/actions/packages.ts`

- [ ] **Step 1: Add syncPackageCarrier to packages.ts**

Add this function at the end of `src/lib/actions/packages.ts`:

```ts
export async function syncPackageCarrier(packageId: string) {
  await requireAdmin()

  const pkg = await db.query.packages.findFirst({
    where: eq(packages.id, packageId),
    columns: { carrier: true, trackingNumber: true },
  })

  if (!pkg?.carrier) throw new Error('Package has no carrier assigned')

  const result = await getCarrierStatus(pkg.carrier as Carrier, pkg.trackingNumber).catch(() => null)

  await db
    .update(packages)
    .set({
      carrierRawStatus: result?.rawStatus ?? null,
      carrierLastSynced: new Date(),
    })
    .where(eq(packages.id, packageId))

  revalidatePath(`/admin/packages/${packageId}`)
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/packages.ts
git commit -m "feat: add syncPackageCarrier server action"
```

---

### Task 10: Implement cron route

**Files:**
- Create: `src/app/api/cron/sync-tracking/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create the cron API route**

Create `src/app/api/cron/sync-tracking/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { packages } from '@/db/schema'
import { isNotNull, ne, eq, and } from 'drizzle-orm'
import { getCarrierStatus } from '@/lib/carriers'
import type { Carrier } from '@/lib/carriers'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const activePackages = await db
    .select({
      id: packages.id,
      trackingNumber: packages.trackingNumber,
      carrier: packages.carrier,
    })
    .from(packages)
    .where(
      and(
        isNotNull(packages.carrier),
        ne(packages.status, 'delivered')
      )
    )

  let updated = 0
  let errors = 0

  for (const pkg of activePackages) {
    if (!pkg.carrier) continue
    try {
      const result = await getCarrierStatus(pkg.carrier as Carrier, pkg.trackingNumber)
      await db
        .update(packages)
        .set({ carrierRawStatus: result.rawStatus, carrierLastSynced: new Date() })
        .where(eq(packages.id, pkg.id))
      updated++
    } catch (err) {
      console.error(`Carrier sync failed for ${pkg.trackingNumber}:`, err)
      errors++
    }
  }

  return NextResponse.json({ updated, errors })
}
```

- [ ] **Step 2: Create vercel.json**

Create `vercel.json` at the project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-tracking",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

- [ ] **Step 3: Add CRON_SECRET to .env.local**

Open `.env.local` and add:

```
CRON_SECRET=replace-with-a-random-string-at-least-32-chars
```

Generate a secure value with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/sync-tracking/route.ts vercel.json
git commit -m "feat: add cron route for carrier tracking sync and vercel.json schedule"
```

---

### Task 11: Update admin package list UI

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add Carrier column to admin package list**

In `src/app/admin/page.tsx`, add `CARRIER_LABELS` import and a Carrier column:

Add import at the top:
```ts
import { CARRIER_LABELS } from '@/lib/carriers'
```

In the `<thead>` row, add after the Estado `<th>`:
```tsx
<th className="text-left px-5 py-3">Carrier</th>
```

In the `<tbody>` row mapping, add after the `<StatusBadge />` `<td>`:
```tsx
<td className="px-5 py-3 text-xs text-gray-500">
  {pkg.carrier ? CARRIER_LABELS[pkg.carrier] : '—'}
</td>
```

Also update the empty state `colSpan` from `5` to `6`.

- [ ] **Step 2: Run the dev server and verify**

Run: `npm run dev`

Open: `http://localhost:3000/admin`

Expected: A new "Carrier" column appears in the package table. Existing packages without a carrier show `—`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add Carrier column to admin package list"
```

---

### Task 12: Update admin package detail UI

**Files:**
- Modify: `src/app/admin/packages/[id]/page.tsx`

- [ ] **Step 1: Add carrier status card with sync button to the edit page**

In `src/app/admin/packages/[id]/page.tsx`, add the import for the new action and carrier labels:

```ts
import { updatePackageStatus, syncPackageCarrier } from '@/lib/actions/packages'
import { CARRIER_LABELS } from '@/lib/carriers'
```

Create a bound action for sync before the `return`:
```ts
const syncWithId = syncPackageCarrier.bind(null, pkg.id)
```

Add this carrier card inside the `<div className="grid ...">` after the update form `</form>`, before the history div:

```tsx
{pkg.carrier && (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-3 md:col-span-2">
    <div className="text-sm font-semibold text-gray-700 mb-2">
      Tracking del carrier
    </div>
    <div className="flex items-center gap-4 text-sm">
      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">
        {CARRIER_LABELS[pkg.carrier]}
      </span>
      <span className="text-gray-700">
        {pkg.carrierRawStatus
          ? pkg.carrierRawStatus
          : <span className="text-gray-400 italic">Sin datos</span>}
      </span>
    </div>
    {pkg.carrierLastSynced && (
      <p className="text-xs text-gray-400">
        Última sync: {pkg.carrierLastSynced.toLocaleString('es-CR')}
      </p>
    )}
    <form action={syncWithId}>
      <button
        type="submit"
        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
      >
        Sincronizar
      </button>
    </form>
  </div>
)}
```

- [ ] **Step 2: Run the dev server and verify**

Run: `npm run dev`

Open a package detail page at `http://localhost:3000/admin/packages/<id>` for a package with a carrier set.

Expected: The "Tracking del carrier" card appears with the carrier badge, raw status (or "Sin datos"), last sync time, and a Sincronizar button.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/packages/[id]/page.tsx
git commit -m "feat: add carrier tracking card with sync button to admin package detail"
```

---

### Task 13: Update public tracking page

**Files:**
- Modify: `src/app/track/[trackingNumber]/page.tsx`

- [ ] **Step 1: Add carrier raw status section to the public tracking page**

In `src/app/track/[trackingNumber]/page.tsx`, add the CARRIER_LABELS import:

```ts
import { CARRIER_LABELS } from '@/lib/carriers'
import type { Carrier } from '@/lib/carriers'
```

After the `<StatusTimeline ... />` block and before the `{canLink && ...}` block, add:

```tsx
{pkg.carrierRawStatus && pkg.carrier && (
  <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100">
    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
      Estado {CARRIER_LABELS[pkg.carrier as Carrier]}
    </div>
    <p className="text-sm text-gray-700">{pkg.carrierRawStatus}</p>
  </div>
)}
```

- [ ] **Step 2: Run the dev server and verify**

Run: `npm run dev`

Open a public tracking page for a package that has `carrierRawStatus` set.

Expected: A card with "Estado UPS / FedEx / ..." and the raw status text appears below the timeline. Packages without carrier data show nothing extra.

- [ ] **Step 3: Commit**

```bash
git add src/app/track/[trackingNumber]/page.tsx
git commit -m "feat: show carrier raw status on public tracking page"
```

---

### Task 14: Document new environment variables

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add carrier and cron env vars to the Environment Variables section in CLAUDE.md**

In `CLAUDE.md`, find the `## Environment Variables` section and append the new variables to the code block:

```
# Carrier APIs
UPS_CLIENT_ID=
UPS_CLIENT_SECRET=
FEDEX_CLIENT_ID=
FEDEX_CLIENT_SECRET=
USPS_CLIENT_ID=
USPS_CLIENT_SECRET=
DHL_API_KEY=

# Cron protection
CRON_SECRET=
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document carrier API and cron environment variables"
```

---

## Registration Links for Carrier APIs

To complete the integration, register for API credentials at:

| Carrier | Developer Portal |
|---|---|
| UPS | https://developer.ups.com — create app, request "Track" API access |
| FedEx | https://developer.fedex.com — create app, enable "Track API" |
| USPS | https://developer.usps.com — register, OAuth credentials under "My Apps" |
| DHL | https://developer.dhl.com — register, get API key for "Shipment Tracking" |
