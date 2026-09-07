import Link from 'next/link'

/**
 * Section-level 404. Caught by any /learn/* route that calls notFound() —
 * an unknown course slug, an unknown lesson slug. Deliberately small and
 * quiet: it is a wrong turn, not an event. Signage voice, like everything
 * else in this section.
 */
export default function LearnNotFound() {
  return (
    <div className="measure learn-missing">
      <p className="sign-quiet">No such stop on this line</p>
      <h1 className="learn-h1">This one isn&rsquo;t on the map.</h1>
      <hr className="rule" />
      <Link href="/learn" className="sign">
        Back to the network
      </Link>
    </div>
  )
}
