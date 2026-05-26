export type Carrier = 'ups' | 'fedex' | 'usps' | 'dhl'

export interface CarrierResult {
  rawStatus: string
  details?: string
}

export const CARRIER_LABELS: Record<Carrier, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  usps: 'USPS',
  dhl: 'DHL',
}
