# 17track Webhook Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically track packages via 17track webhooks from approval through arrival in Costa Rica, then hand off to manual admin control.

**Architecture:** When an admin approves a package request, the tracking number is registered with 17track via their REST API. 17track monitors the carrier and POSTs webhook events to `/api/webhooks/17track`. The handler verifies the HMAC signature, maps 17track's event tag to a CRBox status, and updates the DB — stopping automatically once the package reaches `in_customs`.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + Neon PostgreSQL, Node.js `crypto` (built-in, no new deps), Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/db/schema.ts` | Modify | Add `trackingRegistered` boolean field |
| `src/lib/17track.ts` | Create | `registerTracking()` and `verifyWebhookSignature()` |
| `src/app/api/webhooks/17track/route.ts` | Create | Webhook POST handler |
| `src/lib/actions/requests.ts` | Modify | Call `registerTracking()` after approval |
| `src/app/admin/packages/[id]/page.tsx` | Modify | Show warning badge when `trackingRegistered = false` |
| `src/lib/__tests__/17track.test.ts` | Create | Unit tests for library functions |

---

### Task 1: Add `trackingRegistered` to schema and push

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add the field**

In `src/db/schema.ts`, add `trackingRegistered` to the `packages` table. The full updated `packages` table:

```ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core'

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: packageStatusEnum('status').notNull().default('received_usa'),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  clerkUserId: varchar('clerk_user_id', { length: 200 }),
  trackingRegistered: boolean('tracking_registered').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

- [ ] **Step 2: Push schema to Neon**

```bash
npm run db:push
```

Expected: Drizzle prompts to add the column, confirm. No data loss.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add trackingRegistered field to packages schema"
```

---

### Task 2: Create `src/lib/17track.ts`

**Files:**
- Create: `src/lib/17track.ts`

This file exports two functions: `registerTracking` (calls 17track's REST API) and `verifyWebhookSignature` (validates HMAC-SHA256).

17track API details:
- Register endpoint: `POST https://api.17track.net/track/v2.2/register`
- Auth header: `17token: <TRACK17_API_KEY>`
- Body: JSON array `[{ "number": "<trackingNumber>" }]`
- Success response: `{ "code": 0, ... }`
- Webhook signature: `tracksign` request header — HMAC-SHA256 of raw body using `TRACK17_WEBHOOK_SECRET`, hex-encoded

- [ ] **Step 1: Write the file**

```ts
import { createHmac, timingSafeEqual } from 'crypto'

export async function registerTracking(trackingNumber: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.17track.net/track/v2.2/register', {
      method: 'POST',
      headers: {
        '17token': process.env.TRACK17_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ number: trackingNumber }]),
    })

    if (!res.ok) {
      console.error(`17track register failed: HTTP ${res.status}`)
      return false
    }

    const json = await res.json()
    if (json.code !== 0) {
      console.error('17track register error:', json)
      return false
    }

    return true
  } catch (err) {
    console.error('17track register exception:', err)
    return false
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  try {
    const secret = process.env.TRACK17_WEBHOOK_SECRET!
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf = Buffer.from(signature, 'hex')
    if (expectedBuf.length !== actualBuf.length) return false
    return timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/17track.ts
git commit -m "feat: add 17track API client (registerTracking, verifyWebhookSignature)"
```

---

### Task 3: Unit tests for `src/lib/17track.ts`

**Files:**
- Create: `src/lib/__tests__/17track.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyWebhookSignature, registerTracking } from '../17track'
import { createHmac } from 'crypto'

// verifyWebhookSignature tests (pure crypto — no env needed)
describe('verifyWebhookSignature', () => {
  beforeEach(() => {
    vi.stubEnv('TRACK17_WEBHOOK_SECRET', 'test-secret')
  })

  it('returns true for a valid signature', () => {
    const body = '{"event":"tracking.track.update"}'
    const sig = createHmac('sha256', 'test-secret').update(body).digest('hex')
    expect(verifyWebhookSignature(body, sig)).toBe(true)
  })

  it('returns false for a wrong signature', () => {
    const body = '{"event":"tracking.track.update"}'
    expect(verifyWebhookSignature(body, 'deadbeef')).toBe(false)
  })

  it('returns false for tampered body', () => {
    const originalBody = '{"event":"tracking.track.update"}'
    const tamperedBody = '{"event":"tracking.track.update","extra":true}'
    const sig = createHmac('sha256', 'test-secret').update(originalBody).digest('hex')
    expect(verifyWebhookSignature(tamperedBody, sig)).toBe(false)
  })
})

// registerTracking tests (mocked fetch)
describe('registerTracking', () => {
  beforeEach(() => {
    vi.stubEnv('TRACK17_API_KEY', 'test-api-key')
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns true on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 0 }), { status: 200 })
    )
    const result = await registerTracking('1Z999AA10123456784')
    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'https://api.17track.net/track/v2.2/register',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ '17token': 'test-api-key' }),
        body: JSON.stringify([{ number: '1Z999AA10123456784' }]),
      })
    )
  })

  it('returns false when API returns non-zero code', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 1, message: 'error' }), { status: 200 })
    )
    const result = await registerTracking('BADTRACK')
    expect(result).toBe(false)
  })

  it('returns false on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('', { status: 500 })
    )
    const result = await registerTracking('1Z999AA10123456784')
    expect(result).toBe(false)
  })

  it('returns false on network exception', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    const result = await registerTracking('1Z999AA10123456784')
    expect(result).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test src/lib/__tests__/17track.test.ts
```

Expected: all 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/17track.test.ts
git commit -m "test: add unit tests for 17track client"
```

---

### Task 4: Create webhook route handler

**Files:**
- Create: `src/app/api/webhooks/17track/route.ts`

The webhook payload from 17track looks like:
```json
{
  "event": "tracking.track.update",
  "data": [
    {
      "number": "1Z999AA10123456784",
      "carrier": 21051,
      "tag": "InTransit",
      "track_info": {}
    }
  ]
}
```

The signature is in the `tracksign` request header (hex HMAC-SHA256).

Boundary statuses (ignore webhook if package is already at these): `in_customs`, `ready_pickup`, `delivered`.

Tag mapping:
- `"InTransit"` → `"in_transit"`
- `"Delivered"` → `"in_customs"`
- anything else → ignore

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { packages, statusHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyWebhookSignature } from '@/lib/17track'
import type { PackageStatus } from '@/lib/status'

const BOUNDARY_STATUSES: PackageStatus[] = ['in_customs', 'ready_pickup', 'delivered']

const TAG_MAP: Record<string, PackageStatus> = {
  InTransit: 'in_transit',
  Delivered: 'in_customs',
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('tracksign') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('17track webhook: invalid signature')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let payload: { data?: Array<{ number: string; tag: string }> }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const events = payload.data ?? []

  for (const event of events) {
    const newStatus = TAG_MAP[event.tag]
    if (!newStatus) continue

    const pkg = await db.query.packages.findFirst({
      where: eq(packages.trackingNumber, event.number),
      columns: { id: true, status: true },
    })

    if (!pkg) continue
    if (BOUNDARY_STATUSES.includes(pkg.status as PackageStatus)) continue

    await db
      .update(packages)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(packages.id, pkg.id))

    await db.insert(statusHistory).values({
      packageId: pkg.id,
      status: newStatus,
      note: null,
    })
  }

  return new NextResponse('OK', { status: 200 })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/webhooks/17track/route.ts
git commit -m "feat: add 17track webhook handler"
```

---

### Task 5: Call `registerTracking` in `approveRequest`

**Files:**
- Modify: `src/lib/actions/requests.ts`

- [ ] **Step 1: Import and call `registerTracking`**

Add the import at the top of `src/lib/actions/requests.ts`:

```ts
import { registerTracking } from '@/lib/17track'
```

Then, inside `approveRequest`, after the `sendRequestApproved` try/catch block (just before `redirect('/admin/requests')`), add:

```ts
  const registered = await registerTracking(request.trackingNumber)
  if (registered) {
    await db
      .update(packages)
      .set({ trackingRegistered: true })
      .where(eq(packages.id, pkg.id))
  } else {
    console.error(`17track registration failed for ${request.trackingNumber}`)
  }
```

The full `approveRequest` function after changes:

```ts
export async function approveRequest(requestId: string, _formData: FormData) {
  await requireAdmin()

  const request = await db.query.packageRequests.findFirst({
    where: eq(packageRequests.id, requestId),
  })
  if (!request) throw new Error('Solicitud no encontrada')
  if (request.status !== 'pending') throw new Error('Esta solicitud ya fue procesada')

  const existing = await db.query.packages.findFirst({
    where: eq(packages.trackingNumber, request.trackingNumber),
    columns: { id: true },
  })
  if (existing) {
    redirect(`/admin/requests/${requestId}?duplicate=1`)
  }

  const customerName = request.customerName ?? 'Cliente'

  let pkg: typeof packages.$inferSelect
  try {
    const [inserted] = await db
      .insert(packages)
      .values({
        trackingNumber: request.trackingNumber,
        customerName,
        whatsappNumber: request.whatsappNumber,
        clerkUserId: request.clerkUserId,
      })
      .returning()
    pkg = inserted
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('23505') || msg.includes('unique')) {
      redirect(`/admin/requests/${requestId}?duplicate=1`)
    }
    throw err
  }

  await db.insert(statusHistory).values({
    packageId: pkg.id,
    status: 'received_usa',
    note: null,
  })

  await db
    .update(packageRequests)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(packageRequests.id, requestId))

  const registered = await registerTracking(request.trackingNumber)
  if (registered) {
    await db
      .update(packages)
      .set({ trackingRegistered: true })
      .where(eq(packages.id, pkg.id))
  } else {
    console.error(`17track registration failed for ${request.trackingNumber}`)
  }

  try {
    await sendRequestApproved({
      to: request.whatsappNumber,
      customerName,
      trackingNumber: request.trackingNumber,
    })
  } catch (err) {
    console.error('WhatsApp notification failed:', err)
    redirect(`/admin/requests/${requestId}?whatsapp_error=1`)
  }

  redirect('/admin/requests')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/requests.ts
git commit -m "feat: register tracking in 17track on request approval"
```

---

### Task 6: Show warning badge in admin package detail page

**Files:**
- Modify: `src/app/admin/packages/[id]/page.tsx`

When `pkg.trackingRegistered` is `false`, show a yellow warning banner above the form.

- [ ] **Step 1: Add the warning banner**

Inside `src/app/admin/packages/[id]/page.tsx`, right after the existing `whatsapp_error` banner (after line 39) and before the `<h1>`, add:

```tsx
      {!pkg.trackingRegistered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
          ⚠️ Este paquete no está siendo rastreado automáticamente. El registro en 17track falló al aprobar la solicitud.
        </div>
      )}
```

The full return block becomes:

```tsx
  return (
    <>
      {whatsapp_error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
          Estado actualizado correctamente, pero la notificación por WhatsApp no se pudo enviar. Asegúrate de que el número haya enviado un mensaje al sandbox de Twilio en las últimas 24 horas.
        </div>
      )}
      {!pkg.trackingRegistered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
          ⚠️ Este paquete no está siendo rastreado automáticamente. El registro en 17track falló al aprobar la solicitud.
        </div>
      )}
      <h1 className="text-xl font-bold mb-1">Editar paquete</h1>
      {/* ... rest unchanged ... */}
    </>
  )
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/packages/[id]/page.tsx
git commit -m "feat: show warning badge when 17track registration failed"
```

---

### Task 7: Add env vars and verify build

- [ ] **Step 1: Add env vars to `.env.local`**

Add these two lines to `.env.local` (get values from 17track dashboard → API Keys, and Webhooks → Secret):

```
TRACK17_API_KEY=your_api_key_here
TRACK17_WEBHOOK_SECRET=your_webhook_secret_here
```

- [ ] **Step 2: Configure webhook URL in 17track dashboard**

In 17track dashboard → Webhooks, set the endpoint to:
```
https://your-domain.com/api/webhooks/17track
```

For local testing use ngrok: `ngrok http 3000`, then use the ngrok URL.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass, no regressions.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Final commit**

```bash
git add .env.local
git commit -m "chore: add 17track env var placeholders"
```
