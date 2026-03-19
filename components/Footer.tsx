import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-20">
      <div className="max-w-[680px] mx-auto px-6 py-8 flex items-center justify-between text-[13px] text-[var(--text-muted)]">
        <div className="flex gap-6">
          <Link href="/articles" className="hover:text-[var(--text-primary)] transition-colors">Articles</Link>
          <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors">About</Link>
        </div>
        <span>&copy; {new Date().getFullYear()} Sushant Gundla</span>
      </div>
    </footer>
  )
}
