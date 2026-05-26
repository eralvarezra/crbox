export interface TrackResult {
  rawStatus: string
  detectedCarrier?: string
}

export async function registerTracking(trackingNumber: string): Promise<void> {
  const apiKey = process.env.SEVENTEEN_TRACK_API_KEY
  if (!apiKey) throw new Error('Missing SEVENTEEN_TRACK_API_KEY')

  const res = await fetch('https://api.17track.net/track/v2/register', {
    method: 'POST',
    headers: {
      '17token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ number: trackingNumber }]),
  })
  if (!res.ok) throw new Error(`17track register error: ${res.status}`)
  const data = await res.json()
  if (data.data?.rejected?.length > 0) {
    throw new Error(`17track rejected tracking number: ${trackingNumber}`)
  }
}

export async function getTrackingStatus(trackingNumber: string): Promise<TrackResult> {
  const apiKey = process.env.SEVENTEEN_TRACK_API_KEY
  if (!apiKey) throw new Error('Missing SEVENTEEN_TRACK_API_KEY')

  const res = await fetch('https://api.17track.net/track/v2/gettrackinfo', {
    method: 'POST',
    headers: {
      '17token': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ number: trackingNumber }]),
  })
  if (!res.ok) throw new Error(`17track gettrackinfo error: ${res.status}`)
  const data = await res.json()

  const accepted = data.data?.accepted?.[0]
  if (!accepted) {
    const rejected = data.data?.rejected?.[0]
    const reason = rejected?.error?.message ? ` — ${rejected.error.message}` : ''
    throw new Error(`17track rejected tracking number: ${trackingNumber}${reason}`)
  }

  const track = accepted.track
  const rawStatus: string = track?.z0?.z ?? 'Unknown'
  const detectedCarrier: string | undefined = track?.w1 ?? undefined

  return { rawStatus, detectedCarrier }
}
