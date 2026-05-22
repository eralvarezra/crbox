'use client'

import { linkPackageToUser } from '@/lib/actions/packages'
import { useState } from 'react'

export function LinkPackageButton({ trackingNumber }: { trackingNumber: string }) {
  const [linked, setLinked] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLink() {
    setLoading(true)
    await linkPackageToUser(trackingNumber)
    setLinked(true)
    setLoading(false)
  }

  if (linked) {
    return (
      <p className="text-sm text-green-600 font-medium">
        ✓ Paquete vinculado a tu cuenta
      </p>
    )
  }

  return (
    <button
      onClick={handleLink}
      disabled={loading}
      className="text-sm text-indigo-600 border border-indigo-200 rounded-lg px-4 py-2 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Vinculando...' : 'Vincular a mi cuenta'}
    </button>
  )
}
