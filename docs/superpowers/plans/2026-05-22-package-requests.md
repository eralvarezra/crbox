# Package Request System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow customers (guest or logged-in) to submit a tracking number request with name, WhatsApp, and invoice image; admins review, approve (auto-creating the package), or reject (with reason); WhatsApp notification sent on both outcomes.

**Architecture:** New `packageRequests` table in Neon. Invoice images uploaded to Vercel Blob via Server Action. Public `/request` page for customers, `/admin/requests` list and `/admin/requests/[id]` detail for admins. Three Server Actions: `submitPackageRequest`, `approveRequest`, `rejectRequest`. Two new WhatsApp helpers reuse the existing `getClient()` pattern.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + Neon, Clerk v7, Vercel Blob (`@vercel/blob`), Twilio WhatsApp, Tailwind CSS, Vitest.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/db/schema.ts` | Modify | Add `requestStatusEnum` + `packageRequests` table |
| `src/lib/whatsapp.ts` | Modify | Add `sendRequestApproved` + `sendRequestRejected` |
| `src/lib/whatsapp.test.ts` | Modify | Tests for the two new WhatsApp helpers |
| `next.config.ts` | Modify | Increase Server Action body size limit to 5 MB |
| `src/lib/actions/requests.ts` | Create | `submitPackageRequest`, `approveRequest`, `rejectRequest` |
| `src/components/request-form.tsx` | Create | Client component — public request form UI |
| `src/app/request/page.tsx` | Create | Public server page — auth check, passes props to form |
| `src/app/admin/requests/page.tsx` | Create | Admin list with status filter tabs |
| `src/app/admin/requests/[id]/page.tsx` | Create | Admin detail — approve / reject UI |
| `src/app/page.tsx` | Modify | Add "Registrar mi paquete" button |
| `src/app/admin/layout.tsx` | Modify | Add "Solicitudes" nav link with pending badge |

---

## Task 1: Add `packageRequests` table to schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add the enum and table to `src/db/schema.ts`**

Replace the entire file with:

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

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: packageStatusEnum('status').notNull().default('received_usa'),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  clerkUserId: varchar('clerk_user_id', { length: 200 }),
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
})
```

- [ ] **Step 2: Push schema to Neon**

```bash
npm run db:push
```

Expected: Drizzle prints the new `request_status` enum and `package_requests` table, then `✓ Your schema is up to date!`

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add packageRequests table and requestStatus enum to schema"
```

---

## Task 2: Add WhatsApp helpers for request notifications

**Files:**
- Modify: `src/lib/whatsapp.ts`
- Modify: `src/lib/whatsapp.test.ts`

- [ ] **Step 1: Write the failing tests first**

Add to the bottom of `src/lib/whatsapp.test.ts` (keep all existing tests, add below):

```ts
import { sendRequestApproved, sendRequestRejected } from './whatsapp'

describe('sendRequestApproved', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockCreate.mockResolvedValue({ sid: 'SM123' })
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
  })

  it('sends approval message with tracking number', async () => {
    await sendRequestApproved({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
    })

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+50688888888',
      body: 'Hola Juan Pérez, tu solicitud para el paquete 1Z999AA1 fue aprobada. Ya puedes rastrear tu paquete en nuestro sistema.',
    })
  })
})

describe('sendRequestRejected', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockCreate.mockResolvedValue({ sid: 'SM123' })
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
  })

  it('sends rejection message with reason', async () => {
    await sendRequestRejected({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
      reason: 'La factura no es legible',
    })

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+50688888888',
      body: 'Hola Juan Pérez, tu solicitud para el paquete 1Z999AA1 fue rechazada. Motivo: La factura no es legible.',
    })
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: `sendRequestApproved` and `sendRequestRejected` fail with `is not a function`.

- [ ] **Step 3: Add the two functions to `src/lib/whatsapp.ts`**

Append to the end of the file:

```ts
export async function sendRequestApproved(params: {
  to: string
  customerName: string
  trackingNumber: string
}): Promise<void> {
  const { to, customerName, trackingNumber } = params
  const body = `Hola ${customerName}, tu solicitud para el paquete ${trackingNumber} fue aprobada. Ya puedes rastrear tu paquete en nuestro sistema.`
  await getClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  })
}

export async function sendRequestRejected(params: {
  to: string
  customerName: string
  trackingNumber: string
  reason: string
}): Promise<void> {
  const { to, customerName, trackingNumber, reason } = params
  const body = `Hola ${customerName}, tu solicitud para el paquete ${trackingNumber} fue rechazada. Motivo: ${reason}.`
  await getClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  })
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: All tests pass including the 2 new ones.

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp.ts src/lib/whatsapp.test.ts
git commit -m "feat: add sendRequestApproved and sendRequestRejected WhatsApp helpers"
```

---

## Task 3: Install Vercel Blob and increase body size limit

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Install the package**

```bash
npm install @vercel/blob
```

Expected: Package added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Update `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

export default nextConfig
```

- [ ] **Step 3: Add env var to `.env.local`**

Open `.env.local` and add:

```
BLOB_READ_WRITE_TOKEN=<get this from Vercel Dashboard → Storage → Blob → your store → .env.local tab>
```

Note: If Vercel Blob store doesn't exist yet, create one at vercel.com → your project → Storage → Create Blob Store, then copy the token.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: install @vercel/blob and increase server action body limit to 5mb"
```

---

## Task 4: Create `submitPackageRequest` Server Action

**Files:**
- Create: `src/lib/actions/requests.ts`

- [ ] **Step 1: Create the file**

```ts
'use server'

import { db } from '@/db'
import { packageRequests, packages, statusHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'
import { sendRequestApproved, sendRequestRejected } from '@/lib/whatsapp'

async function requireAdmin() {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function submitPackageRequest(formData: FormData) {
  const { userId } = await auth()

  const trackingNumber = formData.get('trackingNumber')?.toString().trim().toUpperCase()
  const whatsappNumber = formData.get('whatsappNumber')?.toString().trim()
  const invoiceFile = formData.get('invoice') as File

  if (!trackingNumber || !whatsappNumber) throw new Error('Faltan campos requeridos')
  if (!invoiceFile || invoiceFile.size === 0) throw new Error('La factura es requerida')

  let customerName: string | null = null

  if (userId) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    customerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  } else {
    customerName = formData.get('customerName')?.toString().trim() || null
    if (!customerName) throw new Error('El nombre es requerido')
  }

  const blob = await put(`invoices/${Date.now()}-${invoiceFile.name}`, invoiceFile, {
    access: 'public',
  })

  await db.insert(packageRequests).values({
    trackingNumber,
    customerName,
    whatsappNumber,
    invoiceUrl: blob.url,
    clerkUserId: userId ?? null,
    status: 'pending',
  })

  redirect('/request?success=1')
}
```

- [ ] **Step 2: Verify the app compiles**

```bash
npm run build
```

Expected: Build succeeds (or only pre-existing warnings). Fix any TypeScript errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/requests.ts
git commit -m "feat: add submitPackageRequest server action with Vercel Blob upload"
```

---

## Task 5: Add `approveRequest` and `rejectRequest` Server Actions

**Files:**
- Modify: `src/lib/actions/requests.ts`

- [ ] **Step 1: Append both actions to `src/lib/actions/requests.ts`**

Add at the bottom of the file:

```ts
export async function approveRequest(requestId: string, _formData: FormData) {
  await requireAdmin()

  const request = await db.query.packageRequests.findFirst({
    where: eq(packageRequests.id, requestId),
  })
  if (!request) throw new Error('Solicitud no encontrada')

  const existing = await db.query.packages.findFirst({
    where: eq(packages.trackingNumber, request.trackingNumber),
    columns: { id: true },
  })
  if (existing) {
    redirect(`/admin/requests/${requestId}?duplicate=1`)
  }

  const customerName = request.customerName ?? 'Cliente'

  const [pkg] = await db
    .insert(packages)
    .values({
      trackingNumber: request.trackingNumber,
      customerName,
      whatsappNumber: request.whatsappNumber,
      clerkUserId: request.clerkUserId,
    })
    .returning()

  await db.insert(statusHistory).values({
    packageId: pkg.id,
    status: 'received_usa',
    note: null,
  })

  await db
    .update(packageRequests)
    .set({ status: 'approved' })
    .where(eq(packageRequests.id, requestId))

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

export async function rejectRequest(requestId: string, formData: FormData) {
  await requireAdmin()

  const reason = formData.get('reason')?.toString().trim()
  if (!reason) throw new Error('El motivo de rechazo es requerido')

  const request = await db.query.packageRequests.findFirst({
    where: eq(packageRequests.id, requestId),
  })
  if (!request) throw new Error('Solicitud no encontrada')

  const customerName = request.customerName ?? 'Cliente'

  await db
    .update(packageRequests)
    .set({ status: 'rejected', rejectionReason: reason })
    .where(eq(packageRequests.id, requestId))

  try {
    await sendRequestRejected({
      to: request.whatsappNumber,
      customerName,
      trackingNumber: request.trackingNumber,
      reason,
    })
  } catch (err) {
    console.error('WhatsApp notification failed:', err)
    redirect(`/admin/requests/${requestId}?whatsapp_error=1`)
  }

  redirect('/admin/requests')
}
```

- [ ] **Step 2: Verify the app compiles**

```bash
npm run build
```

Expected: Build succeeds. Fix any TypeScript errors before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/requests.ts
git commit -m "feat: add approveRequest and rejectRequest server actions"
```

---

## Task 6: Public request form page

**Files:**
- Create: `src/components/request-form.tsx`
- Create: `src/app/request/page.tsx`

- [ ] **Step 1: Create `src/components/request-form.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { submitPackageRequest } from '@/lib/actions/requests'
import PhoneInput from '@/components/phone-input'

export default function RequestForm({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean
  userName: string | null
}) {
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <form
      action={submitPackageRequest}
      className="bg-white rounded-xl shadow-sm p-6 space-y-5"
    >
      {isLoggedIn && userName && (
        <div className="bg-indigo-50 rounded-lg px-4 py-2 text-sm text-indigo-700">
          Enviando como <strong>{userName}</strong>
        </div>
      )}

      {!isLoggedIn && (
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Nombre completo *
          </label>
          <input
            name="customerName"
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Juan Pérez"
          />
        </div>
      )}

      <div>
        <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
          WhatsApp *
        </label>
        <PhoneInput />
      </div>

      <div>
        <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
          Tracking Number *
        </label>
        <input
          name="trackingNumber"
          required
          className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="1Z999AA10123456784"
        />
      </div>

      <div>
        <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
          Factura (imagen o PDF) *
        </label>
        <input
          name="invoice"
          type="file"
          accept="image/*,.pdf"
          required
          onChange={e => {
            const file = e.target.files?.[0]
            if (file && file.type.startsWith('image/')) {
              setPreview(URL.createObjectURL(file))
            } else {
              setPreview(null)
            }
          }}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 file:mr-3 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:px-3 file:py-1 file:rounded file:text-xs"
        />
        {preview && (
          <img
            src={preview}
            alt="Vista previa"
            className="mt-2 rounded-lg max-h-40 object-contain border"
          />
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Enviar solicitud
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create `src/app/request/page.tsx`**

```tsx
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NavBar } from '@/components/nav-bar'
import RequestForm from '@/components/request-form'

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const { userId } = await auth()

  let userName: string | null = null
  if (userId) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-900">
            Registrar mi paquete
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Envía tu tracking number y factura para que podamos agregar tu paquete al sistema.
          </p>
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-10 text-center">
              <p className="text-green-800 font-semibold text-lg mb-1">¡Solicitud enviada!</p>
              <p className="text-green-700 text-sm">
                Revisaremos tu información y te notificaremos por WhatsApp.
              </p>
            </div>
          ) : (
            <RequestForm isLoggedIn={!!userId} userName={userName} />
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify manually**

Start the dev server (`npm run dev`) and visit `http://localhost:3000/request`. Confirm:
- Guest view shows the name field
- Log in with a Clerk account and revisit — name field should be gone, replaced by "Enviando como [name]"
- Selecting an image shows the preview
- Stop the server when done

- [ ] **Step 4: Commit**

```bash
git add src/components/request-form.tsx src/app/request/page.tsx
git commit -m "feat: add public package request form page"
```

---

## Task 7: Admin requests list page

**Files:**
- Create: `src/app/admin/requests/page.tsx`

- [ ] **Step 1: Create `src/app/admin/requests/page.tsx`**

```tsx
import { db } from '@/db'
import { packageRequests } from '@/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
} as const

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const

const FILTER_OPTIONS: [string, string][] = [
  ['', 'Todas'],
  ['pending', 'Pendientes'],
  ['approved', 'Aprobadas'],
  ['rejected', 'Rechazadas'],
]

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const allRequests = await db
    .select()
    .from(packageRequests)
    .orderBy(desc(packageRequests.createdAt))

  const validStatus = ['pending', 'approved', 'rejected']
  const filtered =
    status && validStatus.includes(status)
      ? allRequests.filter(r => r.status === status)
      : allRequests

  return (
    <>
      <h1 className="text-xl font-bold mb-6">Solicitudes</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map(([val, label]) => (
          <Link
            key={val}
            href={val ? `/admin/requests?status=${val}` : '/admin/requests'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              (status ?? '') === val
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-10 text-center">No hay solicitudes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-xs uppercase text-gray-500 tracking-wide">
                <th className="px-4 py-3 text-left">Tracking</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">
                    <Link
                      href={`/admin/requests/${req.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {req.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{req.customerName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{req.whatsappNumber}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {req.createdAt.toLocaleDateString('es-CR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}
                    >
                      {STATUS_LABELS[req.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/requests/page.tsx
git commit -m "feat: add admin requests list page with status filter"
```

---

## Task 8: Admin request detail page

**Files:**
- Create: `src/app/admin/requests/[id]/page.tsx`

- [ ] **Step 1: Create `src/app/admin/requests/[id]/page.tsx`**

```tsx
import { db } from '@/db'
import { packageRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { approveRequest, rejectRequest } from '@/lib/actions/requests'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
} as const

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ whatsapp_error?: string; duplicate?: string }>
}) {
  const { id } = await params
  const { whatsapp_error, duplicate } = await searchParams

  const request = await db.query.packageRequests.findFirst({
    where: eq(packageRequests.id, id),
  })
  if (!request) notFound()

  const approveWithId = approveRequest.bind(null, request.id)
  const rejectWithId = rejectRequest.bind(null, request.id)

  const isPdf = request.invoiceUrl.toLowerCase().includes('.pdf') ||
    request.invoiceUrl.toLowerCase().includes('pdf')

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/requests" className="text-sm text-gray-500 hover:text-gray-700">
          ← Solicitudes
        </Link>
      </div>

      {whatsapp_error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
          Acción completada, pero la notificación por WhatsApp no se pudo enviar. Verifica que el número haya enviado un mensaje al sandbox de Twilio en las últimas 24 horas.
        </div>
      )}

      {duplicate && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-800">
          El tracking number <strong>{request.trackingNumber}</strong> ya existe en el sistema. Rechaza esta solicitud o elimina el paquete duplicado.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h1 className="text-lg font-bold">Solicitud</h1>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Estado</div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[request.status]}`}>
              {STATUS_LABELS[request.status]}
            </span>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Tracking Number</div>
            <p className="font-mono text-sm">{request.trackingNumber}</p>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Cliente</div>
            <p className="text-sm">{request.customerName ?? '—'}</p>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">WhatsApp</div>
            <p className="text-sm">{request.whatsappNumber}</p>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Fecha</div>
            <p className="text-sm text-gray-500">
              {request.createdAt.toLocaleDateString('es-CR')}
            </p>
          </div>

          {request.rejectionReason && (
            <div>
              <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Motivo de rechazo</div>
              <p className="text-sm text-red-600">{request.rejectionReason}</p>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="pt-2 space-y-3 border-t">
              <form action={approveWithId}>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Aprobar solicitud
                </button>
              </form>

              <form action={rejectWithId} className="space-y-2">
                <input
                  name="reason"
                  required
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Motivo del rechazo..."
                />
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Rechazar solicitud
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Factura</h2>
          {isPdf ? (
            <a
              href={request.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-8 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Ver PDF de factura
            </a>
          ) : (
            <a href={request.invoiceUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={request.invoiceUrl}
                alt="Factura"
                className="rounded-lg border max-w-full hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </a>
          )}
          <p className="text-xs text-gray-400 mt-2 text-center">Clic para ver completa</p>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/requests/[id]/page.tsx
git commit -m "feat: add admin request detail page with approve and reject actions"
```

---

## Task 9: Navigation updates

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Add "Registrar mi paquete" button to `src/app/page.tsx`**

Replace the entire file:

```tsx
import { PackageSearchForm } from '@/components/package-search-form'
import { NavBar } from '@/components/nav-bar'
import { SignInPrompt } from '@/components/sign-in-prompt'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex flex-col items-center justify-center py-24 px-4">
        <h1 className="text-3xl font-bold mb-3 text-gray-900">
          Rastrea tu paquete
        </h1>
        <p className="text-gray-500 text-sm mb-10 text-center max-w-sm">
          Ingresa tu número de tracking para ver el estado de tu envío de USA a Costa Rica
        </p>
        <PackageSearchForm />
        <SignInPrompt />
        <div className="mt-10 border-t pt-8 text-center">
          <p className="text-sm text-gray-500 mb-3">¿Tienes un paquete que aún no está en el sistema?</p>
          <Link
            href="/request"
            className="inline-block bg-white border border-indigo-300 text-indigo-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            Registrar mi paquete
          </Link>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Add "Solicitudes" link with pending badge to `src/app/admin/layout.tsx`**

Replace the entire file:

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { db } from '@/db'
import { packageRequests } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
    redirect('/')
  }

  const [{ value: pendingCount }] = await db
    .select({ value: count() })
    .from(packageRequests)
    .where(eq(packageRequests.status, 'pending'))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-indigo-700">
            📦 CRBox
          </Link>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-indigo-600">
            Paquetes
          </Link>
          <Link href="/admin/packages/new" className="text-sm text-gray-600 hover:text-indigo-600">
            + Nuevo
          </Link>
          <Link href="/admin/requests" className="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-1.5">
            Solicitudes
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
          <UserButton />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto py-8 px-4">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Verify end-to-end manually**

Start the dev server (`npm run dev`) and test the full flow:
1. Visit `http://localhost:3000` — confirm "Registrar mi paquete" button appears at the bottom
2. Click it — confirm the request form loads
3. Submit a request (use a real image file)
4. Log into admin — confirm "Solicitudes" appears in the nav with a red badge showing `1`
5. Click "Solicitudes" — confirm the request appears in the list as "Pendiente"
6. Click the tracking number — confirm the detail page shows all fields and the invoice image
7. Approve the request — confirm the package appears in `/admin`, the request shows "Aprobado"
8. Create another request and reject it with a reason — confirm it shows "Rechazado" with the reason

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/admin/layout.tsx
git commit -m "feat: add Registrar mi paquete button and Solicitudes nav link with pending badge"
```
