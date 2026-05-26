import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Must reset the module between tests to clear the in-memory token cache
beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('UPS_CLIENT_ID', 'test-id')
  vi.stubEnv('UPS_CLIENT_SECRET', 'test-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('ups.getStatus', () => {
  it('returns rawStatus from the most recent activity', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trackResponse: {
            shipment: [{
              package: [{
                activity: [{ status: { description: 'In Transit' } }],
              }],
            }],
          },
        }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/ups')
    const result = await getStatus('1Z999AA10123456784')

    expect(result).toEqual({ rawStatus: 'In Transit' })
  })

  it('throws when UPS tracking API returns non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 404 })
    )

    const { getStatus } = await import('@/lib/carriers/ups')
    await expect(getStatus('INVALID')).rejects.toThrow('UPS API error: 404')
  })

  it('returns Unknown when activity is missing', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trackResponse: { shipment: [] } }),
      })
    )

    const { getStatus } = await import('@/lib/carriers/ups')
    const result = await getStatus('1Z999AA10123456784')
    expect(result.rawStatus).toBe('Unknown')
  })

  it('throws when UPS OAuth token endpoint returns error', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
    )

    const { getStatus } = await import('@/lib/carriers/ups')
    await expect(getStatus('1Z999AA10123456784')).rejects.toThrow('UPS auth error: 401')
  })
})
