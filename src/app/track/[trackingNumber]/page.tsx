import { db } from '@/db'
import { packages, packageRequests, statusHistory } from '@/db/schema'
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
  const normalizedTracking = trackingNumber.toUpperCase()

  const pkg = await db.query.packages.findFirst({
    where: eq(packages.trackingNumber, normalizedTracking),
  })

  if (!pkg) {
    const pendingRequest = await db.query.packageRequests.findFirst({
      where: eq(packageRequests.trackingNumber, normalizedTracking),
      columns: { status: true, trackingNumber: true },
    })

    if (pendingRequest?.status === 'pending') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
          <p className="text-5xl mb-4">⏳</p>
          <h1 className="text-xl font-bold mb-2 text-gray-800">Tu solicitud está en revisión</h1>
          <p className="text-gray-500 text-sm mb-2 text-center max-w-sm">
            Recibimos tu tracking{' '}
            <span className="font-mono font-semibold text-gray-700">
              {pendingRequest.trackingNumber}
            </span>{' '}
            y un administrador lo está verificando.
          </p>
          <p className="text-gray-400 text-sm mb-8 text-center max-w-sm">
            Te notificaremos por WhatsApp en cuanto esté registrado en el sistema.
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

    notFound()
  }

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
