'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Lesson progress, kept in localStorage and nowhere else — no accounts,
 * no server, nothing to sign in to. Clearing site data resets it, and
 * that is the whole feature.
 *
 * Shape on disk under `learn:progress:v1`:
 *
 *   { "build-with-ai": ["what-a-model-is", "tokens"], ... }
 *
 * Two components read this on the same page (the syllabus header and each
 * lesson row) and a third writes it (the lesson quiz), so a write fires a
 * window event that every live hook listens for. Without it the header
 * would still say "2 of 8" after you finished lesson three.
 */

const STORAGE_KEY = 'learn:progress:v1'

/** Same-tab notification. `storage` only fires in *other* tabs. */
const CHANGE_EVENT = 'learn:progress-change'

type ProgressMap = Record<string, string[]>

/**
 * Every read is wrapped: Safari private mode throws on localStorage access,
 * and a hand-edited or half-written value must not take the page down.
 */
function readAll(): ProgressMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    // Keep only the entries that still look like `slug -> string[]`.
    const clean: ProgressMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        clean[key] = value.filter((item): item is string => typeof item === 'string')
      }
    }
    return clean
  } catch {
    return {}
  }
}

function writeAll(map: ProgressMap): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Storage full or blocked. The page keeps working; progress just
    // won't survive a reload.
  }
}

export interface Progress {
  /** Completed lesson slugs for this course, in the order they were finished. */
  done: string[]
  isDone: (lessonSlug: string) => boolean
  /** Idempotent — marking the same lesson twice writes nothing the second time. */
  markDone: (lessonSlug: string) => void
  /** False until localStorage has been read. Render no progress UI before this. */
  ready: boolean
}

export function useProgress(courseSlug: string): Progress {
  const [done, setDone] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  // The first render must match the server's, which knows nothing about
  // localStorage — so the read happens here, after hydration, and `ready`
  // is what gates any markup that depends on it.
  useEffect(() => {
    setDone(readAll()[courseSlug] ?? [])
    setReady(true)
  }, [courseSlug])

  useEffect(() => {
    const sync = () => setDone(readAll()[courseSlug] ?? [])

    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [courseSlug])

  const isDone = useCallback((lessonSlug: string) => done.includes(lessonSlug), [done])

  const markDone = useCallback(
    (lessonSlug: string) => {
      const all = readAll()
      const list = all[courseSlug] ?? []
      if (list.includes(lessonSlug)) return

      const next = [...list, lessonSlug]
      all[courseSlug] = next
      writeAll(all)
      setDone(next)
      window.dispatchEvent(new Event(CHANGE_EVENT))
    },
    [courseSlug]
  )

  return { done, isDone, markDone, ready }
}
