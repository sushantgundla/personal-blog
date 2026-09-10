import type { CSSProperties, ReactNode } from 'react'
import type { BayKey, Detail } from '../details'
import s from '../sheet.module.css'

/**
 * FIG. 2/4 — Agents and Tool Use, drawn large.
 *
 * On every other sheet the dashed line is an aside: the one path through
 * the machine that only happens if the model decides to call a tool. Here
 * it is the subject, so it is the longest line on the drawing and it is
 * given a circuit of its own — out of the decision, through the schema the
 * call has to fit, into the tool, and back along a return line that counts
 * its own turns on the way to the context window.
 *
 * Read it as one lap of that circuit:
 *
 *   the block at the far left     a run that starts on a schedule
 *   the four blocks of text       the tools, described to the model
 *   the junction                  the context window, where they all meet
 *   the stack                     the model
 *   the diamond                   stop, or call
 *   the boxed call line           the closed schema the call has to fit
 *   the hexagon                   the tool
 *   the gate above it             approval, before anything touches the world
 *   the hatched block at the top  the real world
 *   the return line               the result, coming back
 *   the ticks on it               the turns, and the bar that ends the run
 *   the struck cross              a call that failed, and the path back in
 *   the growing bars              the transcript, longer every turn
 *   the two dials at the bottom   what a turn cost, and what each step did
 *   the two weak diamonds         one agent becoming five
 *
 * Same three pens, same three meanings as FIG. 1. Solid carries the
 * request. Dashed only happens if the model calls a tool — which is why
 * the tool's reach up into the real world is dashed too: it is downstream
 * of that same decision and happens only when it does. Dotted watches and
 * carries nothing, so the cost meter and the trace are dotted; neither
 * moves the run along. Thin is detail, hair is texture, and there is no
 * fourth meaning here either.
 *
 * The four bays are the course's four parts. Part 1 is the shape of an
 * agent, so it owns the model, the decision, the tool descriptions arriving
 * as text and the schema a tool is designed around. Part 2 is running the
 * loop, so it owns the dashed circuit itself, the turns, the limit, the
 * failed call and the transcript. Part 3 is reaching outside, so it owns
 * the tool, the gate, the world and the trigger with nobody behind it.
 * Part 4 is running it at scale: more agents, the bill, the trace.
 *
 * Geometry is hand-authored in a 1200 x 460 viewBox. The ratio, 2.61:1,
 * sits inside the 2.5:1–2.9:1 band the sheet's margin is built around, and
 * the width matches the other four details, so a 15px label on this sheet
 * comes out the same physical size as a 15px label on any of them.
 */

/**
 * A bay: the objects belonging to one part of the course. A bay with no
 * part behind it falls back to the spine class — it is still drawn, because
 * the machine is true whether or not a course has a part about it, but it
 * takes no ink and never dims.
 */
function Bay({ k, i, children }: { k: BayKey; i: number; children: ReactNode }) {
  const zone = k.zone(i)
  return (
    <g className={zone === undefined ? s.spine : s.bay} data-zone={zone}>
      {children}
    </g>
  )
}

/** A numbered ring, a leader, and a dot on the thing it names. */
function Callout({
  k,
  i,
  cx,
  cy,
  lead,
  dot,
}: {
  k: BayKey
  i: number
  cx: number
  cy: number
  lead: string
  dot: [number, number]
}) {
  const zone = k.zone(i)
  if (zone === undefined) return null

  return (
    <g className={s.callout} data-zone={zone}>
      <path className={s.lead} d={lead} />
      <circle className={s.dot} cx={dot[0]} cy={dot[1]} r={3.5} />
      <circle className={s.ring} cx={cx} cy={cy} r={15} />
      <text className={s.num} x={cx} y={cy + 6} textAnchor="middle">
        {k.num(i)}
      </text>
    </g>
  )
}

/** The one authored moment: a single request runs the detail once, on load. */
function Spark({ d, dur, delay, len }: { d: string; dur: string; delay: string; len?: string }) {
  return (
    <g className={s.sparks}>
      <path
        className={s.spark}
        d={d}
        pathLength={1}
        style={
          { '--pl-dur': dur, '--pl-delay': delay, ...(len ? { '--pl-d': len } : {}) } as CSSProperties
        }
      />
    </g>
  )
}

function AgentsDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 460"
      className={s.detail}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* ---- The spine ------------------------------------------------
          The request arriving, the context window everything is assembled
          in, and the answer leaving. Belongs to no single part. */}
      <g className={s.spine}>
        <path className={s.flow} d="M84 300H164" />
        <path className={s.head} d="M180 300L164 291.5V308.5Z" />

        <circle className={s.flow} cx="208" cy="300" r="28" />
        <path className={s.thin} d="M188 280L228 320M188 320L228 280" />
        <text className={s.lab} x="180" y="352" textAnchor="end">
          Context window
        </text>

        <path className={s.flow} d="M236 300H320" />
        <path className={s.flow} d="M510 300H570" />
        <path className={s.flow} d="M670 300H1096" />
        <path className={s.head} d="M1112 300L1096 291.5V308.5Z" />
        <text className={s.lab} x="1112" y="286" textAnchor="end">
          Answer
        </text>
      </g>

      {/* ---- 1. The shape of an agent ---------------------------------
          A model, a set of functions it is allowed to call, and one
          decision after it. The tools are drawn where they actually live:
          as text, in the context window, alongside everything else — four
          of them, because the lesson is four tools rather than thirty. The
          boxed length of the call line is the schema the call has to fit,
          which is the other half of designing a tool a model can use. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="36" y="4" width="170" height="136" />
        <rect className={s.hit} x="312" y="238" width="206" height="124" />
        <rect className={s.hit} x="560" y="242" width="120" height="118" />
        <rect className={s.hit} x="794" y="184" width="132" height="56" />

        {/* The tool descriptions, as lines of text, and the line that
            carries them into the context window with the prompt. */}
        <path className={s.thin} d="M44 34H140M44 44H112" />
        <path className={s.thin} d="M44 62H140M44 72H120" />
        <path className={s.thin} d="M44 90H140M44 100H104" />
        <path className={s.thin} d="M44 118H140M44 128H124" />
        <path className={s.flow} d="M152 72H184V270" />
        <path className={s.head} d="M184 286L175.5 270H192.5Z" />
        <text className={s.lab} x="44" y="22">
          Tools, as text
        </text>

        {/* The model. */}
        <path className={s.thin} d="M320 248V352M510 248V352" />
        <path className={s.thin} d="M320 248H340M320 352H340M510 248H490M510 352H490" />
        <rect className={s.plate6} x="350" y="264" width="5" height="72" />
        <rect className={s.plate6} x="384" y="264" width="5" height="72" />
        <rect className={s.plate6} x="418" y="264" width="5" height="72" />
        <rect className={s.plate6} x="452" y="264" width="5" height="72" />
        <text className={s.lab} x="320" y="240">
          Model
        </text>

        {/* The one decision. Everything dashed on this sheet starts here. */}
        <path className={s.flow} d="M620 250L670 300L620 350L570 300Z" />
        <text className={s.lab} x="620" y="374" textAnchor="middle">
          Stop, or call
        </text>

        {/* The schema, drawn as a box the call passes through: closed, and
            with a fixed set of fields. */}
        <rect className={s.thin} x="800" y="190" width="120" height="44" />
        <path className={s.thin} d="M814 202H906M814 226H906" />
        <text className={s.lab} x="860" y="258" textAnchor="middle">
          Closed schema
        </text>
      </Bay>

      {/* ---- 2. Running the loop --------------------------------------
          The circuit. Out of the decision, along the call line, up into
          the tool; back along the return, which is the longest line on the
          sheet because on this sheet it is the point. The ticks on it are
          the turns, the solid bar across it is the limit that ends a
          runaway, and the struck cross is a call that failed — a failed
          result is still a result, so it comes back and goes round again.
          The bars hanging off the return are the transcript, one line
          longer every turn. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="204" y="114" width="700" height="48" />
        <rect className={s.hit} x="204" y="166" width="110" height="70" />
        <rect className={s.hit} x="612" y="164" width="386" height="52" />

        {/* Out. */}
        <path className={s.cond} d="M620 250V212H990V164" />

        {/* Back. */}
        <path className={s.cond} d="M930 138H208V256" />
        <path className={s.head} d="M208 272L199.5 256H216.5Z" />

        {/* The turns, counted on the return. */}
        <path className={s.thin} d="M860 126V150M780 126V150M700 126V150M620 126V150" />
        <text className={s.lab} x="860" y="118" textAnchor="middle">
          1
        </text>
        <text className={s.lab} x="780" y="118" textAnchor="middle">
          2
        </text>
        <text className={s.lab} x="700" y="118" textAnchor="middle">
          3
        </text>
        <text className={s.lab} x="620" y="118" textAnchor="middle">
          4
        </text>
        <text className={s.lab} x="596" y="118" textAnchor="end">
          Turns
        </text>

        {/* The line nobody writes, drawn: the one that ends the run. */}
        <path className={s.flow} d="M500 118V158" />
        <text className={s.lab} x="500" y="176" textAnchor="middle">
          Turn limit
        </text>

        {/* A call that failed, and the path back into the tool. */}
        <path className={s.dropped} d="M890 128L910 148M890 148L910 128" />
        <path className={s.cond} d="M900 126V88H972V96" />
        <path className={s.head} d="M972 112L963.5 96H980.5Z" />
        <text className={s.lab} x="930" y="78" textAnchor="middle">
          Retry
        </text>
        <text className={s.lab} x="890" y="178" textAnchor="end">
          Failed call
        </text>

        {/* The transcript: a queue, one line longer on every turn. */}
        <text className={s.lab} x="318" y="204">
          Transcript grows
        </text>
        <path className={s.thin} d="M208 176H244M208 194H268M208 212H288M208 230H306" />
      </Bay>

      {/* ---- 3. Reaching outside --------------------------------------
          The tool itself, and the only place on the sheet where anything
          leaves the machine. The reach into the world is dashed like the
          rest of the circuit — it is downstream of the same decision — and
          it goes through a gate first, because you cannot stop an agent
          making a bad call, only decide in advance how bad the worst call
          is allowed to be. At the far left, the same run started by a
          clock rather than a person. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="926" y="108" width="148" height="60" />
        <rect className={s.hit} x="936" y="16" width="128" height="76" />
        <rect className={s.hit} x="20" y="248" width="150" height="78" />

        {/* The tool. */}
        <path className={s.flow} d="M930 138L947 112H1053L1070 138L1053 164H947Z" />
        <circle className={s.thin} cx="1000" cy="138" r="9" />

        {/* Up through the gate, into the world. */}
        <path className={s.cond} d="M1000 112V86M1000 66V56" />
        <rect className={s.thin} x="980" y="66" width="40" height="20" />
        <path className={s.thin} d="M980 86L1020 66" />
        <text className={s.lab} x="1032" y="82">
          Approval
        </text>

        <rect className={s.thin} x="940" y="20" width="120" height="36" />
        <path
          className={s.hair}
          d="M952 20V56M970 20V56M988 20V56M1006 20V56M1024 20V56M1042 20V56"
        />
        <text className={s.lab} x="1072" y="44">
          Real world
        </text>

        {/* Nobody typed this one. */}
        <rect className={s.thin} x="24" y="278" width="60" height="44" />
        <path className={s.thin} d="M39 278V322M54 278V322M69 278V322" />
        <text className={s.lab} x="24" y="268">
          On a schedule
        </text>
      </Bay>

      {/* ---- 4. Running it at scale -----------------------------------
          What the loop costs once nobody is standing over it. Two dotted
          taps, because both watch and neither carries the run: one reads
          what a turn cost, and it climbs, because every turn re-reads the
          whole transcript above it. The other writes down what each step
          did, which after a silent wrong answer is the only evidence
          there is. The two weak diamonds under the model are the same
          agent, split — and each copy pays for its own context. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="340" y="352" width="150" height="76" />
        <rect className={s.hit} x="782" y="296" width="156" height="132" />
        <rect className={s.hit} x="92" y="330" width="232" height="98" />

        {/* One agent becoming five. */}
        <path className={s.dropped} d="M378 376V356M452 376V356" />
        <path className={s.dropped} d="M378 378L400 400L378 422L356 400Z" />
        <path className={s.dropped} d="M452 378L474 400L452 422L430 400Z" />
        <text className={s.lab} x="415" y="446" textAnchor="middle">
          More of them
        </text>

        {/* What a turn cost, and what it does over a long run. */}
        <circle className={s.dot} cx="860" cy="300" r="5" />
        <path className={s.obs} d="M860 310V366" />
        <rect className={s.thin} x="786" y="366" width="148" height="58" />
        <path className={s.thin} d="M798 418H830V402H862V386H894V372H926" />
        <text className={s.lab} x="860" y="446" textAnchor="middle">
          Cost per turn
        </text>

        {/* Every step, written down. */}
        <path className={s.obs} d="M208 336V366" />
        <rect className={s.thin} x="96" y="366" width="224" height="58" />
        <path className={s.thin} d="M140 366V424M184 366V424M228 366V424M272 366V424" />
        <text className={s.lab} x="208" y="446" textAnchor="middle">
          Trace
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={560} cy={206} lead="M572 217L604 259" dot={[607, 263]} />
        <Callout k={k} i={1} cx={460} cy={90} lead="M460 105V130" dot={[460, 134]} />
        <Callout k={k} i={2} cx={1130} cy={138} lead="M1115 138H1077" dot={[1074, 138]} />
        <Callout k={k} i={3} cx={700} cy={400} lead="M715 400H782" dot={[785, 400]} />
      </g>

      <Spark
        d="M236 300H320M510 300H570L620 250V212H990V164M930 138H208V256"
        dur="2.6s"
        delay="0.3s"
      />
    </svg>
  )
}

export const detail: Detail = {
  bays: 4,
  steps: [
    'A run can start with a person typing, or on a schedule, with nobody there to ask.',
    'The tools are described to the model as text, and go into the context window with everything else. There are four of them, not thirty.',
    'The request runs through the model to one decision: stop, or call a tool.',
    'If it calls, a dashed path leaves the decision and passes through the tool’s schema — a closed set of fields the call has to fit.',
    'The tool runs. A dashed line from it up through an approval gate is the only place on the sheet where anything touches the real world.',
    'The result comes back along the return line into the context window. The ticks on it are the turns, and the solid bar across it is the limit that ends a runaway.',
    'A call that failed is struck through. It is still a result, so a short path takes it back into the tool to try again.',
    'The bars hanging off the return are the transcript: one line longer every turn.',
    'Two dotted taps watch and carry nothing — one reads what a turn cost, which climbs over a long run, and one writes down what each step did.',
    'The two weak diamonds under the model are the same agent split in five, each copy paying for its own context.',
    'When the model stops instead of calling, the answer leaves on the right.',
  ],
  keyBoxes: [[96, 12, 124, 66]],
  Drawing: AgentsDetail,
}
