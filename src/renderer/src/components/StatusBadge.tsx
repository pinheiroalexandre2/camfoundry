import type { StreamStatus } from '@shared/types'

const LABELS: Record<StreamStatus, string> = {
  idle: 'Idle',
  connecting: 'Connecting…',
  live: 'Live',
  error: 'Error'
}

export function StatusBadge({ status }: { status: StreamStatus }) {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>
}
