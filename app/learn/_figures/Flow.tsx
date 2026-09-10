import { Fragment } from 'react'
import type { CSSProperties } from 'react'
import { Figure } from './Figure'
import s from './figures.module.css'

/**
 * <Flow> — labelled nodes joined by arrows.
 *
 * The workhorse of the kit: a request running through a machine, a
 * pipeline, a decision with named branches, a loop that goes round
 * again. A row above 46rem, a column below it, from one authored
 * source — the component knows nothing about width.
 *
 * The nodes are HTML, so a long label wraps instead of colliding with
 * the arrow, and the type sets at the page's own size on a phone and
 * on a monitor alike. The arrow between two nodes is the only SVG in
 * the whole kit, and it is where the plate's spark idiom lives:
 * pathLength="1" with a dash gap longer than the path, so exactly one
 * spark is ever on a line and the resting offset leaves none. The
 * sparks fire once, staggered along the run, and then nothing moves
 * again. Under a reduced-motion preference they are removed outright
 * rather than shortened — see section 13 of figures.module.css.
 *
 * A branch is drawn as alternatives ruled apart INSIDE the node they
 * leave, not fanned out beside it. Fanning needs a second dimension a
 * phone does not have, and a ruled list says the same thing at every
 * width.
 *
 * A loop back is a bracket ruled under the run it returns over, which
 * is how a drawing office marks a return leg. There is no track, no
 * route and no journey line anywhere in this: those were removed from
 * the section at the owner's instruction and are not coming back.
 */

/** One node on the run. */
export interface FlowStep {
  /** What the node is. Two or three words: "Count the tokens". */
  label: string
  /** One clause under it, if the label needs it. Optional. */
  note?: string
  /**
   * The alternatives leaving this node, ruled apart inside it. Use for
   * a real fork — three policies, four outcomes — not for a list of
   * things that all happen.
   */
  branch?: string[]
  /**
   * The one node this figure is about. It takes the warm edge, and
   * nothing else in the figure is warm. At most one per Flow.
   */
  subject?: boolean
}

/** The return leg: the run going back to an earlier node. */
export interface FlowBack {
  /** 1-based index of the node the return leaves from. */
  from: number
  /** 1-based index of the node it returns to. Must be less than `from`. */
  to: number
  /** Why it goes round again: "while the model keeps asking for tools". */
  label: string
}

export interface FlowProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /** The text equivalent for a screen reader. See FigureProps.alt. */
  alt?: string
  /**
   * The nodes, in the order the request meets them. Two to five read
   * as a row; six or more stay a column at every width, because five
   * boxes across a spread is a drawing and nine is a smudge.
   */
  steps: FlowStep[]
  /** An optional return leg. */
  back?: FlowBack
  /** Turn the travelling spark off. Rare — a Flow with no motion. */
  still?: boolean
}

/** Above this many nodes a row is unreadable, so it stays a column. */
const ROW_LIMIT = 5

/** The arrow between two nodes, lying down. Carries the spark. */
function ArrowH({ delay, still }: { delay: number; still: boolean }) {
  return (
    <svg className={s.connH} viewBox="0 0 48 12" aria-hidden="true">
      <path className={s.rail} d="M 2 6 H 38" />
      <path className={s.head} d="M 33 1.5 L 39 6 L 33 10.5" />
      {still ? null : (
        <path
          className={s.spark}
          d="M 2 6 H 38"
          pathLength={1}
          style={{ '--lmf-delay': `${delay}s` } as CSSProperties}
        />
      )}
    </svg>
  )
}

/** The same arrow, standing up, for the column below 46rem. */
function ArrowV({ delay, still }: { delay: number; still: boolean }) {
  return (
    <svg className={s.connV} viewBox="0 0 12 40" aria-hidden="true">
      <path className={s.rail} d="M 6 2 V 30" />
      <path className={s.head} d="M 1.5 25 L 6 31 L 10.5 25" />
      {still ? null : (
        <path
          className={s.spark}
          d="M 6 2 V 30"
          pathLength={1}
          style={{ '--lmf-delay': `${delay}s` } as CSSProperties}
        />
      )}
    </svg>
  )
}

/** a, b, c — the letter printed in front of a branch, as in the recall band. */
const KEYS = 'abcdefghij'

export function Flow({ caption, alt, steps, back, still = false }: FlowProps) {
  const kept = steps.filter((step) => step.label)
  if (kept.length === 0) return null

  const many = kept.length > ROW_LIMIT

  // Node i sits in grid column 2i-1 and the arrow after it in 2i, so a
  // return leg from node `from` to node `to` brackets the lines
  // 2*to-1 .. 2*from. Both are handed to CSS as custom properties,
  // because grid-column is a shorthand and a shorthand substitutes a
  // var() whole.
  const legal = back && back.to >= 1 && back.from > back.to && back.from <= kept.length
  const target = legal ? kept[back!.to - 1] : null

  const cols: CSSProperties = {
    '--lmf-cols': kept.map(() => 'minmax(0, 1fr)').join(' auto '),
    ...(legal
      ? { '--lmf-c1': String(2 * back!.to - 1), '--lmf-c2': String(2 * back!.from) }
      : {}),
  } as CSSProperties

  return (
    <Figure caption={caption} alt={alt}>
      <div className={s.flow} style={cols} data-many={many ? 'true' : undefined}>
        {kept.map((step, index) => (
          <Fragment key={`${index}-${step.label}`}>
            <div className={`${s.node} ${step.subject ? s.nodeOn : ''}`.trim()}>
              <span className={s.nodeLab}>{step.label}</span>
              {step.note ? <span className={s.nodeNote}>{step.note}</span> : null}

              {step.branch && step.branch.length > 0 ? (
                <ol className={`${s.list} ${s.branch}`}>
                  {step.branch.map((option, b) => (
                    <li key={option} className={`${s.row} ${s.branchItem}`}>
                      <span className={s.branchKey} aria-hidden="true">
                        {KEYS[b] ?? '-'}
                      </span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>

            {index < kept.length - 1 ? (
              <span className={s.conn}>
                <ArrowH delay={0.25 + index * 0.3} still={still} />
                <ArrowV delay={0.25 + index * 0.3} still={still} />
              </span>
            ) : null}
          </Fragment>
        ))}

        {legal ? (
          <>
            {/* The bracket, where there is a row to bracket. */}
            <div className={s.back}>
              <span className={s.backLab}>{back!.label}</span>
            </div>

            {/* The same fact, ruled, where there is not — a phone, and a
                run too long to lay across the spread. Exactly one of the
                two is ever displayed. */}
            <div className={s.backNote}>
              <span className={s.backGlyph} aria-hidden="true">
                &#x21ba;
              </span>
              <span>
                {back!.label} &mdash; back to &ldquo;{target!.label}&rdquo;
              </span>
            </div>
          </>
        ) : null}
      </div>
    </Figure>
  )
}
