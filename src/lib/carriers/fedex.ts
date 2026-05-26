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
  const clientId = process.env.FEDEX_CLIENT_ID
  const clientSecret = process.env.FEDEX_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Missing FedEx credentials: set FEDEX_CLIENT_ID and FEDEX_CLIENT_SECRET')
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const res = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`FedEx auth error: ${res.status}`)
  const data = await res.json()
  if (!data.access_token || typeof data.expires_in !== 'number') {
    throw new Error('Invalid FedEx token response: missing access_token or expires_in')
  }
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return tokenCache.value
}

export async function getStatus(trackingNumber: string): Promise<CarrierResult> {
  const token = await getToken()
  const res = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-locale': 'en_US',
    },
    body: JSON.stringify({
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      includeDetailedScans: false,
    }),
  })
  if (!res.ok) throw new Error(`FedEx API error: ${res.status}`)
  const data = await res.json()
  const description =
    data.output?.completeTrackResults?.[0]?.trackResults?.[0]?.latestStatusDetail?.description
  return { rawStatus: description ?? 'Unknown' }
}
