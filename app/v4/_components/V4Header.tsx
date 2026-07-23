'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { label: 'Writing', href: '/v4/articles' },
  { label: 'Projects', href: '/v4/projects' },
  { label: 'Radar', href: '/v4/radar' },
  { label: 'About', href: '/v4/about' },
]

export function V4Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 md:px-8 h-16 flex items-center justify-between">
        <Link
          href="/v4"
          className="v4-display text-sm font-black tracking-tight text-on-surface hover:text-primary transition-colors"
        >
          Sushant Gundla
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors ${
                  active ? 'text-on-primary bg-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
