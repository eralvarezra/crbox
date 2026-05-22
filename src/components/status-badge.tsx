import { STATUS_LABELS, STATUS_BADGE_CONFIG } from '@/lib/status'
import type { PackageStatus } from '@/lib/status'

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as PackageStatus] ?? status
  const config = STATUS_BADGE_CONFIG[status as PackageStatus] ?? { className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.className}`}>
      {label}
    </span>
  )
}
