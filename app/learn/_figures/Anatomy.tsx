import { Figure } from './Figure'
import s from './figures.module.css'

/**
 * <Anatomy> — a literal, with its parts named in the margin.
 *
 * A prompt, a JSON response, a tool_use block, a line of a trace:
 * printed exactly as it really is, with the parts that matter
 * underlined and numbered, and the numbers repeated in a key beside
 * it. Above 62rem the key goes out into the spread's right-hand air,
 * which is what that air is for; below it there is no margin, so the
 * key sits underneath.
 *
 * It is not a code block with a caption. If nothing in the literal
 * needs naming, use a fenced code block and, if it needs a number,
 * wrap that in <Figure bare>.
 *
 * The literal is given as a list of runs rather than as one string
 * with a list of things to search for in it. A run with a `name` is
 * marked and numbered; a run without one is printed plain. Joined in
 * order they are the literal, character for character — so a figure
 * can never mark the wrong `"type"` because there were three of them.
 *
 * A marked run is underlined, never highlighted: a tinted panel is a
 * standing ban in this section and a rule under the words does the
 * whole job. The numeral is real text and not `aria-hidden`, because
 * it is the only thing tying the literal to the key for a reader who
 * is listening rather than looking.
 */

/** One run of the literal. */
export interface AnatomyPart {
  /**
   * The characters, exactly. Newlines and indentation are kept — the
   * block is a `<pre>`, so what you write is what is printed.
   */
  text: string
  /**
   * What this run is. Present means the run is marked and numbered;
   * absent means it is printed plain, as the connective tissue
   * between the parts that matter.
   */
  name?: string
  /** One clause under the name in the key. Optional. */
  note?: string
  /**
   * The part the figure is about. It takes the warm underline and the
   * warm numeral, and nothing else does. At most one per Anatomy.
   */
  subject?: boolean
}

export interface AnatomyProps {
  /** The caption. Printed after "FIG. n —"; it is the accessible name. */
  caption: string
  /** The text equivalent. Rarely needed: the key is already text. */
  alt?: string
  /** The runs, in order. Joined, they are the literal. */
  parts: AnatomyPart[]
  /** What the literal is, over the block: `A REQUEST`, `THE RESPONSE`. */
  label?: string
}

export function Anatomy({ caption, alt, parts, label }: AnatomyProps) {
  const kept = parts.filter((part) => typeof part.text === 'string' && part.text.length > 0)
  if (kept.length === 0) return null

  // Numbered in the order they appear in the literal, so the key reads
  // down in the order a reader's eye meets the marks.
  let counter = 0
  const drawn = kept.map((part) => ({ ...part, n: part.name ? ++counter : 0 }))
  const named = drawn.filter((part) => part.n > 0)

  return (
    <Figure caption={caption} alt={alt}>
      <div className={s.anat}>
        <div>
          {label ? <div className={`${s.lab} ${s.anatLabel}`}>{label}</div> : null}

          <pre className={s.anatText} tabIndex={0}>
            {drawn.map((part, index) =>
              part.n > 0 ? (
                <span
                  key={index}
                  className={`${s.anatMark} ${part.subject ? s.anatMarkOn : ''}`.trim()}
                >
                  {part.text}
                  <span className={s.anatN}>{part.n}</span>
                </span>
              ) : (
                <span key={index}>{part.text}</span>
              )
            )}
          </pre>
        </div>

        <ol className={s.list}>
          {named.map((part) => (
            <li
              key={part.n}
              className={`${s.row} ${s.anatKeyRow} ${
                part.subject ? s.anatKeyOn : ''
              }`.trim()}
            >
              <span className={s.anatKeyN}>{part.n}</span>
              <span className={s.keyName}>
                {part.name}
                {part.note ? <span className={s.keyNote}>{part.note}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Figure>
  )
}
