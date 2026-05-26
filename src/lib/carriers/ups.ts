import type { CarrierResult } from './types'

interface TokenCache {
  value: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.value
  }
  const credentials = Buffer.from(
    `${process.env.UPS_CLIENT_ID}:${process.env.UPS_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`UPS auth error: ${res.status}`)
  const data = await res.json()
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return tokenCache.value
}

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const token = await getToken()
  const res = await fetch(
    `https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        transId: crypto.randomUUID(),
        transactionSrc: 'CRBox',
      },
    }
  )
  if (!res.ok) throw new Error(`UPS API error: ${res.status}`)
  const data = await res.json()
  const activity = data.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.[0]
  const rawStatus = activity?.status?.description ?? 'Unknown'
  return { rawStatus }
}
