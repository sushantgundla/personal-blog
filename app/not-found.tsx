import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1
        className="text-[72px] font-bold text-[var(--text-primary)] mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        404
      </h1>
      <p className="text-[var(--text-muted)] mb-6">
        This page doesn't exist.
      </p>
      <Link
        href="/"
        className="text-[14px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
      >
        Go home
      </Link>
    </div>
  )
}
