export type PackageStatus =
  | 'received_usa'
  | 'in_transit'
  | 'in_customs'
  | 'ready_pickup'
  | 'delivered'

export const STATUS_ORDER: PackageStatus[] = [
  'received_usa',
  'in_transit',
  'in_customs',
  'ready_pickup',
  'delivered',
]

export const STATUS_LABELS: Record<PackageStatus, string> = {
  received_usa: 'Recibido en bodega USA',
  in_transit: 'En tránsito',
  in_customs: 'En aduana CR',
  ready_pickup: 'Listo para retirar',
  delivered: 'Entregado',
}

export const STATUS_BADGE_CONFIG: Record<PackageStatus, { className: string }> = {
  received_usa: { className: 'bg-gray-100 text-gray-700' },
  in_transit: { className: 'bg-blue-100 text-blue-700' },
  in_customs: { className: 'bg-amber-100 text-amber-700' },
  ready_pickup: { className: 'bg-green-100 text-green-700' },
  delivered: { className: 'bg-gray-100 text-gray-500' },
}
