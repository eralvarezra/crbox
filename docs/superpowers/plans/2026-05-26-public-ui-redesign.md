# Public UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the design handoff from `design_handoff_crbox_tracking/` — replacing the public-facing landing page and tracking page with a Vercel/Linear-aesthetic UI using Geist-style fonts and the 4-screen design spec.

**Architecture:** Four tasks each touching separate concerns: (1) font setup + CSS keyframes foundation, (2) a new shared `PublicTopBar` component, (3) the landing page + search form redesign, (4) the track page redesign covering all three states (found / not-found / pending). The admin pages are not touched.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, `next/font/google` (Inter + JetBrains Mono), Vitest + React Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/layout.tsx` | Modify | Add JetBrains Mono variable alongside Inter; fix body font |
| `src/app/globals.css` | Modify | Add `@keyframes ping` and `@keyframes pulseBg`; fix body font rule |
| `src/components/public-topbar.tsx` | Create | TopBar + Logo for public pages (landing, track) |
| `src/components/package-search-form.tsx` | Modify | New visual design: big input with search icon, clear button, arrow submit, keyboard hint |
| `src/app/page.tsx` | Modify | New landing: GridBg, eyebrow badge, large headline, search form, trust strip |
| `src/app/track/[trackingNumber]/page.tsx` | Modify | Redesign all 3 states: result (timeline hero), not-found (box illustration), pending (animated clock) |
| `src/test/components/public-topbar.test.tsx` | Create | Render tests for PublicTopBar |
| `src/test/components/package-search-form.test.tsx` | Create | Render + interaction tests for PackageSearchForm |

---

## Task 1: Fonts + Global CSS Foundations

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write a failing test that imports a component using font-mono class**

Create `src/test/components/font-smoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'

// Just verifies the vitest+RTL setup can render components with className
function MonoText() {
  return <span className="font-mono" data-testid="mono">1Z999AA1</span>
}

test('font-mono class renders', () => {
  render(<MonoText />)
  expect(screen.getByTestId('mono')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it passes (it's a smoke test)**

Run: `npm test -- src/test/components/font-smoke.test.tsx`
Expected: PASS (just checking RTL setup works for component tests)

- [ ] **Step 3: Update `src/app/layout.tsx` to add JetBrains Mono**

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'CRBox — Tracking',
  description: 'Rastrea tus paquetes de USA a Costa Rica',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] **Step 4: Update `src/app/globals.css` — add keyframes and fix body font**

Replace the entire file with:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0A0A0A;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
}

@keyframes ping {
  0% { transform: scale(0.7); opacity: 0.9; }
  80%, 100% { transform: scale(2.2); opacity: 0; }
}

@keyframes pulseBg {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 0.3; }
}
```

- [ ] **Step 5: Run the smoke test again to confirm fonts don't break RTL**

Run: `npm test -- src/test/components/font-smoke.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/test/components/font-smoke.test.tsx
git commit -m "feat: add JetBrains Mono font variable and CSS keyframes for ping/pulseBg"
```

---

## Task 2: PublicTopBar Component

**Files:**
- Create: `src/components/public-topbar.tsx`
- Create: `src/test/components/public-topbar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/test/components/public-topbar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { PublicTopBar } from '@/components/public-topbar'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

test('renders CRBox logo text', () => {
  render(<PublicTopBar />)
  expect(screen.getByText('CRBox')).toBeInTheDocument()
})

test('renders default nav: Ayuda and Ingresar', () => {
  render(<PublicTopBar />)
  expect(screen.getByText('Ayuda')).toBeInTheDocument()
  expect(screen.getByText('Ingresar')).toBeInTheDocument()
})

test('renders custom rightSlot when provided', () => {
  render(<PublicTopBar rightSlot={<span>Custom slot</span>} />)
  expect(screen.getByText('Custom slot')).toBeInTheDocument()
  expect(screen.queryByText('Ayuda')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- src/test/components/public-topbar.test.tsx`
Expected: FAIL — `Cannot find module '@/components/public-topbar'`

- [ ] **Step 3: Create `src/components/public-topbar.tsx`**

```tsx
import Link from 'next/link'

function Logo() {
  return (
    <div className="flex items-center gap-[9px]">
      <div className="w-[26px] h-[26px] rounded-[7px] bg-[#0A0A0A] relative grid place-items-center flex-shrink-0">
        <div className="absolute inset-[5px] border-[1.5px] border-[#4F46E5] rounded-[3px]" />
        <div className="absolute left-1/2 top-[5px] bottom-[5px] w-[1.5px] bg-[#4F46E5] -translate-x-1/2" />
      </div>
      <span className="font-semibold text-[16px] tracking-[-0.02em] text-[#0A0A0A]">CRBox</span>
    </div>
  )
}

export function PublicTopBar({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="h-16 shrink-0 sticky top-0 z-10 px-10 flex items-center justify-between border-b border-[#EDEDED] bg-white/85 backdrop-blur-[8px]">
      <Link href="/" aria-label="CRBox inicio">
        <Logo />
      </Link>
      <div className="flex items-center gap-4 text-[13.5px] text-[#525252] font-medium">
        {rightSlot ?? (
          <>
            <a href="#" className="text-[#525252] hover:text-[#0A0A0A] transition-colors">
              Ayuda
            </a>
            <a href="#" className="text-[#525252] hover:text-[#0A0A0A] transition-colors">
              Cómo funciona
            </a>
            <Link
              href="/sign-in"
              className="px-[14px] py-[7px] rounded-[8px] border border-[#E5E5E5] bg-white text-[13px] text-[#0A0A0A] hover:bg-gray-50 transition-colors"
            >
              Ingresar
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npm test -- src/test/components/public-topbar.test.tsx`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/public-topbar.tsx src/test/components/public-topbar.test.tsx
git commit -m "feat: add PublicTopBar component with Logo for public pages"
```

---

## Task 3: Landing Page Redesign

**Files:**
- Modify: `src/components/package-search-form.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/test/components/package-search-form.test.tsx`

- [ ] **Step 1: Write failing tests for new PackageSearchForm**

Create `src/test/components/package-search-form.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PackageSearchForm } from '@/components/package-search-form'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => mockPush.mockClear())

test('renders search input with correct placeholder', () => {
  render(<PackageSearchForm />)
  expect(screen.getByPlaceholderText(/1Z999AA10123456784/i)).toBeInTheDocument()
})

test('renders Rastrear submit button', () => {
  render(<PackageSearchForm />)
  expect(screen.getByRole('button', { name: /rastrear/i })).toBeInTheDocument()
})

test('shows clear button only when input has a value', () => {
  render(<PackageSearchForm />)
  expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByPlaceholderText(/1Z999AA10123456784/i), {
    target: { value: 'ABC123' },
  })
  expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument()
})

test('clear button resets input value', () => {
  render(<PackageSearchForm />)
  const input = screen.getByPlaceholderText(/1Z999AA10123456784/i)
  fireEvent.change(input, { target: { value: 'ABC123' } })
  fireEvent.click(screen.getByRole('button', { name: '✕' }))
  expect(input).toHaveValue('')
})

test('submits by navigating to /track/:TRACKING uppercased', () => {
  render(<PackageSearchForm />)
  fireEvent.change(screen.getByPlaceholderText(/1Z999AA10123456784/i), {
    target: { value: '1z999aa1' },
  })
  fireEvent.submit(screen.getByRole('button', { name: /rastrear/i }).closest('form')!)
  expect(mockPush).toHaveBeenCalledWith('/track/1Z999AA1')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- src/test/components/package-search-form.test.tsx`
Expected: FAIL — tests for `✕` button and new placeholder will fail since the current component doesn't have them

- [ ] **Step 3: Replace `src/components/package-search-form.tsx` with new design**

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
    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-[18px]">
      <div className="w-full flex gap-[10px]">
        <div
          className="flex-1 flex items-center gap-[10px] px-4 h-[52px] bg-white border border-[#E5E5E5] rounded-xl"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 4px 12px -8px rgba(0,0,0,.08)' }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="#A3A3A3" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Ej: 1Z999AA10123456784"
            className="flex-1 border-0 outline-none bg-transparent font-mono text-[14.5px] font-medium text-[#0A0A0A] tracking-[0.01em] placeholder:text-[#A3A3A3]"
            autoComplete="off"
            spellCheck={false}
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue('')}
              className="border-0 bg-transparent text-[#A3A3A3] cursor-pointer p-1 hover:text-[#525252] transition-colors leading-none"
              aria-label="✕"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-[52px] px-6 rounded-xl bg-[#4F46E5] text-white font-semibold text-[14.5px] flex items-center gap-2 cursor-pointer border-0 hover:bg-[#4338CA] transition-colors"
          style={{ boxShadow: '0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.55)' }}
        >
          Rastrear
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
      <div className="text-[12.5px] text-[#737373] flex items-center gap-2">
        <kbd className="font-mono text-[11px] px-[7px] py-[2px] rounded-[5px] bg-[#F5F5F5] border border-[#E5E5E5] text-[#404040]">
          ↵
        </kbd>
        <span>Presioná Enter o usá tu código CRB-XXXXX</span>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npm test -- src/test/components/package-search-form.test.tsx`
Expected: PASS — 5 tests

- [ ] **Step 5: Replace `src/app/page.tsx` with new landing design**

```tsx
import { PackageSearchForm } from '@/components/package-search-form'
import { PublicTopBar } from '@/components/public-topbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicTopBar />
      <main className="flex-1 relative grid place-items-center py-12">
        {/* Grid background */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(79,70,229,0.06), transparent 50%),
              linear-gradient(#F4F4F4 1px, transparent 1px),
              linear-gradient(90deg, #F4F4F4 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 56px 56px, 56px 56px',
            maskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[560px] px-8 flex flex-col items-center text-center">
          {/* Eyebrow badge */}
          <span
            className="inline-flex items-center gap-2 pl-[6px] pr-3 py-[5px] rounded-full bg-white border border-[#E5E5E5] text-[12.5px] font-medium text-[#404040]"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}
          >
            <span className="inline-flex items-center gap-[5px] px-2 py-[2px] rounded-full bg-[rgba(16,185,129,.1)] text-[#047857] text-[11px] font-semibold tracking-[0.01em]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#10B981] shrink-0" />
              EN VIVO
            </span>
            <span>Rastreo público · USA → Costa Rica</span>
          </span>

          {/* Headline */}
          <h1 className="text-[48px] leading-[1.05] tracking-[-0.035em] font-semibold mt-7 mb-[14px] text-[#0A0A0A]">
            Rastrea tu paquete<br />desde USA.
          </h1>

          <p className="text-[16px] text-[#737373] max-w-[420px] leading-[1.55] m-0">
            Ingresá tu número de tracking para ver el estado de tu paquete en tiempo real.
          </p>

          {/* Search form */}
          <div className="mt-10 w-full">
            <PackageSearchForm />
          </div>

          {/* Trust strip */}
          <div className="mt-14 flex gap-8 items-center pt-6 border-t border-[#EDEDED] w-full justify-center">
            {[
              ['28,400+', 'paquetes entregados'],
              ['3–5 días', 'Miami → SJO'],
              ['98.7%', 'puntualidad'],
            ].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0A]">{n}</div>
                <div className="text-[12px] text-[#737373] mt-[2px]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Run all tests to confirm nothing is broken**

Run: `npm test`
Expected: All tests pass (carrier tests + new component tests)

- [ ] **Step 7: Commit**

```bash
git add src/components/package-search-form.tsx src/app/page.tsx src/test/components/package-search-form.test.tsx
git commit -m "feat: redesign landing page and search form with new Vercel-style UI"
```

---

## Task 4: Track Page Redesign (All 3 States)

**Files:**
- Modify: `src/app/track/[trackingNumber]/page.tsx`

This task rewrites the track page to handle three states with the new design:
- **Found** → Summary card + progress bar + 5-step timeline
- **Not found** → Isometric box illustration + register CTA
- **Pending** → Animated clock + mini 3-step timeline

**Context about existing data model:**
- `packages` table has: `trackingNumber`, `customerName`, `description`, `status`, `carrier`, `carrierRawStatus`, `clerkUserId`, `whatsappNumber`
- `statusHistory` table has: `packageId`, `status`, `note`, `createdAt`
- `packageRequests` table has: `trackingNumber`, `status` (pending/approved/rejected)
- `STATUS_ORDER` = `['received_usa', 'in_transit', 'in_customs', 'ready_pickup', 'delivered']`
- `STATUS_LABELS` maps each key to Spanish text
- `CARRIER_LABELS` maps `ups/fedex/usps/dhl` to `UPS/FedEx/USPS/DHL`

**Important behavior change:** The current code calls `notFound()` (Next.js 404) when a tracking number is not found. This task changes it to render the custom "not found" design screen instead.

- [ ] **Step 1: No test to write** — the track page is a Server Component that requires DB access. Manual verification via dev server is the test strategy here (the existing RTL/Vitest setup doesn't support Next.js Server Components with DB mocking in this project's current configuration).

Run: `npm test`
Expected: All existing tests pass (nothing changed yet)

- [ ] **Step 2: Replace `src/app/track/[trackingNumber]/page.tsx` entirely**

```tsx
import { db } from '@/db'
import { packages, packageRequests, statusHistory } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { LinkPackageButton } from '@/components/link-package-button'
import { PublicTopBar } from '@/components/public-topbar'
import Link from 'next/link'
import type { PackageStatus } from '@/lib/status'
import { STATUS_ORDER, STATUS_LABELS } from '@/lib/status'
import { CARRIER_LABELS } from '@/lib/carriers'
import type { Carrier } from '@/lib/carriers'
import type React from 'react'

const GRID_BG_STYLE = {
  backgroundImage: `
    radial-gradient(circle at 50% 0%, rgba(79,70,229,0.06), transparent 50%),
    linear-gradient(#F4F4F4 1px, transparent 1px),
    linear-gradient(90deg, #F4F4F4 1px, transparent 1px)
  `,
  backgroundSize: '100% 100%, 56px 56px, 56px 56px',
  maskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
  WebkitMaskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
} as React.CSSProperties

const STATUS_BADGE_TEXT: Record<PackageStatus, string> = {
  received_usa: 'RECIBIDO',
  in_transit: 'EN TRÁNSITO',
  in_customs: 'EN ADUANA',
  ready_pickup: 'LISTO P/ RETIRAR',
  delivered: 'ENTREGADO',
}

const STEP_SUB: Record<PackageStatus, string> = {
  received_usa: 'Miami, FL · 8421 NW 56th St',
  in_transit: 'Vuelo Miami → SJO',
  in_customs: 'Aduana Juan Santamaría',
  ready_pickup: 'Sucursal a confirmar',
  delivered: '',
}

const STEP_DETAIL: Record<PackageStatus, string> = {
  received_usa: 'Paquete recibido y verificado en bodega Miami.',
  in_transit: 'Tu paquete está en camino al Aeropuerto Internacional Juan Santamaría.',
  in_customs: 'Trámite aduanal en proceso. Te notificaremos cuando esté liquidado.',
  ready_pickup: 'Disponible para retiro en sucursal o entrega a domicilio.',
  delivered: 'Paquete entregado. ¡Gracias por usar CRBox!',
}

const PROGRESS_PCT = [10, 30, 50, 70, 100]

function GridBg() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none" style={GRID_BG_STYLE} />
  )
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>
}) {
  const { trackingNumber } = await params
  const normalizedTracking = trackingNumber.toUpperCase()

  const pkg = await db.query.packages.findFirst({
    where: eq(packages.trackingNumber, normalizedTracking),
  })

  // ── State: not found ──────────────────────────────────────────
  if (!pkg) {
    const pendingRequest = await db.query.packageRequests.findFirst({
      where: eq(packageRequests.trackingNumber, normalizedTracking),
      columns: { status: true, trackingNumber: true },
    })

    // ── State: pending review ───────────────────────────────────
    if (pendingRequest?.status === 'pending') {
      type MiniStepState = 'done' | 'active' | 'pending'
      const miniSteps: Array<{ state: MiniStepState; title: string; sub: string }> = [
        { state: 'done', title: 'Solicitud recibida', sub: 'Hoy' },
        { state: 'active', title: 'Verificación en bodega Miami', sub: 'En curso' },
        { state: 'pending', title: 'Tracking activado', sub: 'Te avisamos por WhatsApp' },
      ]
      return (
        <div className="min-h-screen bg-white flex flex-col">
          <PublicTopBar />
          <div className="flex-1 relative grid place-items-center py-12 px-8">
            <GridBg />
            <div className="relative z-10 w-full max-w-[540px] flex flex-col items-center text-center">
              {/* Animated clock */}
              <div className="relative w-[88px] h-[88px] mb-6">
                <div
                  className="absolute inset-0 rounded-full bg-[rgba(79,70,229,.1)]"
                  style={{ animation: 'pulseBg 2.4s ease-in-out infinite' }}
                />
                <div
                  className="absolute inset-[10px] rounded-full bg-[rgba(79,70,229,.18)]"
                  style={{ animation: 'pulseBg 2.4s ease-in-out 0.3s infinite' }}
                />
                <div
                  className="absolute inset-[20px] rounded-full bg-[#4F46E5] text-white grid place-items-center"
                  style={{ boxShadow: '0 8px 20px -6px rgba(79,70,229,.5)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15.5 14" />
                  </svg>
                </div>
              </div>

              {/* Status pill */}
              <span className="inline-flex items-center gap-[7px] px-[11px] py-[5px] rounded-full bg-[rgba(79,70,229,.08)] text-[#4F46E5] text-[11.5px] font-semibold tracking-[0.04em] mb-[18px]">
                <span className="w-[6px] h-[6px] rounded-full bg-[#4F46E5]" />
                EN REVISIÓN
              </span>

              <h1 className="text-[30px] font-semibold tracking-[-0.025em] text-[#0A0A0A] leading-[1.15] m-0">
                Tu solicitud está en revisión
              </h1>
              <p className="text-[15px] text-[#737373] mt-3 leading-[1.55] max-w-[420px]">
                Un agente está verificando tu paquete en bodega. Cuando esté aprobado, podrás rastrearlo desde acá.
              </p>

              {/* Reference card */}
              <div className="mt-7 w-full px-5 py-4 bg-white border border-[#EDEDED] rounded-xl flex items-center justify-between text-left">
                <div>
                  <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-[0.12em]">Tracking</div>
                  <div className="font-mono text-[14px] font-semibold text-[#0A0A0A] mt-[3px]">
                    {pendingRequest.trackingNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-[0.12em]">Respuesta en</div>
                  <div className="text-[14px] font-semibold text-[#0A0A0A] mt-[3px]">~ 24–48 h</div>
                </div>
              </div>

              {/* Mini timeline */}
              <div className="mt-4 w-full px-[22px] py-5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-left">
                <div className="text-[11.5px] font-semibold text-[#737373] uppercase tracking-[0.12em] mb-[14px]">
                  Próximos pasos
                </div>
                {miniSteps.map((s, i, arr) => (
                  <div
                    key={s.title}
                    className="grid gap-[14px] items-start relative"
                    style={{
                      gridTemplateColumns: '24px 1fr auto',
                      paddingBottom: i === arr.length - 1 ? 0 : 14,
                    }}
                  >
                    {i !== arr.length - 1 && (
                      <div
                        className="absolute w-[2px] rounded-sm"
                        style={{
                          left: 11,
                          top: 24,
                          bottom: 0,
                          background: s.state === 'done' ? '#10B981' : '#E5E5E5',
                        }}
                      />
                    )}
                    <div
                      className="w-6 h-6 rounded-full grid place-items-center text-white relative z-10"
                      style={{
                        background: s.state === 'done' ? '#10B981' : s.state === 'active' ? '#4F46E5' : '#fff',
                        border: s.state === 'pending' ? '1.5px solid #E5E5E5' : '0',
                        boxShadow: s.state === 'active' ? '0 0 0 4px rgba(79,70,229,.12)' : 'none',
                      }}
                    >
                      {s.state === 'done' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {s.state === 'active' && (
                        <span className="w-[7px] h-[7px] rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <div
                        className="text-[13.5px] font-semibold"
                        style={{ color: s.state === 'pending' ? '#A3A3A3' : '#0A0A0A' }}
                      >
                        {s.title}
                      </div>
                      <div
                        className="text-[12px] mt-[2px]"
                        style={{ color: s.state === 'pending' ? '#A3A3A3' : '#737373' }}
                      >
                        {s.sub}
                      </div>
                    </div>
                    <div
                      className="text-[11px] font-semibold rounded-[5px] tracking-[0.04em] whitespace-nowrap"
                      style={{
                        color: s.state === 'active' ? '#4F46E5' : 'transparent',
                        background: s.state === 'active' ? 'rgba(79,70,229,.1)' : 'transparent',
                        padding: s.state === 'active' ? '3px 8px' : '0',
                      }}
                    >
                      {s.state === 'active' ? 'AHORA' : ''}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer actions */}
              <div className="mt-6 flex gap-[10px]">
                <Link
                  href="/"
                  className="h-[42px] px-[18px] rounded-[10px] bg-white border border-[#E5E5E5] text-[#0A0A0A] font-medium text-[13.5px] flex items-center hover:bg-gray-50 transition-colors"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // ── State: not found ──────────────────────────────────────────
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <PublicTopBar />
        <div className="flex-1 relative grid place-items-center py-12 px-8">
          <GridBg />
          <div className="relative z-10 w-full max-w-[520px] flex flex-col items-center text-center">
            {/* Isometric box illustration */}
            <div className="relative w-[160px] h-[140px] mb-6">
              <svg width="160" height="140" viewBox="0 0 160 140" fill="none">
                <path d="M30 50 L80 30 L130 50 L80 70 Z" fill="#F5F5F5" stroke="#D4D4D4" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M30 50 L30 100 L80 120 L80 70 Z" fill="#EDEDED" stroke="#D4D4D4" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M130 50 L130 100 L80 120 L80 70 Z" fill="#FAFAFA" stroke="#D4D4D4" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M55 40 L105 60 L130 50" stroke="#A3A3A3" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
                <g transform="translate(80 18)">
                  <circle r="14" fill="#fff" stroke="#4F46E5" strokeWidth="1.5" />
                  <text x="0" y="5" textAnchor="middle" fontFamily="Geist, Inter, ui-sans-serif" fontSize="16" fontWeight="700" fill="#4F46E5">?</text>
                </g>
                <line x1="22" y1="38" x2="14" y2="34" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="138" y1="38" x2="146" y2="34" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="80" y1="130" x2="80" y2="136" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[#0A0A0A] m-0">
              No encontramos ese paquete
            </h1>
            <p className="text-[15px] text-[#737373] mt-3 leading-[1.55] max-w-[400px]">
              El tracking{' '}
              <code className="font-mono text-[13px] bg-[#F5F5F5] px-[7px] py-[2px] rounded-[5px] text-[#404040] border border-[#E5E5E5]">
                {normalizedTracking}
              </code>{' '}
              aún no está en nuestro sistema. Puede que el vendedor todavía no lo haya despachado, o que debas registrarlo.
            </p>

            <div className="mt-8 flex gap-[10px]">
              <Link
                href="/request"
                className="h-[44px] px-5 rounded-[10px] bg-[#4F46E5] text-white font-semibold text-[14px] flex items-center gap-2 border-0 hover:bg-[#4338CA] transition-colors"
                style={{ boxShadow: '0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.5)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Registrar mi paquete
              </Link>
              <Link
                href="/"
                className="h-[44px] px-5 rounded-[10px] bg-white border border-[#E5E5E5] text-[#0A0A0A] font-medium text-[14px] flex items-center hover:bg-gray-50 transition-colors"
              >
                Intentar de nuevo
              </Link>
            </div>

            {/* Helper card */}
            <div className="mt-10 w-full px-5 py-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-start gap-3 text-left">
              <div className="w-7 h-7 rounded-[7px] bg-[rgba(16,185,129,.12)] text-[#047857] grid place-items-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="text-[13px] text-[#525252] leading-[1.5]">
                <b className="text-[#0A0A0A] font-semibold">¿Es la primera vez que enviás con CRBox?</b>
                <br />
                Cuando registrás tu paquete, un agente lo verifica y queda disponible para rastreo en menos de 24h.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── State: package found ──────────────────────────────────────
  const history = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.packageId, pkg.id))
    .orderBy(statusHistory.createdAt)

  const { userId } = await auth()
  const canLink = !!userId && !pkg.clerkUserId

  const currentIndex = STATUS_ORDER.indexOf(pkg.status as PackageStatus)
  const progressPct = PROGRESS_PCT[currentIndex] ?? 100
  const isDelivered = pkg.status === 'delivered'

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <PublicTopBar
        rightSlot={
          <>
            <span className="text-[#737373] text-[13px]">Rastreo público</span>
            <Link
              href="/sign-in"
              className="px-[14px] py-[7px] rounded-[8px] border border-[#E5E5E5] bg-white text-[13px] text-[#0A0A0A] font-medium hover:bg-gray-50 transition-colors"
            >
              Ingresar
            </Link>
          </>
        }
      />

      <div className="flex-1 px-10 py-8 pb-14 overflow-auto">
        <div className="max-w-[880px] mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-[6px] text-[13px] text-[#525252] mb-6 hover:text-[#0A0A0A] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Nueva búsqueda
          </Link>

          {/* Summary card */}
          <div
            className="bg-white border border-[#EDEDED] rounded-2xl px-7 py-6 flex items-center justify-between gap-6 flex-wrap"
          >
            <div>
              <div className="text-[11.5px] font-semibold text-[#737373] uppercase tracking-[0.12em]">
                Tracking
              </div>
              <div className="font-mono text-[20px] font-semibold text-[#0A0A0A] mt-1 tracking-[0.01em]">
                {pkg.trackingNumber}
              </div>
              <div className="flex gap-4 mt-3 text-[13px] text-[#525252] flex-wrap">
                {pkg.customerName && (
                  <span>
                    <b className="text-[#0A0A0A] font-semibold">{pkg.customerName}</b>
                  </span>
                )}
                {pkg.customerName && pkg.description && (
                  <span className="text-[#D4D4D4]">·</span>
                )}
                {pkg.description && <span>{pkg.description}</span>}
              </div>
            </div>

            <div className="flex flex-col items-end gap-[10px]">
              {/* Status badge with ping animation */}
              <div
                className="inline-flex items-center gap-[6px] px-[11px] py-[5px] rounded-full text-[12px] font-semibold"
                style={{
                  background: isDelivered ? 'rgba(16,185,129,.1)' : 'rgba(79,70,229,.08)',
                  color: isDelivered ? '#047857' : '#4F46E5',
                }}
              >
                <span className="relative inline-flex">
                  <span
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ background: isDelivered ? '#10B981' : '#4F46E5' }}
                  />
                  {!isDelivered && (
                    <span
                      className="absolute inset-[-3px] border-[1.5px] rounded-full"
                      style={{
                        borderColor: '#4F46E5',
                        animation: 'ping 2s infinite',
                      }}
                    />
                  )}
                </span>
                {STATUS_BADGE_TEXT[pkg.status as PackageStatus]}
              </div>

              {/* Carrier raw status */}
              {pkg.carrier && (
                <div className="text-[12px] text-[#525252] flex items-center gap-2">
                  <span
                    className="font-mono px-[7px] py-[2px] bg-[#F5F5F5] border border-[#E5E5E5] rounded-[5px] text-[11px] font-medium text-[#404040]"
                  >
                    {CARRIER_LABELS[pkg.carrier as Carrier]}
                  </span>
                  {pkg.carrierRawStatus && (
                    <span>{pkg.carrierRawStatus.length > 30 ? pkg.carrierRawStatus.slice(0, 30) + '…' : pkg.carrierRawStatus}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline card */}
          <div className="mt-7 bg-white border border-[#EDEDED] rounded-2xl px-11 py-10">
            <div className="flex items-start justify-between mb-9">
              <div>
                <div className="text-[11.5px] font-semibold text-[#737373] uppercase tracking-[0.12em]">
                  Progreso
                </div>
                <h2 className="text-[24px] font-semibold mt-[6px] tracking-[-0.02em] text-[#0A0A0A]">
                  Paso {currentIndex + 1} de {STATUS_ORDER.length} · {STATUS_LABELS[pkg.status as PackageStatus]}
                </h2>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-[#F0F0F0] rounded-full overflow-hidden mb-10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #10B981 0%, #10B981 70%, #4F46E5 100%)',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>

            {/* Timeline steps */}
            <ol className="list-none m-0 p-0 relative">
              {STATUS_ORDER.map((status, i) => {
                const done = i < currentIndex
                const active = i === currentIndex
                const pending = i > currentIndex
                const isLast = i === STATUS_ORDER.length - 1
                const historyEntry = history.find(h => h.status === status)
                const dateStr = historyEntry
                  ? historyEntry.createdAt.toLocaleDateString('es-CR', {
                      weekday: 'short', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'

                return (
                  <li
                    key={status}
                    className="grid gap-5 relative"
                    style={{
                      gridTemplateColumns: '44px 1fr auto',
                      paddingBottom: isLast ? 0 : 28,
                    }}
                  >
                    {/* Connector line */}
                    {!isLast && (
                      <div
                        className="absolute w-[2px] rounded-full"
                        style={{
                          left: 21,
                          top: 44,
                          bottom: 0,
                          background: done
                            ? '#10B981'
                            : active
                            ? 'linear-gradient(180deg, #4F46E5, #E5E5E5)'
                            : '#E5E5E5',
                        }}
                      />
                    )}

                    {/* Node circle */}
                    <div
                      className="w-11 h-11 rounded-full grid place-items-center text-white relative z-10"
                      style={{
                        background: done ? '#10B981' : active ? '#4F46E5' : '#fff',
                        border: pending ? '1.5px solid #E5E5E5' : '0',
                        boxShadow: active
                          ? '0 0 0 6px rgba(79,70,229,.12), 0 4px 12px -4px rgba(79,70,229,.4)'
                          : 'none',
                      }}
                    >
                      {done && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {active && (
                        <span className="w-[10px] h-[10px] rounded-full bg-white" />
                      )}
                      {pending && (
                        <span
                          className="font-mono text-[13px] font-semibold"
                          style={{ color: '#A3A3A3' }}
                        >
                          {i + 1}
                        </span>
                      )}
                    </div>

                    {/* Step content */}
                    <div>
                      <div
                        className="text-[16px] font-semibold tracking-[-0.01em] flex items-center gap-[10px]"
                        style={{ color: pending ? '#A3A3A3' : '#0A0A0A' }}
                      >
                        {STATUS_LABELS[status]}
                        {active && (
                          <span className="text-[10.5px] font-semibold text-[#4F46E5] bg-[rgba(79,70,229,.1)] px-[7px] py-[2px] rounded-[5px] tracking-[0.04em]">
                            EN CURSO
                          </span>
                        )}
                      </div>
                      {STEP_SUB[status] && (
                        <div
                          className="text-[13px] mt-[3px]"
                          style={{ color: pending ? '#A3A3A3' : '#525252' }}
                        >
                          {STEP_SUB[status]}
                        </div>
                      )}
                      {(done || active) && (
                        <div className="text-[13px] text-[#737373] mt-2 leading-[1.5] max-w-[480px]">
                          {historyEntry?.note ?? STEP_DETAIL[status]}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div
                      className="font-mono text-[12px] pt-[14px] whitespace-nowrap"
                      style={{ color: pending ? '#D4D4D4' : '#737373' }}
                    >
                      {dateStr}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Secondary actions */}
          <div className="mt-5 flex gap-[10px] flex-wrap">
            <button
              className="px-4 py-[10px] rounded-[10px] border border-[#E5E5E5] bg-white text-[13.5px] font-medium text-[#0A0A0A] cursor-pointer font-sans inline-flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Avisarme por WhatsApp
            </button>
            <button
              className="px-4 py-[10px] rounded-[10px] border border-[#E5E5E5] bg-white text-[13.5px] font-medium text-[#0A0A0A] cursor-pointer font-sans inline-flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Compartir
            </button>
            <button
              className="px-4 py-[10px] rounded-[10px] border border-[#E5E5E5] bg-white text-[13.5px] font-medium text-[#525252] cursor-pointer font-sans ml-auto hover:bg-gray-50 transition-colors"
            >
              ¿Algo está mal?
            </button>
          </div>

          {/* Link package section (only for logged-in users viewing an unlinked package) */}
          {canLink && (
            <div className="mt-6 pt-5 border-t border-[#EDEDED] flex items-center gap-3">
              <p className="text-[13px] text-[#737373]">¿Este es tu paquete?</p>
              <LinkPackageButton trackingNumber={pkg.trackingNumber} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: PASS — all carrier tests + 2 component tests (PublicTopBar, PackageSearchForm, font-smoke)

- [ ] **Step 4: Commit**

```bash
git add src/app/track/[trackingNumber]/page.tsx
git commit -m "feat: redesign track page with new timeline hero, not-found, and pending states"
```

---

## Verification Checklist (manual, dev server)

After all tasks are complete, run `npm run dev` and verify:

- [ ] `/` — Landing: grid bg visible, eyebrow badge with green dot, large headline, search input with JetBrains Mono placeholder, trust strip
- [ ] `/` — Search: type a tracking number and see clear (✕) button appear; click Rastrear or press Enter navigates to `/track/THEVALUE`
- [ ] `/track/EXISTING` — Result: summary card with tracking number in mono, carrier chip, status badge with ping dot, 5-step timeline with green/indigo/gray nodes, progress bar
- [ ] `/track/NOTEXISTING` — Not found: isometric box SVG, tracking number in code element, "Registrar mi paquete" button (links to /request), helper card
- [ ] `/track/PENDINGREQUEST` — Pending: animated concentric circles, "EN REVISIÓN" pill, tracking number in ref card, mini 3-step timeline
- [ ] TopBar: Logo visible on all public pages, "Ingresar" links to /sign-in
- [ ] Admin pages (`/admin/*`) — unchanged, still use existing NavBar layout
