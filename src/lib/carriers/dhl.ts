import type { CarrierResult } from './types'

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const apiKey = process.env.DHL_API_KEY
  if (!apiKey) {
    throw new Error('Missing DHL credentials: set DHL_API_KEY')
  }

  const res = await fetch(
    `https://api.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
    {
      headers: {
        'DHL-API-Key': apiKey,
        Accept: 'application/json',
      },
    }
  )

  if (!res.ok) throw new Error(`DHL API error: ${res.status}`)

  const data = await res.json()
  const event = data.shipments?.[0]?.events?.[0]
  return { rawStatus: event?.description ?? 'Unknown' }
}
