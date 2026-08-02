'use client'

// The dossier's "cache unless you ask" control: shows how old the snapshot
// is and lets a visitor force one live re-fetch. Posts to
// app/atlas/api/refresh/[iso3]/route.ts, which streams newline-delimited
// progress events (one per source as it resolves) rather than one silent
// wait — a full country refresh still takes many seconds, since it is the
// exact same ~11 live calls getDossier() otherwise never makes.
//
// After the stream finishes, router.refresh() re-requests this Server
// Component route so the visitor who clicked sees the same fresh data the
// route handler already wrote to the snapshot file (revalidatePath already
// invalidated the cached page render) — the button reflects both the
// stream's own payload and the page's own re-render, not just one of them.
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './dossier.module.css'

const SOURCE_LABELS: Record<string, string> = {
  worldBank: 'World Bank',
  timeSeries: 'World Bank history',
  wikidata: 'Wikidata',
  wikipedia: 'Wikipedia',
  trade: 'UN Comtrade',
  famousPeople: 'Famous people',
  weather: 'Weather',
  fx: 'Exchange rate',
}

function formatCapturedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

type Status = 'idle' | 'running' | 'done' | 'error'

export function RefreshButton({ iso3, capturedAt }: { iso3: string; capturedAt: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [log, setLog] = useState<{ source: string; ok: boolean }[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [asOf, setAsOf] = useState(capturedAt)

  async function refresh() {
    setStatus('running')
    setLog([])
    setMessage(null)

    try {
      const res = await fetch(`/atlas/api/refresh/${iso3.toLowerCase()}`, { method: 'POST' })

      // The 429 (cooldown) / 404 (unknown country) responses are plain JSON,
      // not the streamed NDJSON the success path returns — `res.body` is
      // truthy either way (any response with content has a ReadableStream
      // body), so the only reliable way to tell them apart is content-type
      // or status, not body's presence.
      const contentType = res.headers.get('content-type') ?? ''
      if (!res.ok || !contentType.includes('ndjson') || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setStatus('error')
        setMessage(body?.error ?? `Refresh failed (HTTP ${res.status}).`)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalStage: 'done' | 'error' | null = null

      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let newlineIndex = buffer.indexOf('\n')
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex)
          buffer = buffer.slice(newlineIndex + 1)
          newlineIndex = buffer.indexOf('\n')
          if (!line.trim()) continue

          const event = JSON.parse(line) as Record<string, unknown>
          if (event.stage === 'source') {
            setLog((prev) => [...prev, { source: String(event.source), ok: Boolean(event.ok) }])
          } else if (event.stage === 'done') {
            finalStage = 'done'
            setStatus('done')
            setMessage(typeof event.message === 'string' ? event.message : 'Refreshed.')
            if (typeof event.capturedAt === 'string') setAsOf(event.capturedAt)
          } else if (event.stage === 'error') {
            finalStage = 'error'
            setStatus('error')
            setMessage(typeof event.message === 'string' ? event.message : 'Refresh failed.')
          }
        }
      }

      if (finalStage === null) {
        // Stream ended without a "done" or "error" line — shouldn't happen
        // given the route always sends one of those before closing, but
        // don't leave the button stuck showing "Refreshing…" forever if it
        // somehow does.
        setStatus('error')
        setMessage('Refresh ended unexpectedly.')
      } else if (finalStage === 'done') {
        router.refresh()
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  const running = status === 'running'

  return (
    <div className={styles.refreshRow}>
      <span className={styles.refreshAsOf}>Data as of {formatCapturedAt(asOf)}</span>
      <button type="button" onClick={refresh} disabled={running} className={styles.refreshButton}>
        {running ? '↻ Refreshing…' : '↻ Refresh live data'}
      </button>
      {running && log.length > 0 && (
        <ul className={styles.refreshLog} aria-live="polite">
          {log.map((entry, i) => (
            <li key={i} className={entry.ok ? styles.refreshOk : styles.refreshFail}>
              {entry.ok ? '✓' : '✗'} {SOURCE_LABELS[entry.source] ?? entry.source}
            </li>
          ))}
        </ul>
      )}
      {!running && message && (
        <span
          role="status"
          className={status === 'error' ? styles.refreshFail : styles.refreshOk}
        >
          {message}
        </span>
      )}
    </div>
  )
}
