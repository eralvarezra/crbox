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
          <UserButton />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto py-8 px-4">{children}</main>
    </div>
  )
}
