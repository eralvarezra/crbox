import { db } from '@/db'
import { packageRequests } from '@/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
} as const

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const

const FILTER_OPTIONS: [string, string][] = [
  ['', 'Todas'],
  ['pending', 'Pendientes'],
  ['approved', 'Aprobadas'],
  ['rejected', 'Rechazadas'],
]

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const allRequests = await db
    .select()
    .from(packageRequests)
    .orderBy(desc(packageRequests.createdAt))

  const validStatus = ['pending', 'approved', 'rejected']
  const filtered =
    status && validStatus.includes(status)
      ? allRequests.filter(r => r.status === status)
      : allRequests

  return (
    <>
      <h1 className="text-xl font-bold mb-6">Solicitudes</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map(([val, label]) => (
          <Link
            key={val}
            href={val ? `/admin/requests?status=${val}` : '/admin/requests'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              (status ?? '') === val
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-10 text-center">No hay solicitudes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-xs uppercase text-gray-500 tracking-wide">
                <th className="px-4 py-3 text-left">Tracking</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">
                    <Link
                      href={`/admin/requests/${req.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {req.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{req.customerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://wa.me/${req.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline text-sm"
                    >
                      {req.whatsappNumber}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {req.createdAt.toLocaleDateString('es-CR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}
                    >
                      {STATUS_LABELS[req.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
