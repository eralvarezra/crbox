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
        <UserButton />
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
