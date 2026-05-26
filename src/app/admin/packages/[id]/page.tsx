import { db } from '@/db'
import { packages, statusHistory } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { updatePackageStatus, syncPackageTracking } from '@/lib/actions/packages'
import { StatusBadge } from '@/components/status-badge'
import { CARRIER_LABELS } from '@/lib/carriers'
import type { Carrier } from '@/lib/carriers'

export default async function EditPackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ whatsapp_error?: string }>
}) {
  const { id } = await params
  const { whatsapp_error } = await searchParams

  const pkg = await db.query.packages.findFirst({
    where: eq(packages.id, id),
  })

  if (!pkg) notFound()

  const recentHistory = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.packageId, pkg.id))
    .orderBy(desc(statusHistory.createdAt))
    .limit(5)

  const updateWithId = updatePackageStatus.bind(null, pkg.id)
  const syncWithId = syncPackageTracking.bind(null, pkg.id)

  return (
    <>
      {whatsapp_error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
          Estado actualizado correctamente, pero la notificación por WhatsApp no se pudo enviar. Asegúrate de que el número haya enviado un mensaje al sandbox de Twilio en las últimas 24 horas.
        </div>
      )}
      <h1 className="text-xl font-bold mb-1">Editar paquete</h1>
      <p className="font-mono text-sm text-gray-500 mb-6">{pkg.trackingNumber}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form action={updateWithId} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Cliente</div>
            <p className="font-medium text-sm">{pkg.customerName}</p>
          </div>
          <div>
            <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Estado actual</div>
            <StatusBadge status={pkg.status} />
          </div>
          {pkg.whatsappNumber && (
            <div>
              <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">WhatsApp</div>
              <a
                href={`https://wa.me/${pkg.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline"
              >
                {pkg.whatsappNumber}
              </a>
            </div>
          )}
          <div>
            <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">Nuevo estado *</label>
            <select name="status" defaultValue={pkg.status} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="received_usa">Recibido en bodega USA</option>
              <option value="in_transit">En tránsito</option>
              <option value="in_customs">En aduana CR</option>
              <option value="ready_pickup">Listo para retirar</option>
              <option value="delivered">Entregado</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">Nota (opcional)</label>
            <input name="note" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Ej: Retenido en aduana, requiere documentos" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            {pkg.whatsappNumber ? '💬 Guardar y notificar por WhatsApp' : 'Guardar cambios'}
          </button>
        </form>
        {pkg.carrier && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3 md:col-span-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Tracking del carrier
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                {CARRIER_LABELS[pkg.carrier as Carrier]}
              </span>
              <span className="text-gray-700">
                {pkg.carrierRawStatus
                  ? pkg.carrierRawStatus
                  : <span className="text-gray-400 italic">Sin datos</span>}
              </span>
            </div>
            {pkg.carrierLastSynced && (
              <p className="text-xs text-gray-400">
                Última sync: {pkg.carrierLastSynced.toLocaleString('es-CR')}
              </p>
            )}
            <form action={syncWithId}>
              <button
                type="submit"
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sincronizar
              </button>
            </form>
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Historial reciente</h2>
          <div className="space-y-2">
            {recentHistory.length === 0 && (
              <p className="text-xs text-gray-400">Sin historial.</p>
            )}
            {recentHistory.map(entry => (
              <div key={entry.id} className="bg-white rounded-lg shadow-sm px-4 py-3 text-xs">
                <div className="flex justify-between items-center mb-0.5">
                  <StatusBadge status={entry.status} />
                  <span className="text-gray-400">{entry.createdAt.toLocaleDateString('es-CR')}</span>
                </div>
                {entry.note && <p className="text-gray-500 italic mt-1">{entry.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
