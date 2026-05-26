import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerTracking, getTrackingStatus } from './track17'

const MOCK_API_KEY = 'test-api-key'

beforeEach(() => {
  process.env.SEVENTEEN_TRACK_API_KEY = MOCK_API_KEY
})

afterEach(() => {
  delete process.env.SEVENTEEN_TRACK_API_KEY
  vi.unstubAllGlobals()
})

describe('registerTracking', () => {
  it('calls register endpoint with correct payload and headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 0, data: { accepted: [{ number: '1Z123' }], rejected: [] } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await registerTracking('1Z123')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.17track.net/track/v2/register',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ '17token': MOCK_API_KEY }),
        body: JSON.stringify([{ number: '1Z123' }]),
      })
    )
  })

  it('throws when tracking number is rejected by 17track', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 0, data: { accepted: [], rejected: [{ number: '1Z123' }] } }),
    }))

    await expect(registerTracking('1Z123')).rejects.toThrow(
      '17track rejected tracking number: 1Z123'
    )
  })

  it('throws when API key is missing', async () => {
    delete process.env.SEVENTEEN_TRACK_API_KEY

    await expect(registerTracking('1Z123')).rejects.toThrow('Missing SEVENTEEN_TRACK_API_KEY')
  })
})

describe('getTrackingStatus', () => {
  it('returns rawStatus and detectedCarrier from accepted response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        code: 0,
        data: {
          accepted: [{
            number: '1Z123',
            track: {
              z0: { z: 'Delivered', a: 'San Jose, CR', d: '2024-01-01T12:00:00' },
              w1: 'UPS',
            },
          }],
          rejected: [],
        },
      }),
    }))

    const result = await getTrackingStatus('1Z123')

    expect(result.rawStatus).toBe('Delivered')
    expect(result.detectedCarrier).toBe('UPS')
  })

  it('returns "Unknown" rawStatus when no events yet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        code: 0,
        data: {
          accepted: [{ number: '1Z123', track: {} }],
          rejected: [],
        },
      }),
    }))

    const result = await getTrackingStatus('1Z123')
    expect(result.rawStatus).toBe('Unknown')
    expect(result.detectedCarrier).toBeUndefined()
  })

  it('throws with error reason when tracking is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        code: 0,
        data: {
          accepted: [],
          rejected: [{ number: '1Z123', error: { message: 'Invalid tracking number' } }],
        },
      }),
    }))

    await expect(getTrackingStatus('1Z123')).rejects.toThrow(
      '17track rejected tracking number: 1Z123 — Invalid tracking number'
    )
  })
})
