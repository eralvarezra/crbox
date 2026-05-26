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
  const clientId = process.env.USPS_CLIENT_ID
  const clientSecret = process.env.USPS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Missing USPS credentials: set USPS_CLIENT_ID and USPS_CLIENT_SECRET')
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const res = await fetch('https://apis.usps.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`USPS auth error: ${res.status}`)
  const data = await res.json()
  if (!data.access_token || typeof data.expires_in !== 'number') {
    throw new Error('Invalid USPS token response: missing access_token or expires_in')
  }
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return tokenCache.value
}

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const token = await getToken()
  const res = await fetch(
    `https://apis.usps.com/tracking/v3/tracking/${trackingNumber}?expand=SUMMARY`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  )
  if (!res.ok) throw new Error(`USPS API error: ${res.status}`)
  const data = await res.json()
  const rawStatus = data.trackSummary?.eventSummary ?? 'Unknown'
  return { rawStatus }
}
