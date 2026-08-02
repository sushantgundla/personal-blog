'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import { countryInk } from '@/lib/atlas/ink'
import { toHttps } from '@/lib/atlas/format'
import styles from './compare.module.css'

export interface CompareSlotsProps {
  /** Every real country — the pool the type-ahead searches and the no-JS
   * `<select>` fallback lists. */
  allCountries: readonly IsoCountry[]
  /** The countries the current URL already names, in order — 0 to 5. */
  initialIsos: readonly string[]
  /** Flag image URL per iso3, for whichever countries are already in
   * `initialIsos` — their dossier has already been fetched server-side, so
   * this is free. A country added just now, before the page has re-fetched
   * for it, simply renders without a flag until that catches up. */
  flagUrls: Readonly<Record<string, string | null>>
  /** The ledger (plus face notes, trade, sources) for the CURRENT URL's
   * countries. Rendered here rather than by the caller directly, so this
   * component can swap it out for a prompt the instant the slots no longer
   * match what's on screen — a pending edit, or fewer than two countries. */
  children?: ReactNode
}

const MAX_SLOTS = 5
const MIN_COMPARE = 2

function slugFor(isos: readonly string[]): string {
  return `/atlas/compare/${isos.map((i) => i.toLowerCase()).join('-vs-')}`
}

const SLOT_LETTERS = ['a', 'b', 'c', 'd', 'e'] as const

/**
 * The picker and the comparison are one screen now, not two (owner's
 * request, verbatim: "there should not be a separate screen where you have
 * to go and then select the countries"). Up to five slots across the top —
 * places on the plate where a note is inserted, not generic form fields —
 * a filled slot shows that country's flag, name in its own ink, and a ×;
 * an empty one is a blank, dashed cut in the sheet with an "add a country"
 * control. Editing a slot updates `router` immediately, which re-runs the
 * server page for the new URL and refreshes `children` — no separate
 * client-side re-fetch of dossier data lives here, Next's own routing
 * already does that.
 */
export function CompareSlots({ allCountries, initialIsos, flagUrls, children }: CompareSlotsProps) {
  const router = useRouter()
  const [isos, setIsos] = useState<string[]>(() => [...initialIsos])
  const [isPending, startTransition] = useTransition()
  const [searchOpenAt, setSearchOpenAt] = useState<number | null>(null)

  // A freshly rendered page (new `initialIsos`) always wins over local
  // drift — keeps the slots in lockstep with whatever `children` now shows.
  useEffect(() => {
    setIsos([...initialIsos])
  }, [initialIsos])

  const byIso3 = useMemo(() => new Map(allCountries.map((c) => [c.iso3, c] as const)), [allCountries])

  function commit(next: string[]) {
    setIsos(next)
    if (next.length >= MIN_COMPARE) {
      startTransition(() => router.push(slugFor(next)))
    }
    // Fewer than two: stay on the current URL. The prompt below takes over
    // from `children` immediately (owner's request: dropping to one
    // country "should prompt for another rather than erroring") and the
    // address bar catches up the moment a second country makes the
    // comparison valid again.
  }

  function removeAt(index: number) {
    commit(isos.filter((_, i) => i !== index))
  }

  function addAt(iso3: string) {
    setSearchOpenAt(null)
    if (isos.includes(iso3)) return
    commit([...isos, iso3])
  }

  const sortedCountries = useMemo(
    () => allCountries.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [allCountries]
  )

  const isCurrent = isos.length === initialIsos.length && isos.every((v, i) => v === initialIsos[i])
  const showChildren = Boolean(children) && isos.length >= MIN_COMPARE && isCurrent && !isPending

  return (
    <>
      <div className={styles.slotsRow} role="list" aria-label="Countries being compared">
        {Array.from({ length: MAX_SLOTS }, (_, i) => {
          const iso3 = isos[i]

          if (iso3) {
            const country = byIso3.get(iso3)
            const ink = countryInk(iso3)
            const flagUrl = flagUrls[iso3] ?? null
            const name = country?.name ?? iso3
            return (
              <div
                key={iso3}
                className={styles.slot}
                role="listitem"
                style={{ ['--note-ink' as string]: ink.hex }}
              >
                {flagUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={toHttps(flagUrl)} alt="" className={styles.slotFlag} />
                )}
                <span className={styles.slotName}>{name}</span>
                <button
                  type="button"
                  className={styles.slotRemove}
                  onClick={() => removeAt(i)}
                  aria-label={`Remove ${name} from the comparison`}
                >
                  ×
                </button>
              </div>
            )
          }

          // Only the next open position is a live "add" control — the rest
          // are just the sheet's remaining blank cuts, same idea as notes
          // trimmed off the left of an uncut plate.
          const isNextOpen = i === isos.length
          return (
            <div key={`empty-${i}`} className={`${styles.slot} ${styles.slotEmpty}`} role="listitem">
              {isNextOpen ? (
                <SlotSearch
                  countries={sortedCountries}
                  taken={isos}
                  onSelect={addAt}
                  open={searchOpenAt === i}
                  onOpenChange={(open) => setSearchOpenAt(open ? i : null)}
                />
              ) : (
                <span className={styles.slotEmptyLabel} aria-hidden="true">
                  —
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* No JavaScript: the classic <form method="get"> — five <select>s,
          the same mechanism the picker screen this replaces always used.
          A real <noscript>, so it only ever renders with scripting off
          (same pattern AtlasSearch.tsx already uses on the plate) — never
          a flash-of-fallback for a JS-enabled visitor. */}
      <noscript>
        <form method="get" action="/atlas/compare" className={`atlas-note ${styles.pickerForm}`}>
          {SLOT_LETTERS.map((letter, i) => (
            <div key={letter} className={styles.pickerField}>
              <label htmlFor={`compare-${letter}`} className="atlas-label">
                Country {letter.toUpperCase()}
              </label>
              <select
                id={`compare-${letter}`}
                name={letter}
                className={styles.pickerSelect}
                defaultValue={initialIsos[i] ?? ''}
              >
                <option value="">{i < MIN_COMPARE ? 'Select a country…' : '— None —'}</option>
                {sortedCountries.map((c) => (
                  <option key={c.iso3} value={c.iso3}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button type="submit" className={styles.pickerSubmit}>
            Compare →
          </button>
        </form>
      </noscript>

      {isos.length < MIN_COMPARE ? (
        <p className={`atlas-body ${styles.slotsPrompt}`}>
          {isos.length === 0 ? 'Pick at least two countries to compare.' : 'Pick one more country to compare.'}
        </p>
      ) : !showChildren ? (
        <p className={`atlas-serial ${styles.slotsPrompt}`} role="status" aria-live="polite">
          Updating the ledger…
        </p>
      ) : (
        children
      )}
    </>
  )
}

interface SlotSearchProps {
  countries: readonly IsoCountry[]
  taken: readonly string[]
  onSelect: (iso3: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The same type-ahead behaviour as the plate's own AtlasSearch (filter on
 * name/ISO2/ISO3, arrow keys, Enter to pick, Escape to close) — a fresh
 * component rather than an import, since AtlasSearch is hard-wired to
 * navigate straight to `/atlas/{iso3}` and isn't ours to change; this one
 * fills a slot instead of leaving the page.
 */
function SlotSearch({ countries, taken, onSelect, open, onOpenChange }: SlotSearchProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const pool = countries.filter((c) => !taken.includes(c.iso3))
    const q = query.trim().toLowerCase()
    if (!q) return pool.slice(0, 8)
    return pool
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso3.toLowerCase() === q ||
          c.iso2.toLowerCase() === q ||
          c.iso3.toLowerCase().startsWith(q)
      )
      .slice(0, 12)
  }, [countries, taken, query])

  if (!open) {
    return (
      <button
        type="button"
        className={styles.slotAddButton}
        onClick={() => {
          onOpenChange(true)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      >
        + Add a country
      </button>
    )
  }

  return (
    <div className={styles.slotSearch}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls="compare-slot-search-listbox"
        aria-autocomplete="list"
        aria-label="Add a country to compare"
        className={styles.slotSearchInput}
        placeholder="Search a country…"
        value={query}
        autoFocus
        onChange={(e) => {
          setQuery(e.target.value)
          setActiveIndex(0)
        }}
        onBlur={() => setTimeout(() => onOpenChange(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter') {
            if (results[activeIndex]) {
              e.preventDefault()
              onSelect(results[activeIndex].iso3)
            }
          } else if (e.key === 'Escape') {
            onOpenChange(false)
          }
        }}
      />
      {results.length > 0 && (
        <ul id="compare-slot-search-listbox" role="listbox" className={styles.slotSearchListbox}>
          {results.map((c, i) => (
            <li key={c.iso3} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={styles.slotSearchOption}
                data-active={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(c.iso3)
                }}
              >
                <span>{c.name}</span>
                <span className={styles.slotSearchOptionCode}>{c.iso3}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
