import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('DHL_API_KEY', 'test-dhl-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('dhl.getStatus', () => {
  it('returns rawStatus from the most recent shipment event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        shipments: [{
          events: [
            { description: 'Delivered - Signed for by: SMITH' },
            { description: 'In transit' },
          ],
        }],
      }),
    }))

    const { getStatus } = await import('@/lib/carriers/dhl')
    const result = await getStatus('1234567890')

    expect(result).toEqual({ rawStatus: 'Delivered - Signed for by: SMITH' })
  })

  it('throws when DHL API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 404 }))

    const { getStatus } = await import('@/lib/carriers/dhl')
    await expect(getStatus('INVALID')).rejects.toThrow('DHL API error: 404')
  })

  it('returns Unknown when shipments array is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shipments: [] }),
    }))

    const { getStatus } = await import('@/lib/carriers/dhl')
    const result = await getStatus('1234567890')
    expect(result.rawStatus).toBe('Unknown')
  })

  it('throws when DHL_API_KEY env var is missing', async () => {
    vi.unstubAllEnvs()

    const { getStatus } = await import('@/lib/carriers/dhl')
    await expect(getStatus('1234567890')).rejects.toThrow('Missing DHL credentials: set DHL_API_KEY')
  })
})
