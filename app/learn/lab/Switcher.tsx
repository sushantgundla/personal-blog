import Link from 'next/link'
import { VARIANTS, type Variant } from './variants'
import s from './lab.module.css'

/**
 * The lab's own rail: jump between the five candidates on the lesson you
 * are already reading, so the comparison is A-against-B on identical
 * content and not on whatever page each happened to open.
 *
 * It is scaffolding and it says so — it sits above the candidate, in the
 * section's quiet ink, and it is not part of any design being judged. It
 * goes when the lab goes.
 */
export function Switcher({
  current,
  course,
  lesson,
}: {
  current: Variant
  course: string
  lesson: string
}) {
  return (
    <nav className={s.switcher} aria-label="Lesson design candidates">
      <span className={s.switcherLabel}>Candidate</span>

      <ol className={s.switcherList} role="list">
        {VARIANTS.map((variant) => {
          const here = variant.id === current.id
          return (
            <li key={variant.id}>
              <Link
                href={`/learn/lab/${variant.id}/${course}/${lesson}`}
                className={s.switcherLink}
                aria-current={here ? 'page' : undefined}
              >
                <span className={s.switcherN}>{variant.id}</span>
                {variant.name}
              </Link>
            </li>
          )
        })}
      </ol>

      <p className={s.switcherThesis}>{current.thesis}</p>
    </nav>
  )
}
