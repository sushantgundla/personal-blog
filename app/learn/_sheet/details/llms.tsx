import { Bay, Callout, Spark } from '../details'
import type { BayKey, Detail } from '../details'
import type { KeyBox } from '../KeyPlan'
import s from '../sheet.module.css'

/**
 * FIG. 2 — LLMs. The model layer, and the choosing around it.
 *
 * FIG. 1 draws this stage as one object: a stack of plates with attention
 * across them. That is one lesson out of twelve. Three of this course's
 * four parts are about providers, bills, open weights and picking — so
 * this detail draws the choosing at the same scale as the machine, and the
 * machine stops being the whole sheet.
 *
 * Read it left to right, the way the request goes:
 *
 *   the bracket        the context window, with a hard stop at its end
 *   the vertical line  where the request leaves your side
 *   the dial on it     the meter — every token in and out is counted
 *   the three bars     rate ceilings, with a return line under them
 *   the enclosure      frozen weights, one attention step, repeated
 *   the picket         the spread of possible next tokens
 *   the three rings    the sampling knobs; two are struck out
 *   the low enclosure  the same weights, on a machine you own
 *   the switch         five candidates, five contacts, one wired through
 *
 * Same pens and the same meanings as FIG. 1. Solid carries the request,
 * dashed only happens if the model calls a tool, dotted watches and carries
 * nothing. Nothing on this sheet is dashed or dotted: this course has no
 * tool call in it and nothing here observes. Thin is detail, hair is
 * texture, and a fourth meaning is not invented.
 *
 * The retry return is solid, not dashed. A retry carries the request again
 * — it is the same request travelling, not a conditional branch out to a
 * tool — and dashed is spoken for.
 *
 * Geometry is hand-authored in a 1200 x 560 viewBox: the house width, and
 * the tallest of the five, because the choosing needs a second storey
 * under the machine and cramming it in beside would have cost the
 * annotation its legibility. Width is the fixed dimension in the CSS, so
 * this sheet letters exactly like its four siblings and simply comes out
 * the tallest on the page — 149px past the fold on a 1440 x 800 laptop,
 * which is the price the second storey costs and is recorded in DESIGN.md.
 */

/* --- The stack -------------------------------------------------- */

const PLATES = [538, 584, 630, 674, 720, 766]

/**
 * Attention, drawn the way FIG. 1 draws it: every chord starts and ends on
 * the same plate, because attention runs across the tokens inside one
 * block rather than from one block to the next.
 */
const CHORDS = PLATES.map((x, i) => {
  const r = 35 + ((i * 2) % 3) * 9
  const a = `M${x} ${216 + i * 7}A${r} ${r} 0 0 ${i % 2} ${x} ${285 + i * 7 + ((i * 2) % 3) * 13}`
  const b = `M${x} ${261 + (i % 2) * 11}A46 46 0 0 ${1 - (i % 2)} ${x} ${352 + (i % 2) * 11}`
  const c = `M${x} ${309 + (i % 4) * 7}A30 30 0 0 ${i % 2} ${x} ${368 + (i % 4) * 7}`
  return a + b + c
}).join('')

/** The token run inside the context window, at a uniform pitch. */
const TEETH = Array.from({ length: 16 }, (_, i) => `M${138 + i * 11} 276V308`).join('')

function LlmsDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 560"
      className={s.detail}
      focusable="false"
      role="presentation"
    >
      {/* ---- The spine: the request travelling ---------------------- */}
      <g className={s.spine} aria-hidden="true">
        <path className={s.flow} d="M20 292H318" />
        <path className={s.head} d="M54 292L32 281V303Z" />
        <path className={s.flow} d="M370 292H506" />
        <path className={s.flow} d="M816 292H966" />
      </g>

      {/* ---- Part 1: the machine ------------------------------------
          What a model is made of, what the window holds, and the one
          stage after the stack where a token actually gets chosen. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="100" y="200" width="240" height="124" />
        <rect className={s.hit} x="494" y="146" width="478" height="288" />

        {/* The context window: a bracket over the token run, with a hard
            stop drawn heavy at the end of it. Nothing past the stop
            goes in. */}
        <path className={s.thin} d="M134 248H310M134 248V270" />
        <path className={s.flow} d="M310 242V274" />
        <path className={s.thin} d={TEETH} />

        {/* The model. Frozen plates, and one attention step across the
            tokens inside a layer, repeated at every layer. */}
        <path className={s.thin} d="M506 168V414M816 168V414" />
        <path className={s.thin} d="M506 168H530M506 414H530M816 168H792M816 414H792" />
        <path className={s.hair} d={CHORDS} />
        {PLATES.map((x) => (
          <rect key={x} className={s.plate6} x={x} y="197" width="8" height="192" />
        ))}
        <path className={s.thin} d="M538 403H774M538 403V392M774 403V392" />

        {/* Sampling. A picket of possible next tokens hanging off the
            line, and the three knobs that used to choose between them —
            two struck out, because providers are taking them away. */}
        <path
          className={s.thin}
          d="M826 292V377M842 292V356M858 292V337M874 292V324M890 292V313M906 292V305"
        />
        <circle className={s.thin} cx="845" cy="237" r="15" />
        <path className={s.thin} d="M845 237L856 226" />
        <circle className={s.dropped} cx="888" cy="237" r="15" />
        <path className={s.dropped} d="M877 226L899 248M899 226L877 248" />
        <circle className={s.dropped} cx="931" cy="237" r="15" />
        <path className={s.dropped} d="M920 226L942 248M942 226L920 248" />

        <text className={s.lab} x="107" y="227">
          Context window
        </text>
        <text className={s.lab} x="506" y="155">
          Frozen weights
        </text>
        <text className={s.lab} x="506" y="445">
          One step, repeated
        </text>
        <text className={s.lab} x="826" y="197">
          Knobs removed
        </text>
        <text className={s.lab} x="826" y="408">
          Sampling
        </text>
      </Bay>

      {/* ---- Part 2: the providers ----------------------------------
          The line the request crosses, the meter it crosses through, the
          ceilings above it, and the way back when it hits one. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="334" y="32" width="334" height="254" />
        <rect className={s.hit} x="307" y="261" width="78" height="67" />

        {/* Their machine begins here. The line is broken at the meter,
            because the meter is the crossing. */}
        <path className={s.thin} d="M344 80V267M344 320V400" />

        <circle className={s.thin} cx="344" cy="292" r="27" />
        <path className={s.thin} d="M344 292L361 275" />
        <circle className={s.dot} cx="344" cy="292" r="4" />

        {/* Three separate ceilings, one status code. */}
        <path className={s.thin} d="M400 75H626M400 99H626M400 123H626" />

        {/* Up until it hits one, then back and sent again. Solid: a retry
            is the same request travelling, not a conditional branch. */}
        <path className={s.flow} d="M440 292V131H394V275" />
        <path className={s.head} d="M394 291L383 269H405Z" />

        <text className={s.lab} x="360" y="53">
          Their machine
        </text>
        <text className={s.lab} x="648" y="107">
          Rate ceilings
        </text>
        <text className={s.lab} x="331" y="357" textAnchor="end">
          Per token
        </text>
        <text className={s.lab} x="357" y="349">
          Retry
        </text>
      </Bay>

      {/* ---- Part 3: open weights -----------------------------------
          The same plates, in an enclosure on your side of the line. The
          request never crosses the meter on this route, and the height of
          the enclosure is the memory the thing has to fit in. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="59" y="387" width="320" height="160" />

        <path className={s.flow} d="M80 292V461H120" />

        <path className={s.thin} d="M120 408V507M334 408V507" />
        <path className={s.thin} d="M120 408H141M120 507H141M334 408H313M334 507H313" />
        <rect className={s.plate6} x="150" y="429" width="7" height="59" />
        <rect className={s.plate6} x="181" y="429" width="7" height="59" />
        <rect className={s.plate6} x="213" y="429" width="7" height="59" />
        <rect className={s.plate6} x="245" y="429" width="7" height="59" />
        <rect className={s.plate6} x="277" y="429" width="7" height="59" />
        <rect className={s.plate6} x="309" y="429" width="7" height="59" />

        <path className={s.thin} d="M150 520H316M150 520V509M316 520V509" />

        <path className={s.flow} d="M334 461H1040" />

        <text className={s.lab} x="120" y="395">
          Your machine
        </text>
        <text className={s.lab} x="150" y="549">
          Memory
        </text>
      </Bay>

      {/* ---- Part 4: choosing ---------------------------------------
          A switch. Five candidates come in on five contacts — three
          struck out on your own cases, the provider, and your own box —
          and one of them is wired through. Throwing it is how you change
          model, and everything upstream stays where it is. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="941" y="200" width="254" height="334" />

        <rect className={s.dropped} x="979" y="213" width="40" height="32" />
        <path className={s.dropped} d="M979 213L1019 245M1019 213L979 245M1019 229H1040" />

        <rect className={s.dropped} x="979" y="384" width="40" height="32" />
        <path className={s.dropped} d="M979 384L1019 416M1019 384L979 416M1019 400H1040" />

        <rect className={s.dropped} x="979" y="504" width="40" height="32" />
        <path className={s.dropped} d="M979 504L1019 536M1019 504L979 536M1019 520H1040" />

        <circle className={s.dot} cx="1040" cy="229" r="5" />
        <circle className={s.dot} cx="1040" cy="292" r="5" />
        <circle className={s.dot} cx="1040" cy="400" r="5" />
        <circle className={s.dot} cx="1040" cy="461" r="5" />
        <circle className={s.dot} cx="1040" cy="520" r="5" />

        {/* Four candidates reach a contact and stop there — including
            your own box, which is running and simply is not the one you
            picked this time. One is wired through. */}
        <path
          className={s.dropped}
          d="M1040 229L1088 349M1040 400L1088 349M1040 461L1088 349M1040 520L1088 349"
        />
        <path className={s.flow} d="M1040 292L1088 349" />

        <circle className={s.dot} cx="1088" cy="349" r="7" />
        <path className={s.flow} d="M1088 349H1157" />
        <path className={s.head} d="M1178 349L1157 338V360Z" />

        <text className={s.lab} x="934" y="533" textAnchor="end">
          Pick one
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={861} cy={144} lead="M849 153L819 174" dot={[816, 176]} />
        <Callout k={k} i={1} cx={291} cy={80} lead="M303 89L341 120" dot={[344, 123]} />
        <Callout k={k} i={2} cx={365} cy={523} lead="M353 514L337 503" dot={[334, 501]} />
        <Callout k={k} i={3} cx={1157} cy={430} lead="M1151 416L1123 355" dot={[1120, 349]} />
      </g>

      <Spark d="M20 292H1040L1088 349H1157" dur="2.1s" delay="0.3s" />
    </svg>
  )
}

export const detail: Detail = {
  bays: 4,
  steps: [
    'The request is put together inside the context window — a bracket with a hard stop at the end of it. Nothing past the stop goes in.',
    'It crosses the line onto somebody else’s machine through a meter, which counts every token in and every token back out.',
    'Three ceilings sit above the line. A request that hits one is turned back and sent again.',
    'Inside the enclosure the weights are frozen, and one attention step runs across the tokens, repeated at every layer.',
    'What leaves the stack is a spread of possible next tokens. Three knobs used to choose between them; two are struck out, because the providers are taking them away.',
    'The same weights can sit in a second enclosure on your own machine, on your side of the line, where nothing is metered and the height of the box is the memory you have to find.',
    'Five candidates arrive at a switch: three struck out on your own cases, the provider, and your own box. One is wired through, and that is the model you get. Throwing the switch is how you change it.',
  ],
  keyBoxes: [[140, 40, 42, 44]] as KeyBox[],
  Drawing: LlmsDetail,
}
