# CRBox — Package Tracking App

Web app for tracking packages shipped from the US to Costa Rica. Customers can look up their tracking number publicly or link packages to their account. Admins manage packages and trigger WhatsApp notifications on status changes.

## Tech Stack

- **Framework:** Next.js 15 App Router + Turbopack
- **Auth:** Clerk v7
- **Database:** Neon PostgreSQL + Drizzle ORM (neon-http driver)
- **Notifications:** Twilio WhatsApp Business API (sandbox)
- **Styling:** Tailwind CSS
- **Tests:** Vitest + React Testing Library

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run db:push      # Push schema changes to Neon (no migrations)
npm run db:studio    # Open Drizzle Studio (DB GUI)
npm test             # Run Vitest tests
```

## Project Structure

```
src/
  app/
    page.tsx                      # Public home — tracking search form
    dashboard/page.tsx            # Authenticated user — their linked packages
    track/[trackingNumber]/       # Public package status page
    admin/                        # Admin-only (requires role: "admin")
      page.tsx                    # Package list
      packages/new/page.tsx       # Create package form
      packages/[id]/page.tsx      # Edit package / update status
    sign-in/ sign-up/             # Clerk hosted UI pages
  components/
    nav-bar.tsx                   # MUST be 'use client' — uses Clerk hooks
    package-search-form.tsx       # 'use client' — search input
    link-package-button.tsx       # 'use client' — links package to user account
    status-timeline.tsx           # Vertical stepper showing status history
    status-badge.tsx              # Color-coded status pill
  db/
    schema.ts                     # Drizzle schema (packages + statusHistory tables)
    index.ts                      # Neon DB connection with relational schema
  lib/
    status.ts                     # PackageStatus type, STATUS_ORDER, labels, badge config
    whatsapp.ts                   # Twilio WhatsApp helper
    actions/packages.ts           # Server Actions: createPackage, updatePackageStatus, linkPackageToUser
  middleware.ts                   # Clerk route protection
```

## Package Statuses (in order)

```
received_usa → in_transit → in_customs → ready_pickup → delivered
```

Defined in `src/lib/status.ts`. Always use `STATUS_ORDER` array — do not hardcode status strings.

## Auth & Roles

Clerk v7 is used. Key patterns:

- **Server Components:** `import { auth } from '@clerk/nextjs/server'` → `await auth()`
- **Client Components:** `import { useUser } from '@clerk/nextjs'` → `useUser()`
- **UI components** (`UserButton`, `SignInButton`) must be in `'use client'` components — they do NOT work in RSC
- **Admin role** is set via Clerk Dashboard → Users → Public metadata: `{ "role": "admin" }`
- **Session token** must be customized in Clerk Dashboard → Configure → Sessions: `{ "metadata": "{{user.public_metadata}}" }`
- **Middleware** is at `src/middleware.ts` (must be in `src/`, not root)

## Database

- Schema changes: edit `src/db/schema.ts` then run `npm run db:push`
- No migration files — Drizzle pushes schema directly to Neon
- Relational queries use `db.query.packages.findFirst(...)` pattern
- `drizzle.config.ts` loads `.env.local` via dotenv — required for CLI commands

## Server Actions

All in `src/lib/actions/packages.ts`. Rules:
- Always call `requireAdmin()` for admin actions
- Validate status values against `STATUS_ORDER` before writing
- `linkPackageToUser` checks ownership before linking (can't overwrite another user's package)
- WhatsApp notification failures are caught and logged — they never block the main action

## Environment Variables

Never commit `.env.local`. The other developer needs these variables (share securely, not via chat):

```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=+14155238886
UPS_CLIENT_ID=
UPS_CLIENT_SECRET=
FEDEX_CLIENT_ID=
FEDEX_CLIENT_SECRET=
USPS_CLIENT_ID=
USPS_CLIENT_SECRET=
DHL_API_KEY=
CRON_SECRET=
```

## Common Gotchas

- Clerk v7 removed `SignedIn`/`SignedOut` components — use `useUser()` hook with conditional rendering instead
- Clerk v7 removed `afterSignOutUrl` prop from `UserButton` — just use `<UserButton />`
- Next.js 15 route params are a Promise: `const { id } = await params` (not `params.id` directly)
- `db.query.*` requires the schema to be passed to `drizzle()` — already done in `src/db/index.ts`
