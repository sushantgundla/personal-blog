import Link from 'next/link'

/**
 * Section-level 404. Caught by any /learn/* route that calls notFound() —
 * an unknown course slug, an unknown lesson slug. Deliberately small and
 * quiet: it is a wrong turn, not an event. It speaks the plate's voice,
 * because /learn is Fig. 1 now and "back to the network" named a page
 * that no longer exists.
 */
export default function LearnNotFound() {
  return (
    <div className="measure learn-missing">
      <p className="sign-quiet">Not on this sheet</p>
      <h1 className="learn-h1">Nothing is drawn here.</h1>
      <hr className="rule" />
      <Link href="/learn" className="sign">
        Back to Fig. 1
      </Link>
    </div>
  )
}
