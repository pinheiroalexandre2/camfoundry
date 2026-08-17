import { useEffect, useRef, useState } from 'react'
import type { DebugEntry } from '@shared/types'

interface Props {
  onClose: () => void
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour12: false })
}

export function DebugPanel({ onClose }: Props) {
  const [entries, setEntries] = useState<DebugEntry[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.debugEntries().then(setEntries)
    return window.api.onDebugEntry((entry) => {
      setEntries((prev) => [...prev.slice(-499), entry])
    })
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [entries])

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <span>ONVIF Debug Log</span>
        <div>
          <button className="debug-btn" onClick={() => setEntries([])}>
            Clear
          </button>
          <button className="debug-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      <div className="debug-list" ref={listRef}>
        {entries.length === 0 && <div className="muted">No entries yet.</div>}
        {entries.map((entry, i) => (
          <div key={`${entry.ts}-${i}`} className="debug-row">
            <div
              className={entry.detail ? 'debug-line expandable' : 'debug-line'}
              onClick={() => entry.detail && setExpanded(expanded === i ? null : i)}
            >
              <span className="debug-time">{formatTime(entry.ts)}</span>
              <span className="debug-scope">[{entry.scope}]</span>
              <span>{entry.message}</span>
            </div>
            {expanded === i && entry.detail && <pre className="debug-detail">{entry.detail}</pre>}
          </div>
        ))}
      </div>
    </div>
  )
}
