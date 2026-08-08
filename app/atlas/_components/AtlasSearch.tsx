'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import styles from './plate.module.css'

export interface AtlasSearchProps {
  countries: readonly IsoCountry[]
}

/** Stable id for a result's `role="option"` element, so the input's
 * `aria-activedescendant` can point at it. */
function optionId(iso3: string | undefined): string | undefined {
  return iso3 ? `atlas-search-option-${iso3}` : undefined
}

/**
 * The keyboard and mobile path onto the plate — never a consolation prize.
 *
 * Fixed 2026-08-03: this used to render once in app/atlas/layout.tsx's
 * header, on every /atlas/* route (the plate, a dossier, compare,
 * rankings) — the owner looked at it and didn't want "Search a country —
 * press /" showing on pages where a country is already open; it read as
 * noise there. Rendered only from Plate.tsx now, as map furniture (bottom-
 * right of the plate, in .cornerCluster, dropdown opening upward — see
 * .searchListboxUp), which only exists on /atlas itself. Every other route
 * keeps its own "← back to the plate"-style link instead.
 *
 * An earlier version rendered this inline in app/atlas/page.tsx and then
 * relocated its root node into a `#atlas-search-slot` in the header with a
 * plain `Node.appendChild` after mount — a `createPortal` stand-in, since
 * this project has no `@types/react-dom`. That produced a visibly
 * duplicated search box (the inline copy briefly present before the move,
 * and inconsistently after). Rendering this component directly where it
 * belongs removes the DOM-moving hack entirely — there is exactly one
 * search box, one root.
 *
 * Below the enhanced control, always rendered server-side, sits a plain
 * `<form method="get">` + `<select>` wrapped in `<noscript>` — it works
 * with JavaScript off: submitting it hits `/atlas?c=IND`, which
 * app/atlas/page.tsx reads from `searchParams` and redirects from,
 * server-side, to `/atlas/IND`.
 */
export function AtlasSearch({ countries }: AtlasSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" focuses search from anywhere on the page, unless the visitor is
  // already typing into some other field.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== '/') return
      const active = document.activeElement as HTMLElement | null
      const tag = active?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const sortedCountries = useMemo(
    () => countries.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [countries]
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return countries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso3.toLowerCase() === q ||
          c.iso2.toLowerCase() === q ||
          c.iso3.toLowerCase().startsWith(q)
      )
      .slice(0, 12)
  }, [countries, query])

  function go(iso3: string) {
    setOpen(false);
    setQuery('')
    router.push(`/atlas/${iso3}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[activeIndex]) {
        e.preventDefault()
        go(results[activeIndex].iso3)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showResults = open && results.length > 0
  const activeOptionId = showResults ? optionId(results[activeIndex]?.iso3) : undefined

  const searchUi = (
    <div className={`${styles.search} ${styles.searchFloating}`} role="search">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showResults}
        aria-controls="atlas-search-listbox"
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        aria-label="Search countries"
        className={`${styles.searchInput} ${styles.searchInputFloating}`}
        placeholder="Search a country — press /"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />
      {showResults && (
        <ul id="atlas-search-listbox" role="listbox" className={`${styles.searchListbox} ${styles.searchListboxUp}`}>
          {results.map((c, i) => (
            <li key={c.iso3} id={optionId(c.iso3)} role="option" aria-selected={i === activeIndex}>
              <a
                href={`/atlas/${c.iso3}`}
                className={styles.searchOption}
                data-active={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  go(c.iso3)
                }}
              >
                <span>{c.name}</span>
                <span className={styles.searchOptionCode}>{c.iso3}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <>
      {searchUi}
      {/* A real <noscript> tag, not a React/CSS toggle — the browser itself
          decides whether to render this, based on whether scripting is on,
          before any hydration happens. That's what keeps this fallback from
          ever leaking into the normal, JavaScript-on experience (it used to
          render unconditionally, as a raw, unstyled disclosure at the top
          of the page — see the design review). It still degrades further:
          `<details>` and `<form method="get">` need no JS of their own. */}
      <noscript>
        <details className={styles.searchFallback} open>
          <summary className="atlas-label" style={{ cursor: 'pointer' }}>
            Search without JavaScript
          </summary>
          <form
            action="/atlas"
            method="get"
            style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}
          >
            <label htmlFor="atlas-plain-search-select" style={{ position: 'absolute', left: '-9999px' }}>
              Choose a country
            </label>
            <select id="atlas-plain-search-select" name="c" className={styles.searchInput} defaultValue="">
              <option value="" disabled>
                Choose a country…
              </option>
              {sortedCountries.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.dialChip}>
              Go →
            </button>
          </form>
        </details>
      </noscript>
    </>
  )
}
