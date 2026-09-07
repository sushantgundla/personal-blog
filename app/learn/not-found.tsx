import Link from 'next/link'

/**
 * Section-level 404. Caught by any /learn/* route that calls notFound() —
 * an unknown course slug, an unknown lesson slug. Deliberately small and
 * quiet: it is a wrong turn, not an event.
 */
export default function LearnNotFound() {
  return (
    <div className="measure learn-missing">
      <p className="learn-eyebrow">404</p>
      <h1 className="learn-h1">That lesson doesn&rsquo;t exist.</h1>
      <p className="learn-lede">
        It may have been renamed, or the link may have a typo in it.
      </p>
      <Link href="/learn" className="learn-back">
        ← back to the lessons
      </Link>
    </div>
  )
}
