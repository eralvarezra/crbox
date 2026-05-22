'use client'

import { useState } from 'react'
import { submitPackageRequest } from '@/lib/actions/requests'
import PhoneInput from '@/components/phone-input'

export default function RequestForm({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean
  userName: string | null
}) {
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <form
      action={submitPackageRequest}
      className="bg-white rounded-xl shadow-sm p-6 space-y-5"
    >
      {isLoggedIn && userName && (
        <div className="bg-indigo-50 rounded-lg px-4 py-2 text-sm text-indigo-700">
          Enviando como <strong>{userName}</strong>
        </div>
      )}

      {!isLoggedIn && (
        <div>
          <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
            Nombre completo *
          </label>
          <input
            name="customerName"
            required
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Juan Pérez"
          />
        </div>
      )}

      <div>
        <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
          WhatsApp *
        </label>
        <PhoneInput />
      </div>

      <div>
        <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
          Tracking Number *
        </label>
        <input
          name="trackingNumber"
          required
          className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="1Z999AA10123456784"
        />
      </div>

      <div>
        <label className="text-xs uppercase text-gray-500 tracking-wide block mb-1.5">
          Factura (imagen o PDF) *
        </label>
        <input
          name="invoice"
          type="file"
          accept="image/*,.pdf"
          required
          onChange={e => {
            const file = e.target.files?.[0]
            if (file && file.type.startsWith('image/')) {
              setPreview(URL.createObjectURL(file))
            } else {
              setPreview(null)
            }
          }}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 file:mr-3 file:border-0 file:bg-indigo-50 file:text-indigo-700 file:px-3 file:py-1 file:rounded file:text-xs"
        />
        {preview && (
          <img
            src={preview}
            alt="Vista previa"
            className="mt-2 rounded-lg max-h-40 object-contain border"
          />
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Enviar solicitud
      </button>
    </form>
  )
}
