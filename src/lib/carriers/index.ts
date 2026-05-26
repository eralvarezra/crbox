import type { Carrier, CarrierResult } from './types'
import { getStatus as upsGetStatus } from './ups'
import { getStatus as fedexGetStatus } from './fedex'
import { getStatus as uspsGetStatus } from './usps'
import { getStatus as dhlGetStatus } from './dhl'

export { CARRIER_LABELS } from './types'
export type { Carrier, CarrierResult }

export async function getCarrierStatus(
  carrier: Carrier,
  trackingNumber: string
): Promise<CarrierResult> {
  switch (carrier) {
    case 'ups':   return upsGetStatus(trackingNumber)
    case 'fedex': return fedexGetStatus(trackingNumber)
    case 'usps':  return uspsGetStatus(trackingNumber)
    case 'dhl':   return dhlGetStatus(trackingNumber)
  }
}
