import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('FEDEX_CLIENT_ID', 'test-id')
  vi.stubEnv('FEDEX_CLIENT_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fedex.getStatus', () => {
  it('returns rawStatus from latestStatusDetail', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-fedex', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output: {
            completeTrackResults: [{
              trackResults: [{
                latestStatusDetail: { description: 'Shipment picked up' },
              }],
            }],
          },
        }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/fedex')
    const result = await getStatus('774899172137')

    expect(result).toEqual({ rawStatus: 'Shipment picked up' })
  })

  it('throws when FedEx tracking API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-fedex', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400 })
    )

    const { getStatus } = await import('@/lib/carriers/fedex')
    await expect(getStatus('INVALID')).rejects.toThrow('FedEx API error: 400')
  })

  it('returns Unknown when trackResults is empty', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-fedex', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ output: { completeTrackResults: [] } }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/fedex')
    const result = await getStatus('774899172137')
    expect(result.rawStatus).toBe('Unknown')
  })

  it('throws when FedEx OAuth token endpoint returns error', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
    )

    const { getStatus } = await import('@/lib/carriers/fedex')
    await expect(getStatus('774899172137')).rejects.toThrow('FedEx auth error: 401')
  })
})
