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
