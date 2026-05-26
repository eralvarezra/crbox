import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { packages } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/status-badge'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { PublicTopBar } from '@/components/public-topbar'
import type React from 'react'

const GRID_BG_STYLE: React.CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 50% 0%, rgba(79,70,229,0.06), transparent 50%),
    linear-gradient(#F4F4F4 1px, transparent 1px),
    linear-gradient(90deg, #F4F4F4 1px, transparent 1px)
  `,
  backgroundSize: '100% 100%, 56px 56px, 56px 56px',
  maskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
  WebkitMaskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 80%)',
}

export default async function DashboardPage() {
  const { userId } = await auth()

  const myPackages = await db
    .select()
    .from(packages)
    .where(eq(packages.clerkUserId, userId!))
    .orderBy(desc(packages.updatedAt))

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicTopBar rightSlot={<UserButton />} />
      <div className="flex-1 relative px-10 py-12 overflow-auto">
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={GRID_BG_STYLE} />
        <div className="relative z-10 max-w-[880px] mx-auto">
          <div className="text-[11.5px] font-semibold text-[#737373] uppercase tracking-[0.12em]">
            Mis paquetes
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#0A0A0A] mt-[6px] mb-8">
            {myPackages.length} {myPackages.length === 1 ? 'paquete' : 'paquetes'}
          </h1>

          {myPackages.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16">
              <p className="text-[15px] text-[#737373] leading-[1.55] mb-6">
                No tenés paquetes vinculados todavía.
              </p>
              <div className="flex items-center gap-[10px]">
                <Link
                  href="/request"
                  className="h-[44px] px-5 rounded-[10px] bg-[#4F46E5] text-white font-semibold text-[14px] flex items-center gap-2 border-0 hover:bg-[#4338CA] transition-colors"
                  style={{ boxShadow: '0 1px 0 rgba(255,255,255,.15) inset, 0 4px 14px -4px rgba(79,70,229,.5)' }}
                >
                  Registrar mi paquete →
                </Link>
                <Link
                  href="/"
                  className="text-[13px] text-[#4F46E5] font-medium hover:underline"
                >
                  Buscar un tracking →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myPackages.map(pkg => (
                <Link
                  key={pkg.id}
                  href={`/track/${pkg.trackingNumber}`}
                  className="flex items-center justify-between bg-white border border-[#EDEDED] rounded-2xl px-6 py-5 hover:border-[#D4D4D4] transition-colors"
                >
                  <div>
                    <div className="font-mono text-[16px] font-semibold text-[#0A0A0A]">
                      {pkg.trackingNumber}
                    </div>
                    {pkg.description && (
                      <div className="text-[13px] text-[#525252] mt-[3px]">
                        {pkg.description}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={pkg.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
