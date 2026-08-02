'use client'

import { useId, useMemo, useState } from 'react'
import type { AtlasSection } from '@/lib/atlas/types'
import styles from './IndicatorPicker.module.css'

export interface IndicatorPickerOption {
  code: string
  label: string
  section: AtlasSection
}

interface IndicatorPickerProps {
  options: readonly IndicatorPickerOption[]
  current: string
}

const SECTION_ORDER: AtlasSection[] = [
  'LAND',
  'PEOPLE',
  'MONEY',
  'TRADE',
  'HEALTH',
  'LEARNING',
  'WORK',
  'CONNECTED',
  'NATURE',
  'STATE',
]

/**
 * The "rank the world by ___" control on `/atlas/rankings/[indicator]`.
 *
 * Same no-JavaScript contract as ComparePicker (compare/page.tsx): this is
 * a plain `<form method="get" action="/atlas/rankings">`. Submitting it
 * builds `?indicator=CODE`, and `/atlas/rankings/page.tsx` — a Server
 * Component reading `searchParams` — redirects to the pretty
 * `/atlas/rankings/CODE` path before any client JS gets a chance to run.
 * A grouped, native `<select>` is fully usable on its own: every section
 * is an `<optgroup>`, and the browser's own type-ahead already lets a
 * visitor jump to an option by typing its label.
 *
 * With JS, two things get nicer without changing that contract: choosing
 * an option submits the form itself (one interaction instead of
 * select-then-click-Go), and the search field narrows the list client-side
 * for the ~150-option case where scrolling an unfiltered list is painful.
 */
export function IndicatorPicker({ options, current }: IndicatorPickerProps) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const selectId = useId()

  const currentOption = options.find((o) => o.code === current)

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
    const bySection = new Map<AtlasSection, IndicatorPickerOption[]>()
    for (const opt of matches) {
      const list = bySection.get(opt.section) ?? []
      list.push(opt)
      bySection.set(opt.section, list)
    }
    return SECTION_ORDER.map((section) => [section, bySection.get(section) ?? []] as const).filter(
      ([, list]) => list.length > 0
    )
  }, [options, query])

  const currentStillListed = grouped.some(([, list]) => list.some((o) => o.code === current))

  return (
    <form
      method="get"
      action="/atlas/rankings"
      className={`atlas-note ${styles.picker}`}
      role="search"
      aria-label="Choose a ranking indicator"
    >
      <div className={styles.field}>
        <label htmlFor={searchId} className="atlas-label">
          Search ~150 indicators
        </label>
        <input
          id={searchId}
          type="search"
          className={styles.search}
          placeholder="e.g. literacy, forest, unemployment…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={selectId} className="atlas-label">
          Rank the world by
        </label>
        <select
          id={selectId}
          name="indicator"
          className={styles.select}
          defaultValue={current}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          {/* Keeps the current indicator selectable even when a search
              query has filtered its section out of the list below — the
              select still needs one of its own <option>s selected. */}
          {!currentStillListed && currentOption && (
            <option value={currentOption.code}>{currentOption.label}</option>
          )}
          {grouped.map(([section, list]) => (
            <optgroup key={section} label={section}>
              {list.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <button type="submit" className={styles.submit}>
        Show ranking →
      </button>
    </form>
  )
}
