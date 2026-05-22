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
