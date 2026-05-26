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
      className="bg-white border border-[#E5E5E5] rounded-[14px] px-7 py-7 space-y-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)' }}
    >
      {isLoggedIn && userName && (
        <div className="flex items-center gap-2 bg-[rgba(79,70,229,.06)] border border-[rgba(79,70,229,.15)] rounded-[8px] px-4 py-2.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
            <circle cx="7" cy="7" r="6.5" stroke="#4F46E5" />
            <path d="M7 6v4M7 4.5v.5" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-[13px] text-[#4338CA]">
            Enviando como <strong className="font-semibold">{userName}</strong>
          </span>
        </div>
      )}

      {!isLoggedIn && (
        <div>
          <label className="block text-[11px] font-medium text-[#A3A3A3] uppercase tracking-[0.06em] mb-1.5">
            Nombre completo *
          </label>
          <input
            name="customerName"
            required
            className="w-full border border-[#E5E5E5] rounded-[8px] px-3 py-2.5 text-[13.5px] text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
            placeholder="Juan Pérez"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] font-medium text-[#A3A3A3] uppercase tracking-[0.06em] mb-1.5">
          WhatsApp *
        </label>
        <PhoneInput />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#A3A3A3] uppercase tracking-[0.06em] mb-1.5">
          Tracking Number *
        </label>
        <input
          name="trackingNumber"
          required
          className="w-full border border-[#E5E5E5] rounded-[8px] px-3 py-2.5 text-[13.5px] font-mono text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
          placeholder="1Z999AA10123456784"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#A3A3A3] uppercase tracking-[0.06em] mb-1.5">
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
          className="w-full border border-[#E5E5E5] rounded-[8px] px-3 py-2.5 text-[13px] text-[#525252] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition file:mr-3 file:border-0 file:bg-[rgba(79,70,229,.07)] file:text-[#4F46E5] file:px-3 file:py-1 file:rounded-[5px] file:text-[12px] file:font-medium cursor-pointer"
        />
        {preview && (
          <img
            src={preview}
            alt="Vista previa"
            className="mt-3 rounded-[8px] max-h-40 object-contain border border-[#E5E5E5] w-full"
          />
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-[#4F46E5] text-white py-2.5 rounded-[8px] text-[13.5px] font-medium hover:bg-[#4338CA] active:bg-[#3730A3] transition-colors mt-1"
      >
        Enviar solicitud
      </button>
    </form>
  )
}
