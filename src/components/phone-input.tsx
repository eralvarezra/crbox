'use client'

import { useState } from 'react'

const COUNTRY_CODES = [
  { code: '+506', flag: '🇨🇷', label: 'CR' },
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+52',  flag: '🇲🇽', label: 'MX' },
  { code: '+57',  flag: '🇨🇴', label: 'CO' },
  { code: '+58',  flag: '🇻🇪', label: 'VE' },
  { code: '+51',  flag: '🇵🇪', label: 'PE' },
  { code: '+503', flag: '🇸🇻', label: 'SV' },
  { code: '+502', flag: '🇬🇹', label: 'GT' },
  { code: '+504', flag: '🇭🇳', label: 'HN' },
  { code: '+505', flag: '🇳🇮', label: 'NI' },
  { code: '+507', flag: '🇵🇦', label: 'PA' },
  { code: '+34',  flag: '🇪🇸', label: 'ES' },
]

export default function PhoneInput() {
  const [countryCode, setCountryCode] = useState('+506')
  const [localNumber, setLocalNumber] = useState('')

  const fullNumber = localNumber.trim() ? `${countryCode}${localNumber.trim()}` : ''

  return (
    <div className="flex gap-2">
      <select
        value={countryCode}
        onChange={e => setCountryCode(e.target.value)}
        className="border rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      >
        {COUNTRY_CODES.map(c => (
          <option key={c.code + c.label} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={localNumber}
        onChange={e => setLocalNumber(e.target.value.replace(/\D/g, ''))}
        className="flex-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="88888888"
      />
      <input type="hidden" name="whatsappNumber" value={fullNumber} />
    </div>
  )
}
