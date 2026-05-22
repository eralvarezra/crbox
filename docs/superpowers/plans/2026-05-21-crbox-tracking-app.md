# CRBox Tracking App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack package tracking webapp for CRBox (US→Costa Rica shipping) with public tracking, registered user dashboard, admin management, and WhatsApp status notifications via Twilio.

**Architecture:** Next.js 15 App Router monolith with Server Actions for all mutations. Clerk handles auth and admin role via `publicMetadata`. Neon PostgreSQL with Drizzle ORM stores packages and status history. Twilio WhatsApp API sends notifications when admin updates a package status.

**Tech Stack:** Next.js 15, TypeScript, Clerk (`@clerk/nextjs`), Neon (`@neondatabase/serverless`), Drizzle ORM (`drizzle-orm`, `drizzle-kit`), Twilio, Tailwind CSS v3, Vitest, React Testing Library

---

## File Map

```
src/
  app/
    layout.tsx                          # Root layout — ClerkProvider + Inter font
    globals.css                         # Tailwind base styles
    page.tsx                            # Homepage — tracking search
    sign-in/[[...sign-in]]/page.tsx     # Clerk sign-in catch-all
    sign-up/[[...sign-up]]/page.tsx     # Clerk sign-up catch-all
    track/
      [trackingNumber]/
        page.tsx                        # Package status timeline (public)
        not-found.tsx                   # "Tracking not found" 404 page
    dashboard/
      page.tsx                          # Registered user's package list
    admin/
      layout.tsx                        # Admin route guard (role check)
      page.tsx                          # Admin package list + search
      packages/
        new/
          page.tsx                      # Create new package form
        [id]/
          page.tsx                      # Edit package status form
  components/
    package-search-form.tsx             # Client component: tracking search input
    status-timeline.tsx                 # Package status vertical stepper
    status-badge.tsx                    # Color-coded status pill
    link-package-button.tsx             # "Vincular a mi cuenta" client button
  db/
    schema.ts                           # Drizzle table + enum definitions
    index.ts                            # Neon connection + Drizzle client
  lib/
    status.ts                           # Shared status constants (labels, order, badge config)
    whatsapp.ts                         # Twilio WhatsApp helper
    actions/
      packages.ts                       # Server Actions: createPackage, updatePackageStatus, linkPackageToUser
  test/
    setup.ts                            # Vitest setup: @testing-library/jest-dom
middleware.ts                           # Clerk route protection
drizzle.config.ts                       # Drizzle Kit config
vitest.config.ts                        # Vitest + jsdom config
```

---

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: project root (run `create-next-app` in `C:\Users\Erick\Desktop\CRBox`)
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `.env.local`

- [ ] **Step 1: Create Next.js 15 app**

Run inside `C:\Users\Erick\Desktop\CRBox`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```
Choose: Yes to all defaults. This creates the project in the current directory.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @clerk/nextjs @neondatabase/serverless drizzle-orm twilio
npm install -D drizzle-kit dotenv vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest"
```

- [ ] **Step 6: Create .env.local with all required variables**

Create `.env.local`:
```bash
# Neon
DATABASE_URL=postgresql://your-neon-connection-string-here

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=+14155238886
```

- [ ] **Step 7: Create drizzle.config.ts**

Create `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

- [ ] **Step 8: Add drizzle scripts to package.json**

Add to `"scripts"` in `package.json`:
```json
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 9: Verify project builds**

```bash
npm run build
```
Expected: Build completes with no errors (may show warnings about missing env vars, that's fine).

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: bootstrap Next.js 15 project with Clerk, Drizzle, Twilio deps"
```

---

## Task 2: Database Schema

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Write the schema**

Create `src/db/schema.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/db/schema.ts drizzle.config.ts
git commit -m "feat: add Drizzle schema for packages and status_history"
```

---

## Task 3: Database Connection and Migration

**Files:**
- Create: `src/db/index.ts`

- [ ] **Step 1: Create DB connection file**

Create `src/db/index.ts`:
```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 2: Push schema to Neon**

Make sure `DATABASE_URL` in `.env.local` points to your real Neon database, then run:
```bash
npm run db:push
```
Expected output:
```
[✓] Changes applied
```
This creates the `package_status` enum, `packages` table, and `status_history` table in your Neon database.

- [ ] **Step 3: Verify tables exist**

```bash
npm run db:studio
```
Open the URL shown (usually `https://local.drizzle.studio`). Verify `packages` and `status_history` tables appear. Press Ctrl+C to exit.

- [ ] **Step 4: Commit**

```bash
git add src/db/index.ts
git commit -m "feat: add Neon/Drizzle connection"
```

---

## Task 4: Status Constants

**Files:**
- Create: `src/lib/status.ts`

- [ ] **Step 1: Write shared status constants**

Create `src/lib/status.ts`:
```typescript
export type PackageStatus =
  | 'received_usa'
  | 'in_transit'
  | 'in_customs'
  | 'ready_pickup'
  | 'delivered'

export const STATUS_ORDER: PackageStatus[] = [
  'received_usa',
  'in_transit',
  'in_customs',
  'ready_pickup',
  'delivered',
]

export const STATUS_LABELS: Record<PackageStatus, string> = {
  received_usa: 'Recibido en bodega USA',
  in_transit: 'En tránsito',
  in_customs: 'En aduana CR',
  ready_pickup: 'Listo para retirar',
  delivered: 'Entregado',
}

export const STATUS_BADGE_CONFIG: Record<PackageStatus, { className: string }> = {
  received_usa: { className: 'bg-gray-100 text-gray-700' },
  in_transit: { className: 'bg-blue-100 text-blue-700' },
  in_customs: { className: 'bg-amber-100 text-amber-700' },
  ready_pickup: { className: 'bg-green-100 text-green-700' },
  delivered: { className: 'bg-gray-100 text-gray-500' },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/status.ts
git commit -m "feat: add shared package status constants"
```

---

## Task 5: Clerk Auth Setup

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `middleware.ts`
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Update root layout with ClerkProvider**

Replace all content in `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRBox — Tracking',
  description: 'Rastrea tus paquetes de USA a Costa Rica',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 2: Create Clerk middleware**

Create `middleware.ts` at project root:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  if (isDashboardRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)','/(api|trpc)(.*)'],
}
```

- [ ] **Step 3: Create sign-in page**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn />
    </div>
  )
}
```

- [ ] **Step 4: Create sign-up page**

Create `src/app/sign-up/[[...sign-up]]/page.tsx`:
```tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp />
    </div>
  )
}
```

- [ ] **Step 5: Set admin role in Clerk dashboard**

In your Clerk dashboard (clerk.com → your app → Users → select user → Metadata):
Set `publicMetadata` to: `{ "role": "admin" }` for your admin user.

This is a manual one-time step per admin account.

- [ ] **Step 6: Start dev server and verify auth routes work**

```bash
npm run dev
```
- Visit `http://localhost:3000/sign-in` — Clerk sign-in widget should appear.
- Visit `http://localhost:3000/admin` — should redirect to `/sign-in`.
- Visit `http://localhost:3000/dashboard` — should redirect to `/sign-in`.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx middleware.ts src/app/sign-in src/app/sign-up
git commit -m "feat: add Clerk auth, middleware route protection, sign-in/sign-up pages"
```

---

## Task 6: WhatsApp Helper

**Files:**
- Create: `src/lib/whatsapp.ts`
- Create: `src/lib/whatsapp.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/lib/whatsapp.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('twilio', () => ({
  default: () => ({
    messages: { create: mockCreate },
  }),
}))

import { sendStatusUpdate } from './whatsapp'

describe('sendStatusUpdate', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockCreate.mockResolvedValue({ sid: 'SM123' })
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886'
  })

  it('sends a WhatsApp message with the correct body', async () => {
    await sendStatusUpdate({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
      status: 'in_transit',
    })

    expect(mockCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+50688888888',
      body: 'Hola Juan Pérez, tu paquete 1Z999AA1 ha sido actualizado: *En tránsito*.',
    })
  })

  it('appends note to message when provided', async () => {
    await sendStatusUpdate({
      to: '+50688888888',
      customerName: 'Juan Pérez',
      trackingNumber: '1Z999AA1',
      status: 'in_customs',
      note: 'Requiere documentos',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Hola Juan Pérez, tu paquete 1Z999AA1 ha sido actualizado: *En aduana CR*. Requiere documentos',
      })
    )
  })

  it('does not append note when note is null', async () => {
    await sendStatusUpdate({
      to: '+50688888888',
      customerName: 'María',
      trackingNumber: 'ABC123',
      status: 'delivered',
      note: null,
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Hola María, tu paquete ABC123 ha sido actualizado: *Entregado*.',
      })
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test src/lib/whatsapp.test.ts
```
Expected: FAIL — `sendStatusUpdate` is not defined.

- [ ] **Step 3: Implement the WhatsApp helper**

Create `src/lib/whatsapp.ts`:
```typescript
import twilio from 'twilio'
import { STATUS_LABELS } from './status'

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
}

export async function sendStatusUpdate(params: {
  to: string
  customerName: string
  trackingNumber: string
  status: string
  note?: string | null
}): Promise<void> {
  const { to, customerName, trackingNumber, status, note } = params
  const statusLabel = STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status
  const noteText = note ? ` ${note}` : ''
  const body = `Hola ${customerName}, tu paquete ${trackingNumber} ha sido actualizado: *${statusLabel}*.${noteText}`

  await getClient().messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test src/lib/whatsapp.test.ts
```
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsapp.ts src/lib/whatsapp.test.ts
git commit -m "feat: add Twilio WhatsApp notification helper with tests"
```

---

## Task 7: Server Actions

**Files:**
- Create: `src/lib/actions/packages.ts`

- [ ] **Step 1: Create the Server Actions file**

Create `src/lib/actions/packages.ts`:
```typescript
'use server'

import { db } from '@/db'
import { packages, statusHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { sendStatusUpdate } from '@/lib/whatsapp'
import type { PackageStatus } from '@/lib/status'

async function requireAdmin() {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function createPackage(formData: FormData) {
  await requireAdmin()

  const trackingNumber = (formData.get('trackingNumber') as string).trim().toUpperCase()
  const customerName = (formData.get('customerName') as string).trim()
  const description = (formData.get('description') as string)?.trim() || null
  const whatsappNumber = (formData.get('whatsappNumber') as string)?.trim() || null
  const clerkUserId = (formData.get('clerkUserId') as string)?.trim() || null

  const [pkg] = await db
    .insert(packages)
    .values({ trackingNumber, customerName, description, whatsappNumber, clerkUserId })
    .returning()

  await db.insert(statusHistory).values({
    packageId: pkg.id,
    status: 'received_usa',
    note: null,
  })

  redirect('/admin')
}

export async function updatePackageStatus(packageId: string, formData: FormData) {
  await requireAdmin()

  const status = formData.get('status') as PackageStatus
  const note = (formData.get('note') as string)?.trim() || null

  const [pkg] = await db
    .update(packages)
    .set({ status, updatedAt: new Date() })
    .where(eq(packages.id, packageId))
    .returning()

  await db.insert(statusHistory).values({ packageId, status, note })

  if (pkg.whatsappNumber) {
    try {
      await sendStatusUpdate({
        to: pkg.whatsappNumber,
        customerName: pkg.customerName,
        trackingNumber: pkg.trackingNumber,
        status,
        note,
      })
    } catch (err) {
      console.error('WhatsApp notification failed:', err)
    }
  }

  redirect('/admin')
}

export async function linkPackageToUser(trackingNumber: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  await db
    .update(packages)
    .set({ clerkUserId: userId })
    .where(eq(packages.trackingNumber, trackingNumber))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/packages.ts
git commit -m "feat: add Server Actions for createPackage, updatePackageStatus, linkPackageToUser"
```

---

## Task 8: StatusBadge and StatusTimeline Components

**Files:**
- Create: `src/components/status-badge.tsx`
- Create: `src/components/status-timeline.tsx`
- Create: `src/components/status-badge.test.tsx`
- Create: `src/components/status-timeline.test.tsx`

- [ ] **Step 1: Write failing tests for StatusBadge**

Create `src/components/status-badge.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('displays the correct label for each status', () => {
    const { rerender } = render(<StatusBadge status="received_usa" />)
    expect(screen.getByText('Recibido en bodega USA')).toBeInTheDocument()

    rerender(<StatusBadge status="in_transit" />)
    expect(screen.getByText('En tránsito')).toBeInTheDocument()

    rerender(<StatusBadge status="in_customs" />)
    expect(screen.getByText('En aduana CR')).toBeInTheDocument()

    rerender(<StatusBadge status="ready_pickup" />)
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()

    rerender(<StatusBadge status="delivered" />)
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('applies amber color class for in_customs status', () => {
    render(<StatusBadge status="in_customs" />)
    const badge = screen.getByText('En aduana CR')
    expect(badge).toHaveClass('bg-amber-100')
    expect(badge).toHaveClass('text-amber-700')
  })

  it('applies green color class for ready_pickup status', () => {
    render(<StatusBadge status="ready_pickup" />)
    const badge = screen.getByText('Listo para retirar')
    expect(badge).toHaveClass('bg-green-100')
  })
})
```

- [ ] **Step 2: Write failing tests for StatusTimeline**

Create `src/components/status-timeline.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import { StatusTimeline } from './status-timeline'

describe('StatusTimeline', () => {
  it('renders all 5 status labels', () => {
    render(<StatusTimeline currentStatus="received_usa" history={[]} />)
    expect(screen.getByText('Recibido en bodega USA')).toBeInTheDocument()
    expect(screen.getByText('En tránsito')).toBeInTheDocument()
    expect(screen.getByText('En aduana CR')).toBeInTheDocument()
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
  })

  it('shows history note when present', () => {
    render(
      <StatusTimeline
        currentStatus="in_customs"
        history={[
          { status: 'in_customs', note: 'Requiere documentos', createdAt: new Date('2026-05-19') },
        ]}
      />
    )
    expect(screen.getByText('Requiere documentos')).toBeInTheDocument()
  })

  it('does not show note when history has no note', () => {
    render(
      <StatusTimeline
        currentStatus="in_transit"
        history={[
          { status: 'in_transit', note: null, createdAt: new Date('2026-05-18') },
        ]}
      />
    )
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test src/components/status-badge.test.tsx src/components/status-timeline.test.tsx
```
Expected: FAIL — components not defined.

- [ ] **Step 4: Implement StatusBadge**

Create `src/components/status-badge.tsx`:
```tsx
import { STATUS_LABELS, STATUS_BADGE_CONFIG } from '@/lib/status'
import type { PackageStatus } from '@/lib/status'

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as PackageStatus] ?? status
  const config = STATUS_BADGE_CONFIG[status as PackageStatus] ?? { className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.className}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 5: Implement StatusTimeline**

Create `src/components/status-timeline.tsx`:
```tsx
import { STATUS_ORDER, STATUS_LABELS } from '@/lib/status'
import type { PackageStatus } from '@/lib/status'

type HistoryEntry = {
  status: PackageStatus
  note: string | null
  createdAt: Date
}

type Props = {
  currentStatus: PackageStatus
  history: HistoryEntry[]
}

export function StatusTimeline({ currentStatus, history }: Props) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="flex flex-col">
      {STATUS_ORDER.map((status, index) => {
        const entry = history.find(h => h.status === status)
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex
        const isLast = index === STATUS_ORDER.length - 1

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isDone ? 'bg-indigo-600 text-white' : '',
                  isCurrent ? 'bg-amber-500 text-white' : '',
                  isPending ? 'bg-gray-200 text-gray-400' : '',
                ].join(' ')}
              >
                {isDone ? '✓' : index + 1}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-8 ${isDone ? 'bg-indigo-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
            <div className="pt-1 pb-4">
              <div
                className={`font-semibold text-sm ${
                  isPending ? 'text-gray-400' : isCurrent ? 'text-amber-600' : 'text-gray-800'
                }`}
              >
                {STATUS_LABELS[status]}
              </div>
              {entry && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {entry.createdAt.toLocaleString('es-CR')}
                </div>
              )}
              {entry?.note && (
                <div className="text-xs text-gray-600 italic mt-0.5">{entry.note}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test src/components/status-badge.test.tsx src/components/status-timeline.test.tsx
```
Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/status-badge.tsx src/components/status-badge.test.tsx src/components/status-timeline.tsx src/components/status-timeline.test.tsx
git commit -m "feat: add StatusBadge and StatusTimeline components with tests"
```

---

## Task 9: PackageSearchForm and LinkPackageButton

**Files:**
- Create: `src/components/package-search-form.tsx`
- Create: `src/components/link-package-button.tsx`

- [ ] **Step 1: Create PackageSearchForm**

Create `src/components/package-search-form.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PackageSearchForm() {
  const router = useRouter()
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim().toUpperCase()
    if (trimmed) router.push(`/track/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Ej: 1Z999AA10123456784"
        className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
      />
      <button
        type="submit"
        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
      >
        Buscar
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create LinkPackageButton**

Create `src/components/link-package-button.tsx`:
```tsx
'use client'

import { linkPackageToUser } from '@/lib/actions/packages'
import { useState } from 'react'

export function LinkPackageButton({ trackingNumber }: { trackingNumber: string }) {
  const [linked, setLinked] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLink() {
    setLoading(true)
    await linkPackageToUser(trackingNumber)
    setLinked(true)
    setLoading(false)
  }

  if (linked) {
    return (
      <p className="text-sm text-green-600 font-medium">
        ✓ Paquete vinculado a tu cuenta
      </p>
    )
  }

  return (
    <button
      onClick={handleLink}
      disabled={loading}
      className="text-sm text-indigo-600 border border-indigo-200 rounded-lg px-4 py-2 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Vinculando...' : 'Vincular a mi cuenta'}
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/package-search-form.tsx src/components/link-package-button.tsx
git commit -m "feat: add PackageSearchForm and LinkPackageButton client components"
```

---

## Task 10: Public Pages (Homepage, Track, Sign-in/Sign-up)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/track/[trackingNumber]/page.tsx`
- Create: `src/app/track/[trackingNumber]/not-found.tsx`

- [ ] **Step 1: Write the homepage**

Replace `src/app/page.tsx`:
```tsx
import { PackageSearchForm } from '@/components/package-search-form'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg text-indigo-700">📦 CRBox</span>
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm text-indigo-600 hover:underline"
            >
              Mis paquetes
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                Iniciar sesión
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Registrarse
            </Link>
          </SignedOut>
        </div>
      </nav>
      <main className="flex flex-col items-center justify-center py-24 px-4">
        <h1 className="text-3xl font-bold mb-3 text-gray-900">
          Rastrea tu paquete
        </h1>
        <p className="text-gray-500 text-sm mb-10 text-center max-w-sm">
          Ingresa tu número de tracking para ver el estado de tu envío de USA a Costa Rica
        </p>
        <PackageSearchForm />
        <p className="text-xs text-gray-400 mt-5">
          ¿Tienes cuenta?{' '}
          <Link href="/sign-in" className="text-indigo-500 hover:underline">
            Inicia sesión
          </Link>{' '}
          para ver todos tus paquetes
        </p>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Write the track page**

Create `src/app/track/[trackingNumber]/page.tsx`:
```tsx
import { db } from '@/db'
import { packages, statusHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { StatusTimeline } from '@/components/status-timeline'
import { LinkPackageButton } from '@/components/link-package-button'
import Link from 'next/link'
import type { PackageStatus } from '@/lib/status'

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>
}) {
  const { trackingNumber } = await params

  const pkg = await db.query.packages.findFirst({
    where: eq(packages.trackingNumber, trackingNumber.toUpperCase()),
  })

  if (!pkg) notFound()

  const history = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.packageId, pkg.id))
    .orderBy(statusHistory.createdAt)

  const { userId } = await auth()
  const canLink = !!userId && !pkg.clerkUserId

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3">
        <Link href="/" className="font-bold text-indigo-700">
          📦 CRBox
        </Link>
      </nav>
      <main className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Tracking Number
          </div>
          <div className="font-mono text-base font-semibold">{pkg.trackingNumber}</div>
          {pkg.description && (
            <div className="text-sm text-gray-600 mt-1">
              {pkg.description} — {pkg.customerName}
            </div>
          )}
        </div>

        <StatusTimeline
          currentStatus={pkg.status as PackageStatus}
          history={history.map(h => ({
            status: h.status as PackageStatus,
            note: h.note,
            createdAt: h.createdAt,
          }))}
        />

        {canLink && (
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-3">
              ¿Este es tu paquete?
            </p>
            <LinkPackageButton trackingNumber={pkg.trackingNumber} />
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Write the not-found page**

Create `src/app/track/[trackingNumber]/not-found.tsx`:
```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <p className="text-5xl mb-4">📦</p>
      <h1 className="text-xl font-bold mb-2 text-gray-800">
        Tracking number no encontrado
      </h1>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
        No encontramos ningún paquete con ese número de tracking. Verifica el número e intenta nuevamente.
      </p>
      <Link
        href="/"
        className="text-sm bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Start dev server and manually test homepage**

```bash
npm run dev
```
- Visit `http://localhost:3000` — search form should appear.
- Enter a non-existent tracking number — should redirect to `/track/FAKE123` and show the not-found page.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/track
git commit -m "feat: add homepage search and public track page with not-found"
```

---

## Task 11: User Dashboard

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write the dashboard page**

Create `src/app/dashboard/page.tsx`:
```tsx
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { packages } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/status-badge'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()

  const myPackages = await db
    .select()
    .from(packages)
    .where(eq(packages.clerkUserId, userId!))
    .orderBy(desc(packages.updatedAt))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-indigo-700">
          📦 CRBox
        </Link>
        <UserButton afterSignOutUrl="/" />
      </nav>
      <main className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-xl font-bold mb-6">
          Mis paquetes ({myPackages.length})
        </h1>
        {myPackages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm mb-4">
              No tienes paquetes vinculados todavía.
            </p>
            <Link
              href="/"
              className="text-sm text-indigo-600 hover:underline"
            >
              Busca tu tracking number para vincular un paquete →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myPackages.map(pkg => (
              <Link
                key={pkg.id}
                href={`/track/${pkg.trackingNumber}`}
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-mono text-sm font-semibold">
                      {pkg.trackingNumber}
                    </div>
                    {pkg.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {pkg.description}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={pkg.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Manually test dashboard**

```bash
npm run dev
```
- Sign in as a regular user, visit `http://localhost:3000/dashboard`.
- Should show empty state with link to search.
- Search for a package and click "Vincular a mi cuenta", then return to `/dashboard` — package should appear.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add user dashboard showing linked packages"
```

---

## Task 12: Admin Layout

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Write the admin layout**

Create `src/app/admin/layout.tsx`:
```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-indigo-700">
            📦 CRBox
          </Link>
          <Link
            href="/admin"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            Paquetes
          </Link>
          <Link
            href="/admin/packages/new"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            + Nuevo
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto py-8 px-4">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Verify admin route protection**

```bash
npm run dev
```
- Visit `http://localhost:3000/admin` while logged out — should redirect to `/sign-in`.
- Log in as non-admin — should redirect to `/`.
- Log in as admin (with `{ "role": "admin" }` in Clerk metadata) — should pass through.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: add admin layout with role check and navigation"
```

---

## Task 13: Admin Package List

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Write the admin package list page**

Create `src/app/admin/page.tsx`:
```tsx
import { db } from '@/db'
import { packages } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/status-badge'
import Link from 'next/link'

export default async function AdminPage() {
  const allPackages = await db
    .select()
    .from(packages)
    .orderBy(desc(packages.updatedAt))

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">
          Paquetes ({allPackages.length})
        </h1>
        <Link href="/admin/packages/new">
          <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            + Nuevo paquete
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Tracking</th>
              <th className="text-left px-5 py-3">Cliente</th>
              <th className="text-left px-5 py-3">Estado</th>
              <th className="text-left px-5 py-3">Actualizado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {allPackages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                  No hay paquetes registrados todavía.
                </td>
              </tr>
            )}
            {allPackages.map(pkg => (
              <tr key={pkg.id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs font-medium">
                  {pkg.trackingNumber}
                </td>
                <td className="px-5 py-3">{pkg.customerName}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={pkg.status} />
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {pkg.updatedAt.toLocaleDateString('es-CR')}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/packages/${pkg.id}`}
                    className="text-indigo-600 hover:underline text-xs font-medium"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add admin package list page"
```

---

## Task 14: Admin Create Package

**Files:**
- Create: `src/app/admin/packages/new/page.tsx`

- [ ] **Step 1: Write the create package page**

Create `src/app/admin/packages/new/page.tsx`:
```tsx
import { createPackage } from '@/lib/actions/packages'

export default function NewPackagePage() {
  return (
    <>
      <h1 className="text-xl font-bold mb-6">Nuevo paquete</h1>
      <form action={createPackage} className="bg-white rounded-xl shadow-sm p-6 max-w-lg space-y-5">
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
            Nombre del cliente *
          </label>
          <input
            name="customerName"
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Juan Pérez"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Descripción (opcional)
          </label>
          <input
            name="description"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Laptop Dell XPS 15"
          />
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            WhatsApp (opcional)
          </label>
          <input
            name="whatsappNumber"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="+50688888888"
          />
          <p className="text-xs text-gray-400 mt-1">
            Formato internacional: +506 para Costa Rica
          </p>
        </div>
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Clerk User ID (opcional)
          </label>
          <input
            name="clerkUserId"
            className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="user_2abc..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Vincula este paquete a una cuenta registrada
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Crear paquete
        </button>
      </form>
    </>
  )
}
```

- [ ] **Step 2: Manually test creating a package**

```bash
npm run dev
```
- Visit `http://localhost:3000/admin/packages/new`.
- Fill in: tracking number `TEST123`, customer name `Juan Pérez`.
- Submit — should redirect to `/admin` and show the new package in the table.
- Visit `http://localhost:3000/track/TEST123` — should show the status timeline with "Recibido en bodega USA" as current.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/packages/new/page.tsx
git commit -m "feat: add admin create package page"
```

---

## Task 15: Admin Edit Package

**Files:**
- Create: `src/app/admin/packages/[id]/page.tsx`

- [ ] **Step 1: Write the edit package page**

Create `src/app/admin/packages/[id]/page.tsx`:
```tsx
import { db } from '@/db'
import { packages, statusHistory } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { updatePackageStatus } from '@/lib/actions/packages'
import { StatusBadge } from '@/components/status-badge'

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const pkg = await db.query.packages.findFirst({
    where: eq(packages.id, id),
  })

  if (!pkg) notFound()

  const recentHistory = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.packageId, pkg.id))
    .orderBy(desc(statusHistory.createdAt))
    .limit(5)

  const updateWithId = updatePackageStatus.bind(null, pkg.id)

  return (
    <>
      <h1 className="text-xl font-bold mb-1">Editar paquete</h1>
      <p className="font-mono text-sm text-gray-500 mb-6">{pkg.trackingNumber}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form
          action={updateWithId}
          className="bg-white rounded-xl shadow-sm p-6 space-y-5"
        >
          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">
              Cliente
            </div>
            <p className="font-medium text-sm">{pkg.customerName}</p>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">
              Estado actual
            </div>
            <StatusBadge status={pkg.status} />
          </div>

          {pkg.whatsappNumber && (
            <div>
              <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">
                WhatsApp
              </div>
              <p className="text-sm text-gray-600">{pkg.whatsappNumber}</p>
            </div>
          )}

          <div>
            <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
              Nuevo estado *
            </label>
            <select
              name="status"
              defaultValue={pkg.status}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="received_usa">Recibido en bodega USA</option>
              <option value="in_transit">En tránsito</option>
              <option value="in_customs">En aduana CR</option>
              <option value="ready_pickup">Listo para retirar</option>
              <option value="delivered">Entregado</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
              Nota (opcional)
            </label>
            <input
              name="note"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Ej: Retenido en aduana, requiere documentos"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {pkg.whatsappNumber
              ? '💬 Guardar y notificar por WhatsApp'
              : 'Guardar cambios'}
          </button>
        </form>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Historial reciente
          </h2>
          <div className="space-y-2">
            {recentHistory.length === 0 && (
              <p className="text-xs text-gray-400">Sin historial.</p>
            )}
            {recentHistory.map(entry => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-sm px-4 py-3 text-xs"
              >
                <div className="flex justify-between items-center mb-0.5">
                  <StatusBadge status={entry.status} />
                  <span className="text-gray-400">
                    {entry.createdAt.toLocaleDateString('es-CR')}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-gray-500 italic mt-1">{entry.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Manually test full admin flow**

```bash
npm run dev
```
- Visit `/admin`, click "Editar" on the `TEST123` package.
- Change status to "En tránsito", add note "Salió de Miami".
- Submit — should redirect to `/admin`.
- Visit `/track/TEST123` — timeline should show step 2 (En tránsito) as current with the note and timestamp.

- [ ] **Step 3: Test WhatsApp notification (optional — requires live Twilio credentials)**

If Twilio credentials are configured in `.env.local`:
- Create a package with a valid WhatsApp number.
- Update its status — the phone should receive a WhatsApp message within seconds.
- If Twilio fails, check server logs — the status update should still succeed.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```
Expected: All unit tests pass (whatsapp helper + components).

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/packages/
git commit -m "feat: add admin edit package page with status update and WhatsApp trigger"
```

---

## Done

At this point the full application is complete:
- Public tracking search at `/`
- Package status timeline at `/track/[trackingNumber]`
- Registered user dashboard at `/dashboard` with package linking
- Admin package list, create, and edit at `/admin`
- WhatsApp notifications on status change via Twilio
- Route protection via Clerk middleware

**Deploy to Vercel:**
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Add env vars in Vercel dashboard matching your .env.local
```
