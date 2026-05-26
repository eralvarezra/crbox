import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('USPS_CLIENT_ID', 'test-id')
  vi.stubEnv('USPS_CLIENT_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('usps.getStatus', () => {
  it('returns rawStatus from eventSummary', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-usps', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trackSummary: {
            eventSummary: 'DELIVERED',
          },
        }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/usps')
    const result = await getStatus('9400111899223397988041')

    expect(result).toEqual({ rawStatus: 'DELIVERED' })
  })

  it('throws when USPS tracking API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-usps', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 404 })
    )

    const { getStatus } = await import('@/lib/carriers/usps')
    await expect(getStatus('INVALID')).rejects.toThrow('USPS API error: 404')
  })

  it('returns Unknown when eventSummary is missing', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-usps', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trackSummary: {} }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/usps')
    const result = await getStatus('9400111899223397988041')
    expect(result.rawStatus).toBe('Unknown')
  })

  it('throws when USPS OAuth token endpoint returns error', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
    )

    const { getStatus } = await import('@/lib/carriers/usps')
    await expect(getStatus('9400111899223397988041')).rejects.toThrow('USPS auth error: 401')
  })
})
