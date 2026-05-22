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
