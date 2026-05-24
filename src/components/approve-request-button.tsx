'use client'

import { useState } from 'react'

export function ApproveRequestButton({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        Aprobar solicitud
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <p className="text-sm font-medium text-green-800 text-center">
        ¿Confirmar aprobación?
      </p>
      <p className="text-xs text-green-700 text-center">
        Se creará el paquete y se notificará al cliente por WhatsApp.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex-1 border border-gray-300 bg-white text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <form action={action} className="flex-1">
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Sí, aprobar
          </button>
        </form>
      </div>
    </div>
  )
}
