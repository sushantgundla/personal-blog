'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IsoCountry } from '@/lib/atlas/iso-countries'
import styles from './plate.module.css'

export interface AtlasSearchProps {
  countries: readonly IsoCountry[]
}

/**
 * The keyboard and mobile path onto the plate — never a consolation prize.
 * The real, enhanced control (type-ahead, arrow keys, Enter) is relocated
 * into the `#atlas-search-slot` that app/atlas/layout.tsx reserves in the
 * header, once mounted. (This project has no `@types/react-dom` and we may
 * not add dependencies, so this moves the rendered node with plain
 * `Node.appendChild` after mount instead of `createPortal` — React does not
 * care where in the DOM a node it owns physically lives, only that it keeps
 * the same node identity across renders, which `appendChild` preserves.)
 * Below it, always rendered server-side and independent of that move, sits
 * a plain `<form method="get">` + `<select>` that works with JavaScript
 * off: submitting it hits `/atlas?c=IND`, which page.tsx reads from
 * `searchParams` and redirects from, server-side, to `/atlas/IND`.
 */
export function AtlasSearch({ countries }: AtlasSearchProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const movableRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Once the enhanced UI has rendered client-side, relocate its root node
  // into the header's search slot. Runs after `mounted` flips true, so the
  // node already exists in the DOM (rendered inline, see below) by the time
  // this fires.
  useEffect(() => {
    if (!mounted) return
    const slot = document.getElementById('atlas-search-slot')
    const el = movableRef.current
    if (slot && el && el.parentElement !== slot) {
      slot.appendChild(el)
    }
  }, [mounted])

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

  const searchUi = (
    <div className={styles.search} role="search">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="atlas-search-listbox"
        aria-autocomplete="list"
        aria-label="Search countries"
        className={styles.searchInput}
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
      {open && results.length > 0 && (
        <ul id="atlas-search-listbox" role="listbox" className={styles.searchListbox}>
          {results.map((c, i) => (
            <li key={c.iso3} role="option" aria-selected={i === activeIndex}>
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
      {mounted && (
        <div ref={movableRef} data-atlas-search-enhanced="true">
          {searchUi}
        </div>
      )}
      <details className={styles.searchFallback}>
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
    </>
  )
}
