import { STATUS_ORDER, STATUS_LABELS } from '@/lib/status'
import type { PackageStatus } from '@/lib/status'

type HistoryEntry = {
  status: PackageStatus
  note: string | null
  createdAt: Date
}

type Props = {
  currentStatus: PackageStatus
  history: HistoryEntry[]
}

export function StatusTimeline({ currentStatus, history }: Props) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="flex flex-col">
      {STATUS_ORDER.map((status, index) => {
        const entry = history.find(h => h.status === status)
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isPending = index > currentIndex
        const isLast = index === STATUS_ORDER.length - 1

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isDone ? 'bg-indigo-600 text-white' : '',
                  isCurrent ? 'bg-amber-500 text-white' : '',
                  isPending ? 'bg-gray-200 text-gray-400' : '',
                ].join(' ')}
              >
                {isDone ? '✓' : index + 1}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-8 ${isDone ? 'bg-indigo-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
            <div className="pt-1 pb-4">
              <div
                className={`font-semibold text-sm ${
                  isPending ? 'text-gray-400' : isCurrent ? 'text-amber-600' : 'text-gray-800'
                }`}
              >
                {STATUS_LABELS[status]}
              </div>
              {entry && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {entry.createdAt.toLocaleString('es-CR')}
                </div>
              )}
              {entry?.note && (
                <div className="text-xs text-gray-600 italic mt-0.5">{entry.note}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
