import type { CSSProperties, ReactNode } from 'react'
import type { KeyBox } from './KeyPlan'
import s from './sheet.module.css'

/**
 * FIG. 2 — the five details.
 *
 * Each one is this course's own part of FIG. 1, redrawn at a larger scale
 * with the annotation there was no room for on the general arrangement.
 * Same pens, same meanings: solid carries the request, dashed only happens
 * if the model calls a tool, dotted watches and carries nothing, thin is
 * detail and hair is texture. A fourth meaning is not invented here either.
 *
 * "Detail at larger scale" means more of the subject, not the same amount
 * bigger. FIG. 1 carries fifteen labelled features across the whole
 * machine; each drawing below carries fourteen to twenty across one part of
 * it, and every one of them is something the course actually teaches — the
 * features were chosen by reading the lesson titles and subtitles in
 * content/learn/<slug>/, so a reader who has taken the course should
 * recognise its contents in the drawing.
 *
 * Two things a detail sheet is allowed that the general arrangement is not,
 * and both are used:
 *
 *   - It may show a part the general arrangement had no corridor for: the
 *     validation valve, the chunker, the rate-limit funnel, the tool bus,
 *     the drift chart. All are real parts of a real system.
 *   - It may use a weight more than once where that weight is the subject.
 *     The evals detail taps the live line twice, because on that sheet the
 *     dotted line is the thing being detailed rather than an aside on
 *     somebody else's drawing.
 *
 * One weight is deliberately borrowed rather than invented. A retry, an
 * iterative second search and a re-test after a model swap are all
 * conditional paths, and dashed is spoken for — it means "only if the model
 * calls a tool". They are drawn at `.thin`, the detail weight, and labelled
 * in words. That is the same trade DESIGN.md already records for the
 * struck-out retrieval candidate, which is drawn weak rather than dashed.
 *
 * Every drawing is divided into bays, one per part of the course, and the
 * bay carries the part's own callout ring. That is the answer to the
 * seventeen-lessons problem: the lessons are not seventeen callouts on one
 * drawing, they are the schedule under four callouts.
 *
 * Bays are keyed by position, not by a number written here: `k.zone(0)` is
 * whatever number the course's first part carries on disk. So renaming or
 * renumbering a part in course.json moves the ring with it, and a course
 * that grows a fifth part gets a fifth schedule column with no ring and the
 * words "Not on the detail" — the same visible failure buildStages() uses
 * on the index.
 *
 * Each drawing has its own viewBox, hand-authored, all of them between
 * 2.5:1 and 2.9:1. That band is not taste: the sheet caps the drawing's
 * height so it stays above the fold on a laptop, so a squarer drawing would
 * leave a margin of bare grid either side wider than the drawing itself.
 */

/** Ties a bay and its callout to the part the course actually has there. */
export interface BayKey {
  /** The `data-zone` for the i-th part, or undefined if there is no i-th part. */
  zone: (index: number) => string | undefined
  /** The numeral in that part's callout ring. */
  num: (index: number) => string | undefined
}

/** One course's detail. */
export interface Detail {
  /**
   * How many bays this drawing was authored with. The schedule reads it so
   * that a course which grows a part the drawing has not caught up with
   * gets a column with no ring and the words "Not on the detail", rather
   * than a numeral pointing at nothing.
   */
  bays: number
  /** The drawing in words, in the order the request meets it. */
  steps: string[]
  /** Where this course sits on the key plan. */
  keyBoxes: KeyBox[]
  Drawing: (props: { k: BayKey }) => JSX.Element
}

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
      <circle className={s.ring} cx={cx} cy={cy} r={17} />
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

/* ============================================================
   1. Prompt Engineering — the inlet and outlet manifolds
   1200 x 420. What you send in, and the shape you demand back.
   ============================================================ */

function PromptDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 420"
      className={s.detail}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <g className={s.spine}>
        <path className={s.flow} d="M300 210H500" />
        <path className={s.flow} d="M670 210H700" />
      </g>

      {/* --- Part 1: how instructions land --------------------------
          One manifold with two ports. The system prompt is the frame and
          the user turn is the job, so they arrive on separate inlets and
          meet before the comb cuts the lot into tokens. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="100" y="80" width="220" height="260" />
        <rect className={s.hit} x="322" y="186" width="160" height="48" />

        <path className={s.flow} d="M120 100V320" />
        <path className={s.flow} d="M120 100L300 195M120 320L300 225" />
        <path className={s.thin} d="M120 210H274" />
        <path className={s.thin} d="M144 140H236M144 168H262M144 252H236M144 280H262" />

        <path
          className={s.thin}
          d="M330 194V226M342 194V226M354 194V226M366 194V226M378 194V226M390 194V226M402 194V226M414 194V226M426 194V226M438 194V226M450 194V226M462 194V226"
        />

        <text className={s.lab} x="120" y="86">
          System prompt
        </text>
        <text className={s.lab} x="144" y="308">
          User turn
        </text>
        <text className={s.lab} x="470" y="250" textAnchor="end">
          Tokens
        </text>
      </Bay>

      {/* --- Part 2: techniques that hold up ------------------------
          A worked pair going into the frame, reasoning taking its own
          room before the answer, and one hard prompt split into two
          checkable ones and rejoined. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="144" y="30" width="140" height="42" />
        <rect className={s.hit} x="346" y="90" width="120" height="52" />
        <rect className={s.hit} x="494" y="120" width="200" height="180" />

        <rect className={s.kept} x="150" y="36" width="54" height="28" />
        <rect className={s.kept} x="222" y="36" width="54" height="28" />
        <path className={s.thin} d="M206 50H216" />
        <path className={s.head} d="M220 50L214 46V54Z" />
        <path className={s.thin} d="M249 64V138" />

        <rect className={s.thin} x="352" y="96" width="112" height="42" />
        <path className={s.hair} d="M364 110H452M364 120H428M364 130H444" />
        <path className={s.thin} d="M408 138V194" />

        <path className={s.thin} d="M500 210L540 150M500 210L540 270" />
        <rect className={s.thin} x="540" y="128" width="90" height="44" />
        <rect className={s.thin} x="540" y="248" width="90" height="44" />
        <path className={s.hair} d="M552 142H618M552 156H598M552 262H618M552 276H598" />
        <path className={s.thin} d="M630 150L670 210M630 270L670 210" />

        <text className={s.lab} x="150" y="26">
          Worked pair
        </text>
        <text className={s.lab} x="352" y="88">
          Reasoning first
        </text>
        <text className={s.lab} x="585" y="240" textAnchor="middle">
          Sub-calls
        </text>
      </Bay>

      {/* --- Part 3: making it reliable -----------------------------
          Three samples that vote, a valve that checks the answer against
          the contract, a retry when it fails, and the guard on untrusted
          text that would otherwise steer the whole thing. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="700" y="100" width="460" height="220" />
        <rect className={s.hit} x="30" y="334" width="110" height="70" />

        <path className={s.flow} d="M700 210L740 150M700 210H740M700 210L740 270" />
        <rect className={s.thin} x="740" y="132" width="70" height="36" />
        <rect className={s.thin} x="740" y="192" width="70" height="36" />
        <rect className={s.thin} x="740" y="252" width="70" height="36" />
        <path className={s.thin} d="M810 150L850 210M810 210H850M810 270L850 210" />
        <circle className={s.flow} cx="868" cy="210" r="18" />
        <path className={s.thin} d="M860 200V220M868 200V220M876 200V220" />

        <path className={s.flow} d="M886 210H930" />
        <path className={s.thin} d="M930 188V232L980 210Z" />
        <path className={s.thin} d="M980 188V232L930 210Z" />
        <path className={s.flow} d="M980 210H1010" />
        <path className={s.head} d="M1026 210L1010 201.5V218.5Z" />

        <path className={s.flow} d="M1026 210L1160 140M1026 210L1160 280M1160 140V280" />
        <path className={s.thin} d="M1076 176H1146M1066 210H1152M1076 244H1140" />
        <path className={s.thin} d="M1026 108H1160M1026 108V122M1160 108V122" />

        {/* The retry. Conditional, but not a tool call — see the note at
            the head of this file on why it is thin and not dashed. */}
        <path className={s.thin} d="M955 232V286H890" />
        <path className={s.head} d="M876 286L890 277.5V294.5Z" />
        <path className={s.thin} d="M876 286V228" />

        {/* The guard on untrusted text, at the inlet where it arrives. */}
        <path className={s.thin} d="M40 356H96" />
        <path className={s.thin} d="M104 340V372M112 340V372" />
        <path className={s.thin} d="M120 356V320" />

        <text className={s.lab} x="740" y="122">
          Samples
        </text>
        <text className={s.lab} x="868" y="178" textAnchor="middle">
          Vote
        </text>
        <text className={s.lab} x="955" y="258" textAnchor="middle">
          Validate
        </text>
        <text className={s.lab} x="916" y="306" textAnchor="middle">
          Retry
        </text>
        <text className={s.lab} x="1093" y="96" textAnchor="middle">
          Contract
        </text>
        <text className={s.lab} x="1160" y="306" textAnchor="end">
          Output
        </text>
        <text className={s.lab} x="40" y="330">
          Untrusted
        </text>
        <text className={s.lab} x="108" y="394" textAnchor="middle">
          Guard
        </text>
      </Bay>

      {/* --- Part 4: keeping it working -----------------------------
          A dotted tap on the prompt itself: every version in git, a score
          off the harness, and a model reading that score to write the
          next candidate. Dotted, because it watches and carries nothing. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="280" y="330" width="400" height="80" />

        <circle className={s.dot} cx="340" cy="226" r="6" />
        <path className={s.obs} d="M340 236V344" />
        <rect className={s.thin} x="296" y="348" width="88" height="16" />
        <rect className={s.thin} x="296" y="370" width="88" height="16" />
        <rect className={s.thin} x="296" y="392" width="88" height="16" />

        <path className={s.thin} d="M384 370H460" />
        <path className={s.thin} d="M460 370H540M460 362V378M540 362V378M518 360V380" />
        <path className={s.thin} d="M540 370H600" />
        <rect className={s.thin} x="600" y="352" width="80" height="36" />
        <path className={s.hair} d="M612 364H668M612 376H650" />

        <path className={s.thin} d="M640 352V318H240" />
        <path className={s.head} d="M224 318L240 309.5V326.5Z" />
        <path className={s.thin} d="M224 318V266" />

        <text className={s.lab} x="296" y="340">
          Versions in git
        </text>
        <text className={s.lab} x="460" y="398">
          Score
        </text>
        <text className={s.lab} x="600" y="344">
          New candidate
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={70} cy={60} lead="M84 74L166 124" dot={[170, 126]} />
        <Callout k={k} i={1} cx={330} cy={58} lead="M340 74L370 92" dot={[372, 94]} />
        <Callout k={k} i={2} cx={940} cy={120} lead="M946 137L957 186" dot={[958, 188]} />
        <Callout k={k} i={3} cx={740} cy={400} lead="M726 392L684 380" dot={[680, 378]} />
      </g>

      <Spark d="M120 210H300H500L540 150L630 150L670 210H700L740 210H810L850 210H930L980 210H1010L1160 210" dur="2.4s" delay="0.25s" />
    </svg>
  )
}

/* ============================================================
   2. RAG — the retrieval branch
   1300 x 500. Everything between the source system and the top-k.
   ============================================================ */

function RagDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1300 500"
      className={s.detail}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* --- Part 1: embeddings -------------------------------------
          The chain nobody draws: the content is still inside somebody
          else's system, it has to be parsed before it can be chunked,
          and only then does anything get embedded. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="30" y="36" width="450" height="180" />

        <rect className={s.thin} x="36" y="56" width="80" height="52" />
        <path className={s.hair} d="M48 72H104M48 84H92M48 96H104" />
        <path className={s.thin} d="M116 82H146" />
        <path className={s.head} d="M152 82L144 77.5V86.5Z" />

        <rect className={s.thin} x="152" y="56" width="80" height="52" />
        <path className={s.thin} d="M164 68H220M164 96H220" />
        <path className={s.hair} d="M164 68L220 96" />
        <path className={s.thin} d="M232 82H262" />
        <path className={s.head} d="M268 82L260 77.5V86.5Z" />

        <rect className={s.kept} x="268" y="56" width="72" height="15" />
        <rect className={s.kept} x="268" y="75" width="72" height="15" />
        <rect className={s.kept} x="268" y="94" width="72" height="15" />
        <path className={s.thin} d="M340 82H370" />
        <path className={s.head} d="M376 82L368 77.5V86.5Z" />

        <rect className={s.flow} x="376" y="52" width="88" height="60" />
        <path className={s.thin} d="M392 70H448M392 82H436M392 94H448" />
        <path className={s.thin} d="M420 112V152" />

        <path className={s.thin} d="M376 190H472" />
        <path
          className={s.thin}
          d="M384 190V160M396 190V174M408 190V152M420 190V178M432 190V162M444 190V182M456 190V168"
        />
        <path className={s.thin} d="M472 178H516" />
        <path className={s.head} d="M522 178L514 173.5V182.5Z" />

        <text className={s.lab} x="36" y="46">
          Source
        </text>
        <text className={s.lab} x="152" y="46">
          Parse
        </text>
        <text className={s.lab} x="268" y="46">
          Chunk
        </text>
        <text className={s.lab} x="376" y="42">
          Embed
        </text>
        <text className={s.lab} x="376" y="212">
          Vector
        </text>
      </Bay>

      {/* --- Part 2: storing vectors ---------------------------------
          The corpus, the index inside it, the half of retrieval that is
          not semantic, and the migration a new embedding model forces. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="520" y="150" width="200" height="200" />
        <rect className={s.hit} x="520" y="352" width="250" height="70" />
        <rect className={s.hit} x="554" y="30" width="110" height="46" />

        <rect className={s.thin} x="556" y="36" width="96" height="36" />
        <path className={s.hair} d="M568 48H640M568 60H628" />
        <path className={s.thin} d="M604 72V142" />
        <path className={s.head} d="M604 156L598 142H610Z" />

        <ellipse className={s.flow} cx="604" cy="180" rx="80" ry="20" />
        <path className={s.flow} d="M524 180V300M684 180V300" />
        <path className={s.flow} d="M524 300A80 20 0 0 0 684 300" />
        <path
          className={s.hair}
          d="M552 206L586 228L622 204L650 236L614 268L566 262L552 206M586 228L614 268M622 204L658 272M650 236L658 272"
        />
        <circle className={s.dot} cx="552" cy="206" r="3" />
        <circle className={s.dot} cx="586" cy="228" r="3" />
        <circle className={s.dot} cx="622" cy="204" r="3" />
        <circle className={s.dot} cx="650" cy="236" r="3" />
        <circle className={s.dot} cx="566" cy="262" r="3" />
        <circle className={s.dot} cx="614" cy="268" r="3" />
        <circle className={s.dot} cx="658" cy="272" r="3" />

        <rect className={s.thin} x="524" y="360" width="164" height="44" />
        <path className={s.thin} d="M578 360V404M632 360V404M524 376H688" />

        <rect className={s.thin} x="704" y="372" width="26" height="32" />
        <path className={s.thin} d="M710 372V364A7 7 0 0 1 724 364V372" />

        <text className={s.lab} x="556" y="26">
          New model
        </text>
        <text className={s.lab} x="524" y="340">
          Corpus + index
        </text>
        <text className={s.lab} x="524" y="420">
          Metadata
        </text>
        <text className={s.lab} x="738" y="392">
          Permissions
        </text>
      </Bay>

      {/* --- Part 3: retrieval ---------------------------------------
          The query is fixed before it is used, run two ways at once and
          fused, then the candidates it brings back are reranked by
          something slower that reads query and passage together. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="734" y="44" width="440" height="120" />
        <rect className={s.hit} x="734" y="186" width="240" height="150" />

        <rect className={s.thin} x="740" y="52" width="88" height="44" />
        <path className={s.hair} d="M752 66H816M752 82H796" />
        <path className={s.thin} d="M828 74H850" />
        <path className={s.head} d="M856 74L848 69.5V78.5Z" />

        <rect className={s.thin} x="856" y="52" width="88" height="44" />
        <path className={s.hair} d="M868 66H932M868 82H912" />
        <path className={s.thin} d="M944 74H968" />
        <path className={s.thin} d="M968 74L996 50M968 74L996 98" />

        <rect className={s.thin} x="996" y="34" width="84" height="32" />
        <rect className={s.thin} x="996" y="82" width="84" height="32" />
        <path className={s.thin} d="M1080 50L1114 74M1080 98L1114 74" />
        <circle className={s.thin} cx="1130" cy="74" r="16" />
        <path className={s.thin} d="M1120 68H1140M1120 80H1140" />

        <path className={s.thin} d="M1130 90V158H704" />
        <path className={s.head} d="M690 158L704 149.5V166.5Z" />

        <path className={s.flow} d="M684 250H744" />
        <path
          className={s.thin}
          d="M744 250L808 208M744 250L808 236M744 250L808 278M744 250L808 306"
        />
        <rect className={s.dropped} x="808" y="192" width="30" height="32" />
        <rect className={s.kept} x="808" y="222" width="30" height="30" />
        <rect className={s.kept} x="808" y="264" width="30" height="30" />
        <rect className={s.dropped} x="808" y="294" width="30" height="32" />
        <path
          className={s.dropped}
          d="M808 192L838 224M838 192L808 224M808 294L838 326M838 294L808 326"
        />

        <path className={s.thin} d="M866 186V336" />
        <path className={s.thin} d="M838 237L900 250M838 279L900 250" />
        <path className={s.flow} d="M900 250H1030" />
        <path className={s.flow} d="M1030 250V196" />
        <path className={s.head} d="M1030 182L1021.5 196H1038.5Z" />

        {/* Search, read, search again. Conditional, so thin and named. */}
        <path className={s.thin} d="M960 264V330H758" />
        <path className={s.head} d="M744 330L758 321.5V338.5Z" />
        <path className={s.thin} d="M744 330V268" />

        <text className={s.lab} x="740" y="42">
          Query
        </text>
        <text className={s.lab} x="856" y="42">
          Rewrite
        </text>
        <text className={s.lab} x="996" y="28">
          Keyword
        </text>
        <text className={s.lab} x="996" y="132">
          Semantic
        </text>
        <text className={s.lab} x="1152" y="80">
          Fuse
        </text>
        <text className={s.lab} x="880" y="188">
          Rerank
        </text>
        <text className={s.lab} x="944" y="236">
          Top-k
        </text>
        <text className={s.lab} x="1044" y="212">
          Context window
        </text>
        <text className={s.lab} x="790" y="352" textAnchor="middle">
          Search again
        </text>
      </Bay>

      {/* --- Part 4: proving it works --------------------------------
          One dotted tap, two readings: did retrieval find the right
          thing, and does the quoted span really appear where the answer
          said it did. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="756" y="412" width="170" height="60" />
        <rect className={s.hit} x="928" y="380" width="180" height="90" />

        <circle className={s.dot} cx="990" cy="250" r="6" />
        <path className={s.obs} d="M990 260V344" />
        <path className={s.obs} d="M990 344H880M880 344V416" />
        <path className={s.obs} d="M990 344V392" />

        <rect className={s.thin} x="760" y="420" width="120" height="44" />
        <path className={s.hair} d="M772 434H840M772 448H820" />
        <path className={s.thin} d="M846 442L856 454L872 428" />

        <path className={s.flow} d="M934 452A56 56 0 0 1 1046 452" />
        <path className={s.thin} d="M930 452H1050" />
        <path
          className={s.thin}
          d="M934 452H946M948 414L956 421M990 396V406M1032 414L1024 421M1046 452H1034"
        />
        <path
          className={`${s.flow} ${s.needle}`}
          d="M990 452L1022 410"
          style={{ transformOrigin: '990px 452px' }}
        />
        <circle className={s.dot} cx="990" cy="452" r="5" />

        <text className={s.lab} x="760" y="412">
          Cited span
        </text>
        <text className={s.lab} x="1064" y="456">
          Recall @ k
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={330} cy={196} lead="M338 180L374 118" dot={[376, 114]} />
        <Callout k={k} i={1} cx={478} cy={330} lead="M492 322L520 306" dot={[522, 304]} />
        <Callout k={k} i={2} cx={700} cy={130} lead="M714 132L740 76" dot={[742, 74]} />
        <Callout k={k} i={3} cx={712} cy={450} lead="M729 448H756" dot={[758, 446]} />
      </g>

      <Spark
        d="M36 82H376M420 112V190H472L524 190V300M684 250H744L808 237L900 250H1030V196"
        dur="2.6s"
        delay="0.35s"
        len="0.1"
      />
    </svg>
  )
}

/* ============================================================
   3. LLMs — the model layer, and the choosing around it
   1200 x 440.
   ============================================================ */

const LLM_PLATES = [448, 486, 524, 562, 600, 638, 676, 714]

/**
 * Attention, drawn the way FIG. 1 draws it: every chord starts and ends on
 * the same plate, because attention runs across the tokens inside one
 * block rather than from one block to the next. The sweep alternates so
 * the lattice reads as mass rather than as one drift to the right.
 */
const LLM_CHORDS = LLM_PLATES.map(
  (x, i) =>
    `M${x} ${104 + i * 4}A${26 + (i % 3) * 6} ${26 + (i % 3) * 6} 0 0 ${i % 2} ${x} ${
      156 + i * 4 + (i % 3) * 12
    }M${x} ${138 + (i % 2) * 10}A42 42 0 0 ${1 - (i % 2)} ${x} ${222 + (i % 2) * 10}M${x} ${
      182 + (i % 4) * 6
    }A22 22 0 0 ${i % 2} ${x} ${226 + (i % 4) * 6}`
).join('')

function LlmsDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 440"
      className={s.detail}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <g className={s.spine}>
        <path className={s.flow} d="M110 186H228" />
        <path className={s.flow} d="M272 186H404" />
        <path className={s.head} d="M420 186L404 177.5V194.5Z" />
      </g>

      {/* --- Part 1: the machine ------------------------------------
          Frozen numbers in a stack, one repeated attention step inside
          each, a hard ceiling on how much can be in the window at once,
          and the sampling that picks the next token out of a
          distribution rather than knowing it. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="416" y="66" width="360" height="250" />
        <rect className={s.hit} x="790" y="160" width="200" height="120" />

        <path className={s.thin} d="M420 74V302M760 74V302" />
        <path className={s.thin} d="M420 74H440M420 302H440M760 74H740M760 302H740" />

        <path className={s.hair} d={LLM_CHORDS} />

        {LLM_PLATES.map((x) => (
          <rect key={x} className={s.plate6} x={x} y="94" width="6" height="188" />
        ))}

        <path className={s.thin} d="M420 50H760M420 50V62M760 50V62" />
        <path className={s.dropped} d="M768 50H830" />

        <path className={s.flow} d="M760 186H800" />
        <path className={s.thin} d="M798 244H910" />
        <path
          className={s.thin}
          d="M808 244V200M822 244V216M836 244V182M850 244V222M864 244V206M878 244V230M892 244V218M906 244V236"
        />
        <rect className={s.kept} x="830" y="168" width="12" height="12" />

        <path className={s.thin} d="M910 220H932" />
        <circle className={s.thin} cx="950" cy="220" r="18" />
        <path className={s.thin} d="M950 220L962 208" />
        <circle className={s.dot} cx="950" cy="220" r="3" />

        <text className={s.lab} x="760" y="42" textAnchor="end">
          Frozen weights
        </text>
        <text className={s.lab} x="420" y="324">
          Layers
        </text>
        <text className={s.lab} x="760" y="324" textAnchor="end">
          Attention within a layer
        </text>
        <text className={s.lab} x="420" y="36">
          Context ceiling
        </text>
        <text className={s.lab} x="798" y="266">
          Next token
        </text>
        <text className={s.lab} x="974" y="226">
          Sampling knobs
        </text>
      </Bay>

      {/* --- Part 2: the providers ----------------------------------
          Three ceilings and a meter on somebody else's machine. Both
          are real parts of a real system that FIG. 1 had no room for. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="140" y="140" width="200" height="100" />
        <rect className={s.hit} x="322" y="20" width="16" height="400" />

        <path className={s.thin} d="M330 20V420" />

        <path className={s.thin} d="M160 164L188 182M160 208L188 190" />
        <path className={s.flow} d="M188 186H228" />

        <circle className={s.thin} cx="250" cy="186" r="22" />
        <path className={s.thin} d="M250 186L264 170" />
        <circle className={s.dot} cx="250" cy="186" r="3" />

        <text className={s.lab} x="152" y="238">
          Rate limit
        </text>
        <text className={s.lab} x="250" y="140" textAnchor="middle">
          Per token
        </text>
        <text className={s.lab} x="338" y="412">
          Their machine
        </text>
      </Bay>

      {/* --- Part 3: open weights -----------------------------------
          The same layers, in an enclosure you own — and the licence,
          which is the part of the trade that is not arithmetic. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="880" y="330" width="300" height="100" />

        <path className={s.thin} d="M770 302V344H972" />
        <path className={s.head} d="M978 344L970 339.5V348.5Z" />

        <rect className={s.thin} x="880" y="376" width="70" height="30" />
        <path className={s.hair} d="M890 388H940M890 398H924" />
        <path className={s.thin} d="M950 391H980" />

        <path className={s.thin} d="M980 316V420M1160 316V420" />
        <path className={s.thin} d="M980 316H998M980 420H998M1160 316H1142M1160 420H1142" />
        <rect className={s.plate6} x="1004" y="334" width="5" height="68" />
        <rect className={s.plate6} x="1040" y="334" width="5" height="68" />
        <rect className={s.plate6} x="1076" y="334" width="5" height="68" />
        <rect className={s.plate6} x="1112" y="334" width="5" height="68" />

        <text className={s.lab} x="880" y="368">
          Licence
        </text>
        <text className={s.lab} x="980" y="308">
          Your machine
        </text>
      </Bay>

      {/* --- Part 4: choosing ---------------------------------------
          Three models on the inlet and one line leaving it, and the
          re-test that a swap is really asking for — a prompt does not
          transport. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="20" y="110" width="100" height="150" />
        <rect className={s.hit} x="86" y="316" width="140" height="60" />

        <rect className={s.dropped} x="30" y="120" width="34" height="28" />
        <rect className={s.kept} x="30" y="172" width="34" height="28" />
        <rect className={s.dropped} x="30" y="224" width="34" height="28" />
        <path className={s.dropped} d="M64 134L110 176M64 238L110 196" />
        <path className={s.flow} d="M64 186H110" />

        <circle className={s.dot} cx="140" cy="186" r="5" />
        <path className={s.obs} d="M140 196V322" />
        <rect className={s.thin} x="96" y="326" width="120" height="40" />
        <path className={s.hair} d="M108 340H204M108 352H176" />

        <text className={s.lab} x="30" y="110">
          Your cases
        </text>
        <text className={s.lab} x="96" y="318">
          Re-test on a swap
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={790} cy={92} lead="M776 100L722 132" dot={[718, 134]} />
        <Callout k={k} i={1} cx={296} cy={370} lead="M311 362L328 336" dot={[330, 332]} />
        <Callout k={k} i={2} cx={830} cy={420} lead="M846 414L878 396" dot={[880, 394]} />
        <Callout k={k} i={3} cx={52} cy={296} lead="M52 279V258" dot={[52, 254]} />
      </g>

      <Spark d="M64 186H228M272 186H404M420 186H760L800 186" dur="2.1s" delay="0.3s" />
    </svg>
  )
}

/* ============================================================
   4. Agents and Tool Use — the loop
   1200 x 460.
   ============================================================ */

function AgentsDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 460"
      className={s.detail}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <g className={s.spine}>
        <circle className={s.flow} cx="100" cy="266" r="32" />
        <path className={s.thin} d="M78 244L122 288M78 288L122 244" />
        <path className={s.flow} d="M132 266H240" />
        <path className={s.flow} d="M420 266H480" />
        <path className={s.flow} d="M560 266H700" />
        <path className={s.head} d="M716 266L700 257.5V274.5Z" />
        <text className={s.lab} x="722" y="258">
          Answer
        </text>
      </g>

      {/* --- Part 1: the shape of an agent --------------------------
          A model, and one decision after it. The tools arrive at the
          model as text, which is why the schema block feeds the model
          and not the loop. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="234" y="190" width="340" height="150" />

        <path className={s.thin} d="M240 200V340M420 200V340" />
        <path className={s.thin} d="M240 200H258M240 340H258M420 200H402M420 340H402" />
        <rect className={s.plate6} x="270" y="216" width="5" height="108" />
        <rect className={s.plate6} x="300" y="216" width="5" height="108" />
        <rect className={s.plate6} x="330" y="216" width="5" height="108" />
        <rect className={s.plate6} x="360" y="216" width="5" height="108" />
        <rect className={s.plate6} x="390" y="216" width="5" height="108" />

        <path className={s.flow} d="M520 226L560 266L520 306L480 266Z" />

        <text className={s.lab} x="240" y="192">
          Model
        </text>
        <text className={s.lab} x="560" y="330" textAnchor="middle">
          Stop, or call
        </text>
      </Bay>

      {/* --- Part 2: running the loop -------------------------------
          Dashed the whole way: this only happens if the model decides
          to call something. The ticks are the turns, the struck mark is
          a call that failed and came back as an input anyway, and the
          transcript underneath is what every turn re-reads. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="86" y="56" width="440" height="40" />
        <rect className={s.hit} x="104" y="344" width="330" height="90" />
        <rect className={s.hit} x="590" y="164" width="136" height="48" />

        <path className={s.cond} d="M520 226V76H400" />
        <path className={s.cond} d="M330 76H100V228" />
        <path className={s.head} d="M100 212L91.5 228H108.5Z" />
        <path className={s.thin} d="M300 66V86M262 66V86M186 66V86M148 66V86" />
        <path className={s.dropped} d="M214 66L234 86M234 66L214 86" />

        <rect className={s.thin} x="596" y="170" width="124" height="36" />
        <path className={s.hair} d="M608 184H704M608 196H668" />
        <path className={s.thin} d="M548 244L596 196" />

        <path className={s.thin} d="M100 298V362H110" />
        <rect className={s.thin} x="110" y="362" width="150" height="14" />
        <rect className={s.thin} x="110" y="384" width="172" height="14" />
        <rect className={s.thin} x="110" y="406" width="194" height="14" />

        <ellipse className={s.thin} cx="380" cy="386" rx="44" ry="12" />
        <path className={s.thin} d="M336 386V416M424 386V416" />
        <path className={s.thin} d="M336 416A44 12 0 0 0 424 416" />
        <path className={s.thin} d="M314 396H332" />

        <text className={s.lab} x="306" y="56" textAnchor="end">
          Turns
        </text>
        <text className={s.lab} x="160" y="112" textAnchor="middle">
          Failed call
        </text>
        <text className={s.lab} x="116" y="160">
          Tool result
        </text>
        <text className={s.lab} x="110" y="354">
          Transcript grows
        </text>
        <text className={s.lab} x="440" y="424">
          Memory after
        </text>
        <text className={s.lab} x="596" y="162">
          Step budget
        </text>
      </Bay>

      {/* --- Part 3: reaching outside -------------------------------
          One tool on the loop, one description of how every tool is
          listed and called, and the box they are all allowed to run in. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="284" y="40" width="180" height="140" />

        <path className={s.flow} d="M330 76L344 52H386L400 76L386 100H344Z" />
        <circle className={s.thin} cx="365" cy="76" r="8" />

        <path className={s.thin} d="M365 100V110" />
        <path className={s.thin} d="M300 110H430" />
        <path className={s.thin} d="M320 110V134M365 110V134M410 110V134" />
        <rect className={s.thin} x="296" y="134" width="48" height="26" />
        <rect className={s.thin} x="341" y="134" width="48" height="26" />
        <rect className={s.thin} x="386" y="134" width="48" height="26" />

        <path className={s.thin} d="M286 124H444M286 124V172M444 124V172M286 172H444" />

        <text className={s.lab} x="452" y="44">
          One protocol
        </text>
        <text className={s.lab} x="444" y="190" textAnchor="end">
          Sandbox
        </text>
      </Bay>

      {/* --- Part 4: running it at scale ----------------------------
          More of the same loop, a cost that grows with the square of
          the run rather than with the task, and the record that is the
          only evidence left when it finishes wrong without raising. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="560" y="336" width="220" height="100" />
        <rect className={s.hit} x="756" y="300" width="180" height="112" />
        <rect className={s.hit} x="940" y="226" width="248" height="56" />

        <path className={s.dropped} d="M620 350L654 380L620 410L586 380Z" />
        <path className={s.dropped} d="M700 350L734 380L700 410L666 380Z" />

        <circle className={s.dot} cx="640" cy="266" r="6" />
        <path className={s.obs} d="M640 276V300M640 300H756M756 300V330M640 300H940M940 300V266" />

        <path className={s.thin} d="M780 412V330M780 412H900" />
        <path className={s.flow} d="M786 408Q852 402 898 336" />
        <path className={s.thin} d="M780 386H788M780 360H788M806 412V404M840 412V404" />

        <rect className={s.thin} x="940" y="236" width="240" height="24" />
        <path className={s.thin} d="M984 236V260M1028 236V260M1072 236V260M1120 236V260" />

        <text className={s.lab} x="586" y="440">
          More agents
        </text>
        <text className={s.lab} x="908" y="340">
          Cost grows
        </text>
        <text className={s.lab} x="940" y="228">
          Trace
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={470} cy={340} lead="M484 332L508 300" dot={[510, 298]} />
        <Callout k={k} i={1} cx={62} cy={106} lead="M76 116L96 140" dot={[100, 143]} />
        <Callout k={k} i={2} cx={250} cy={110} lead="M266 116L292 130" dot={[294, 132]} />
        <Callout k={k} i={3} cx={556} cy={380} lead="M573 380H582" dot={[584, 380]} />
      </g>

      <Spark
        d="M132 266H240M420 266H480L520 226V76H100V228"
        dur="2.8s"
        delay="0.3s"
        len="0.08"
      />
    </svg>
  )
}

/* ============================================================
   5. Evals and Observability — the taps and the dial
   1200 x 470.
   ============================================================ */

function EvalsDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 470"
      className={s.detail}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <g className={s.spine}>
        <path className={s.flow} d="M40 70H1140" />
        <path className={s.head} d="M1156 70L1140 61.5V78.5Z" />
        <text className={s.lab} x="40" y="54">
          Live output
        </text>
      </g>

      {/* --- Part 1: why "looks good" is not a metric ---------------
          Real traffic tapped off the line and written down as cases.
          Your users already wrote the test set. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="100" y="76" width="140" height="180" />

        <circle className={s.dot} cx="160" cy="70" r="6" />
        <path className={s.obs} d="M160 80V140" />
        <rect className={s.thin} x="110" y="140" width="110" height="18" />
        <rect className={s.thin} x="110" y="164" width="110" height="18" />
        <rect className={s.thin} x="110" y="188" width="110" height="18" />
        <rect className={s.thin} x="110" y="212" width="110" height="18" />

        <text className={s.lab} x="176" y="112">
          From traffic
        </text>
        <text className={s.lab} x="110" y="252">
          Eval set
        </text>
      </Bay>

      {/* --- Part 2: judging the output -----------------------------
          The cheap exact check first, the model call only for what
          needs one, the judge's own report card, and the comparison
          that gets a cleaner answer than a rating. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="324" y="110" width="300" height="250" />

        <path className={s.thin} d="M220 148H320" />
        <path className={s.head} d="M326 148L318 143.5V152.5Z" />
        <path className={s.thin} d="M220 220H320" />
        <path className={s.head} d="M326 220L318 215.5V224.5Z" />

        <rect className={s.thin} x="330" y="124" width="110" height="44" />
        <path className={s.thin} d="M348 146L360 158L380 134" />

        <path className={s.thin} d="M330 196V282M440 196V282" />
        <path className={s.thin} d="M330 196H344M330 282H344M440 196H426M440 282H426" />
        <rect className={s.plate6} x="352" y="212" width="5" height="54" />
        <rect className={s.plate6} x="374" y="212" width="5" height="54" />
        <rect className={s.plate6} x="396" y="212" width="5" height="54" />
        <rect className={s.plate6} x="418" y="212" width="5" height="54" />

        <path className={s.thin} d="M385 282V316" />
        <rect className={s.thin} x="330" y="316" width="110" height="40" />
        <path className={s.hair} d="M342 330H428M342 342H400" />

        <path className={s.thin} d="M440 240H466" />
        <rect className={s.thin} x="470" y="196" width="44" height="30" />
        <rect className={s.thin} x="470" y="240" width="44" height="30" />
        <path className={s.thin} d="M514 211L550 226M514 255L550 240" />
        <circle className={s.thin} cx="566" cy="232" r="18" />
        <path className={s.thin} d="M556 226H576M556 238H576" />

        <path className={s.thin} d="M584 232H640" />
        <path className={s.thin} d="M640 232H740M640 224V240M740 224V240M712 222V242" />

        <text className={s.lab} x="330" y="116">
          Exact check
        </text>
        <text className={s.lab} x="330" y="188">
          Judge
        </text>
        <text className={s.lab} x="330" y="374">
          Check the judge
        </text>
        <text className={s.lab} x="470" y="188">
          A or B
        </text>
        <text className={s.lab} x="640" y="214">
          Score
        </text>
      </Bay>

      {/* --- Part 3: shipping a change ------------------------------
          The same set run before and after, compared before anything
          goes out — and the chart that says the model behind the API
          moved while the prompt stayed still. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="752" y="176" width="430" height="120" />
        <rect className={s.hit} x="752" y="336" width="240" height="90" />

        <path className={s.thin} d="M760 232H790M790 200V264M790 200H820M790 264H820" />
        <path className={s.thin} d="M820 200H930M820 192V208M930 192V208M896 190V210" />
        <path className={s.thin} d="M820 264H930M820 256V272M930 256V272M912 254V274" />
        <path className={s.thin} d="M930 200L968 232M930 264L968 232" />
        <circle className={s.thin} cx="984" cy="232" r="18" />
        <path className={s.thin} d="M974 226H994M974 238H994" />

        <path className={s.flow} d="M1002 232H1040" />
        <path className={s.head} d="M1056 232L1040 223.5V240.5Z" />
        <path
          className={s.thin}
          d="M1060 264H1150M1060 264V240M1082 264V248M1104 264V234M1126 264V222"
        />

        <path className={s.thin} d="M660 240V404H756" />
        <path className={s.thin} d="M760 344V412M760 412H954" />
        <path className={s.flow} d="M766 358L830 372L890 392L950 404" />
        <path className={s.thin} d="M760 372H768M798 412V404M868 412V404" />

        <text className={s.lab} x="814" y="186" textAnchor="end">
          Before
        </text>
        <text className={s.lab} x="814" y="290" textAnchor="end">
          After
        </text>
        <text className={s.lab} x="984" y="296" textAnchor="middle">
          Compare
        </text>
        <text className={s.lab} x="1060" y="290">
          Roll out
        </text>
        <text className={s.lab} x="860" y="436" textAnchor="middle">
          Drift
        </text>
      </Bay>

      {/* --- Part 4: watching it run --------------------------------
          One run recorded end to end, a line in it that must never be
          kept, and the two readings a correct answer can still fail. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="990" y="76" width="200" height="140" />
        <rect className={s.hit} x="978" y="330" width="212" height="120" />

        <circle className={s.dot} cx="1120" cy="70" r="6" />
        <path className={s.obs} d="M1120 80V110" />
        <rect className={s.thin} x="1000" y="110" width="180" height="24" />
        <path className={s.thin} d="M1040 110V134M1080 110V134M1120 110V134M1150 110V134" />

        <rect className={s.thin} x="1000" y="160" width="180" height="42" />
        <path className={s.hair} d="M1014 174H1160" />
        <path className={s.dropped} d="M1014 188H1092M1014 182L1092 194" />
        <path className={s.obs} d="M1090 134V160" />

        <path className={s.obs} d="M1180 202V340M1030 340H1180M1030 340V364M1130 340V364" />

        <path className={s.flow} d="M994 400A36 36 0 0 1 1066 400" />
        <path className={s.thin} d="M990 400H1070" />
        <path
          className={`${s.flow} ${s.needle}`}
          d="M1030 400L1054 374"
          style={{ transformOrigin: '1030px 400px' }}
        />
        <circle className={s.dot} cx="1030" cy="400" r="4" />

        <path className={s.flow} d="M1094 400A36 36 0 0 1 1166 400" />
        <path className={s.thin} d="M1090 400H1170" />
        <path
          className={`${s.flow} ${s.needle}`}
          d="M1130 400L1152 376"
          style={{ transformOrigin: '1130px 400px' }}
        />
        <circle className={s.dot} cx="1130" cy="400" r="4" />

        <text className={s.lab} x="1000" y="102">
          Trace
        </text>
        <text className={s.lab} x="1000" y="152">
          What to log
        </text>
        <text className={s.lab} x="1030" y="432" textAnchor="middle">
          Latency
        </text>
        <text className={s.lab} x="1130" y="432" textAnchor="middle">
          Cost
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={72} cy={190} lead="M89 190H106" dot={[108, 190]} />
        <Callout k={k} i={1} cx={296} cy={352} lead="M313 348L326 338" dot={[328, 336]} />
        <Callout k={k} i={2} cx={1000} cy={330} lead="M1010 314L1058 268" dot={[1060, 265]} />
        <Callout k={k} i={3} cx={900} cy={150} lead="M914 160L996 172" dot={[998, 174]} />
      </g>

      <Spark
        d="M40 70H160V140M220 220H330M440 240H514L566 232H740M760 232H790V200H930L968 232H1060"
        dur="2.8s"
        delay="0.3s"
        len="0.1"
      />
    </svg>
  )
}

/* ============================================================
   The five, keyed by course slug
   ============================================================ */

const DETAILS: Record<string, Detail> = {
  'prompt-engineering': {
    bays: 4,
    steps: [
      'A prompt goes in through a manifold with two ports: the system prompt, which is the frame, and the user turn, which is the job.',
      'A worked pair goes in with it, reasoning is given its own room, and one hard prompt is split into two checkable sub-calls and rejoined.',
      'It is cut into tokens.',
      'The answer is run more than once and the samples vote, then a valve checks the result against the contract the prompt asked for. A failure goes back as a retry; untrusted text is stopped by a guard at the inlet.',
      'A dotted tap watches the prompt itself: every version in git, a score off the harness, and a model reading that score to write the next candidate.',
    ],
    keyBoxes: [
      [10, 34, 42, 56],
      [268, 36, 42, 52],
    ],
    Drawing: PromptDetail,
  },
  rag: {
    bays: 4,
    steps: [
      'Content is pulled out of the source system, parsed, cut into chunks, and only then embedded into a vector.',
      'The vectors go into the corpus with an index over them, a metadata table beside them, and the permissions that have to travel with them. A new embedding model is a migration into the same store.',
      'A query is rewritten before it is used, run as keyword search and semantic search at once, and the two ranked lists fused.',
      'Candidates come back, the reranker strikes out the ones that do not survive, and the top few go up into the context window. If that was not enough, it searches again.',
      'One dotted tap reads two things: whether retrieval found the right passages at all, and whether the quoted span really appears where the answer said it did.',
    ],
    keyBoxes: [[80, 64, 48, 54]],
    Drawing: RagDetail,
  },
  llms: {
    bays: 4,
    steps: [
      'Three models on the inlet and one line leaving it: you pick one, and a dotted tap says a swap means re-testing, because a prompt does not transport.',
      'The request passes a rate limit and a meter, then crosses onto somebody else’s machine.',
      'Inside is a stack of frozen weights with attention running across the tokens within each layer, under a hard ceiling on what fits in the window.',
      'The model does not know the next token; it samples one out of a distribution, and the knobs on that are the ones providers are taking away.',
      'The same layers can sit in an enclosure you own instead — the same weights, your machine, subject to the licence.',
    ],
    keyBoxes: [[140, 40, 42, 44]],
    Drawing: LlmsDetail,
  },
  agents: {
    bays: 4,
    steps: [
      'Everything meets at the context window, runs through the model, and arrives at one decision: stop, or call something.',
      'If it calls, a dashed path goes out to a tool and the result comes back round. The ticks on the return are the turns, one of them is a call that failed and came back as an input anyway, and a step budget is what ends the run.',
      'The transcript grows underneath, because every turn re-reads all of it; what outlives the run goes to a store.',
      'The tool is described, listed and called through one protocol, and everything it can run sits inside a sandbox.',
      'More of the same loop runs beside it, the cost grows with the square of the run rather than with the task, and a trace is the only evidence left when it finishes wrong without raising.',
    ],
    keyBoxes: [[96, 12, 124, 66]],
    Drawing: AgentsDetail,
  },
  evals: {
    bays: 4,
    steps: [
      'A dotted tap on the live output writes real traffic down as an eval set.',
      'The cheap exact check runs first; only what needs a model call goes to a judge, which needs its own report card before its scores are trusted. Two answers compared against each other give a cleaner reading than a rating.',
      'The same set is run before and after a change and the two readings compared before anything rolls out — and a chart says whether the model behind the API moved while the prompt stayed still.',
      'One run is recorded end to end as a trace, one line of it is never kept, and two dials read what a correct answer can still fail on: latency and cost.',
    ],
    keyBoxes: [[236, 60, 44, 50]],
    Drawing: EvalsDetail,
  },
}

/** The detail for a course, or null when nobody has drawn one yet. */
export function getDetail(slug: string): Detail | null {
  return DETAILS[slug] ?? null
}
