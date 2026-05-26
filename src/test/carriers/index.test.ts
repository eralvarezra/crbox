import { vi, describe, it, expect } from 'vitest'

vi.mock('@/lib/carriers/ups', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'UPS status' }),
}))
vi.mock('@/lib/carriers/fedex', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'FedEx status' }),
}))
vi.mock('@/lib/carriers/usps', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'USPS status' }),
}))
vi.mock('@/lib/carriers/dhl', () => ({
  getStatus: vi.fn().mockResolvedValue({ rawStatus: 'DHL status' }),
}))

describe('getCarrierStatus dispatcher', () => {
  it('dispatches to UPS module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('ups', '1Z999AA10123456784')
    expect(result).toEqual({ rawStatus: 'UPS status' })
  })

  it('dispatches to FedEx module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('fedex', '774899172137')
    expect(result).toEqual({ rawStatus: 'FedEx status' })
  })

  it('dispatches to USPS module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('usps', '9400111899223397988041')
    expect(result).toEqual({ rawStatus: 'USPS status' })
  })

  it('dispatches to DHL module', async () => {
    const { getCarrierStatus } = await import('@/lib/carriers/index')
    const result = await getCarrierStatus('dhl', '1234567890')
    expect(result).toEqual({ rawStatus: 'DHL status' })
  })
})
