import s from './sheet.module.css'

/**
 * The key plan.
 *
 * A real detail sheet carries a small reduction of the general arrangement
 * with a box round the piece being detailed, so a reader who arrives at the
 * detail can see where on the machine they are standing. This is that: FIG.
 * 1 reduced to its bones, drawn entirely at --pl-faint, with this course's
 * own part boxed in its ink.
 *
 * It is a reduction, not a copy. MachineWide is 1600 x 680 with the fine
 * annotation, the attention lattice, the hit targets and the sparks; none
 * of that survives at 320 x 124, and a key plan that tried to keep it would
 * be a smudge. What survives is the order of the parts, which is the one
 * thing the key plan has to carry: manifold in, corpus below, stack, loop
 * above, dial at the end.
 *
 * Everything here is aria-hidden. The strip says the same thing in words —
 * "Detail of part 3 on FIG. 1" — and the whole plan is a link back to it.
 */

/** A box on the plan, in its viewBox units: x, y, width, height. */
export type KeyBox = [number, number, number, number]

export function KeyPlan({ boxes }: { boxes: KeyBox[] }) {
  return (
    <svg
      className={s.keyPlan}
      viewBox="0 0 320 124"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <g className={s.faint}>
        {/* The axis, and the manifolds at either end of it. */}
        <path className={s.keyLine} d="M18 62H302" />
        <path className={s.keyLine} d="M18 42V82M18 42L46 56M18 82L46 68" />
        <path className={s.keyLine} d="M274 62L302 44M274 62L302 80M302 44V80" />

        {/* The corpus, hanging below the axis. */}
        <ellipse className={s.keyLine} cx="104" cy="94" rx="17" ry="5" />
        <path className={s.keyLine} d="M87 94V106M121 94V106" />
        <path className={s.keyLine} d="M87 106A17 5 0 0 0 121 106" />
        <path className={s.keyLine} d="M104 89V74" />

        {/* The stack. */}
        <path className={s.keyLine} d="M148 46V78M156 46V78M164 46V78M172 46V78" />

        {/* The loop, out to a tool and back. */}
        <path className={s.keyLine} d="M204 52L214 62L204 72L194 62Z" />
        <path className={s.keyDash} d="M204 52V26H150" />
        <path className={s.keyDash} d="M130 26H104V56" />
        <path className={s.keyLine} d="M130 26L135 17H145L150 26L145 35H135Z" />

        {/* The tap, and the dial it reads. */}
        <path className={s.keyDot} d="M256 66V86" />
        <path className={s.keyLine} d="M242 102A14 14 0 0 1 270 102" />
        <path className={s.keyLine} d="M256 102L266 91" />
      </g>

      {/* Where this course sits. One box per object — the prompt course
          owns both manifolds, so it gets two, which is the plan saying
          the same thing FIG. 1 says by lighting both ends at once. */}
      {boxes.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} className={s.keyBox} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  )
}
