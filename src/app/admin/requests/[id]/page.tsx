import { db } from '@/db'
import { packageRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { approveRequest, rejectRequest } from '@/lib/actions/requests'

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

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ whatsapp_error?: string; duplicate?: string }>
}) {
  const { id } = await params
  const { whatsapp_error, duplicate } = await searchParams

  const request = await db.query.packageRequests.findFirst({
    where: eq(packageRequests.id, id),
  })
  if (!request) notFound()

  const approveWithId = approveRequest.bind(null, request.id)
  const rejectWithId = rejectRequest.bind(null, request.id)

  const isPdf =
    request.invoiceUrl.toLowerCase().includes('.pdf') ||
    request.invoiceUrl.toLowerCase().includes('pdf')

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/requests" className="text-sm text-gray-500 hover:text-gray-700">
          ← Solicitudes
        </Link>
      </div>

      {whatsapp_error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
          Acción completada, pero la notificación por WhatsApp no se pudo enviar. Verifica que el número haya enviado un mensaje al sandbox de Twilio en las últimas 24 horas.
        </div>
      )}

      {duplicate && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-800">
          El tracking number <strong>{request.trackingNumber}</strong> ya existe en el sistema. Rechaza esta solicitud o elimina el paquete duplicado.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h1 className="text-lg font-bold">Solicitud</h1>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Estado</div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[request.status]}`}
            >
              {STATUS_LABELS[request.status]}
            </span>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Tracking Number</div>
            <p className="font-mono text-sm">{request.trackingNumber}</p>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Cliente</div>
            <p className="text-sm">{request.customerName ?? '—'}</p>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">WhatsApp</div>
            <p className="text-sm">{request.whatsappNumber}</p>
          </div>

          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Fecha</div>
            <p className="text-sm text-gray-500">
              {request.createdAt.toLocaleDateString('es-CR')}
            </p>
          </div>

          {request.rejectionReason && (
            <div>
              <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">
                Motivo de rechazo
              </div>
              <p className="text-sm text-red-600">{request.rejectionReason}</p>
            </div>
          )}

          {request.status === 'pending' && (
            <div className="pt-2 space-y-3 border-t">
              <form action={approveWithId}>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Aprobar solicitud
                </button>
              </form>

              <form action={rejectWithId} className="space-y-2">
                <input
                  name="reason"
                  required
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Motivo del rechazo..."
                />
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Rechazar solicitud
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Factura</h2>
          {isPdf ? (
            <a
              href={request.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-8 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Ver PDF de factura
            </a>
          ) : (
            <a href={request.invoiceUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={request.invoiceUrl}
                alt="Factura"
                className="rounded-lg border max-w-full hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </a>
          )}
          <p className="text-xs text-gray-400 mt-2 text-center">Clic para ver completa</p>
        </div>
      </div>
    </>
  )
}
