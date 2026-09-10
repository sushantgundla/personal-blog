import type { CSSProperties } from 'react'
import type { BayKey, Detail } from '../details'
import { Bay, Callout, Spark } from '../details'
import s from '../sheet.module.css'

/**
 * FIG. 2/5 — Evals and Observability, at detail scale.
 *
 * FIG. 1 gives this course a tap and a dial: the output is watched, and
 * somebody reads a number off it. That is the whole of it there, and it is
 * as much as a general arrangement can carry. This sheet is the same
 * subject with the rest of it drawn in.
 *
 * Every other detail uses the dotted pen the way FIG. 1 does — once, as an
 * aside on somebody else's drawing. Here the dotted line is the drawing.
 * The machine runs across the top as a single solid line, three taps hang
 * off it, and everything below the taps is instrumentation: one bus they
 * all share, a set written down from what the bus saw, instruments that
 * read the set, a gate the readings have to pass, and a board of gauges on
 * a rail at the right hand end. Taps that all run back to a common board is
 * the discipline an instrumentation drawing has, and it is the one thing
 * this sheet can do that none of the other four can.
 *
 * The pens keep FIG. 1's meanings exactly. Solid carries the request — the
 * machine at the top, the replay through the judge, the line that ships.
 * Dotted watches and carries nothing: the three taps, the bus, the judge's
 * own check, everything the board reads. Dashed does not appear at all,
 * because nothing on this sheet only happens when the model calls a tool.
 * Thin is detail, hair is texture, and no fourth meaning is invented.
 *
 * Four bays, one per part of the course, and each bay is that part's
 * lessons drawn rather than listed:
 *
 *   1  a hopper sampling live traffic into an eval set — the set is a
 *      handful out of far more than you ever looked at, which is why five
 *      examples told you nothing, and the replay leaving it is marked
 *      Offline against the live taps above
 *   2  two instruments on the same replayed set: a two-position exact
 *      check and an LLM judge, which is a model, so it is drawn as one.
 *      Both readings meet at one dial, and a dotted tap takes the judge
 *      off to a second dial where its answers are checked against a
 *      human's on A-or-B pairs
 *   3  the same set run before a change and after it, the two readings
 *      compared, a gate they have to pass, the line that ships, and then
 *      a strip chart where the reading drifts on its own afterwards
 *   4  one run recorded end to end as a trace, with the field that is
 *      never logged struck out, and the tap carried on down a rail to
 *      three gauges: quality, latency and cost
 *
 * Geometry is hand-authored in a 1200 x 533 viewBox — the house width, and
 * the second tallest of the five, behind llms, because a board of gauges
 * needs a column to hang in.
 */
/**
 * The loop. A live request runs the top of the sheet, the set is replayed
 * to both instruments, and a change goes out past the gate; then a beat of
 * rest and it all happens again. Nothing on this sheet is conditional, so
 * there is no second cycle here. The score needle is hung off the same
 * number — see the note where it is drawn.
 */
const CYCLE = 8

function EvalsDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 533"
      className={s.detail}
      focusable="false"
      role="presentation"
      style={{ '--pl-cycle': `${CYCLE}s` } as CSSProperties}
    >
      {/* ---- The spine: the machine, and the line that watches it ------
          One solid line across the top is the whole machine of FIG. 1,
          reduced to the only thing this sheet needs from it: requests
          going through. Three taps hang off three different points, because
          evals do not only read the final answer, and all three run into
          one dotted bus. Nothing below that bus moves an answer anywhere. */}
      <g className={s.spine} aria-hidden="true">
        <path className={s.flow} d="M40 61H1128" />
        <path className={s.head} d="M1149 61L1128 50V72Z" />
        <text className={s.lab} x="40" y="37">
          Live requests
        </text>

        <circle className={s.dot} cx="227" cy="61" r="7" />
        <circle className={s.dot} cx="533" cy="61" r="7" />
        <circle className={s.dot} cx="880" cy="61" r="7" />
        <path className={s.obs} d="M227 72V133M533 72V133M880 72V133" />
        <path className={s.obs} d="M187 133H1053" />

        <text className={s.lab} x="243" y="104">
          Retrieval
        </text>
        <text className={s.lab} x="549" y="104">
          Model
        </text>
        <text className={s.lab} x="896" y="104">
          Output
        </text>
        <text className={s.lab} x="627" y="125">
          Watching only
        </text>
      </g>

      {/* ---- 1. Why "looks good" is not a metric -----------------------
          The bus turns down into a hopper. The mouth of the hopper is all
          of the traffic, drawn as hairlines because nobody is going to read
          it; what comes out of the spout is the handful of cases you keep.
          The eval set is that handful, ruled up as a table with a name and
          a case in every row, and the line leaving it is marked Offline —
          it runs before a stranger sees the output, unlike the taps above,
          which are reading a live system. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="35" y="139" width="315" height="240" />

        <path className={s.obs} d="M187 133V168" />

        <path
          className={s.hair}
          d="M85 149V163M93 149V163M101 149V163M109 149V163M117 149V163M125 149V163M133 149V163M141 149V163M149 149V163M157 149V163M165 149V163M173 149V163M181 149V163M189 149V163M197 149V163M205 149V163M213 149V163M221 149V163M229 149V163M237 149V163M245 149V163M253 149V163M261 149V163M269 149V163"
        />

        <path className={s.thin} d="M80 168H272M80 168L173 203M272 168L200 203M173 203H200" />
        <path className={s.thin} d="M187 203V211" />

        <rect className={s.thin} x="59" y="211" width="235" height="136" />
        <path
          className={s.thin}
          d="M59 234H294M59 257H294M59 279H294M59 302H294M59 325H294M101 211V347"
        />
        <path
          className={s.hair}
          d="M72 223H91M117 223H253M72 245H91M117 245H227M72 268H91M117 268H264M72 291H91M117 291H216M72 313H91M117 313H248M72 336H91M117 336H235"
        />

        <path className={s.flow} d="M293 279H379" />
        <path className={s.head} d="M400 279L379 267V290Z" />

        <text className={s.lab} x="133" y="376">
          Eval set
        </text>
        <text className={s.lab} x="293" y="261">
          Offline
        </text>
      </Bay>

      {/* ---- 2. Judging the output -------------------------------------
          The replayed set arrives at a riser and splits to two instruments
          that are deliberately not the same instrument. The exact check has
          two stops and a needle lying hard against one of them: it passed
          or it did not, and it cost nothing to ask. The judge is a model,
          so it is drawn as one — the same enclosure and plates the LLMs
          detail uses — and a model gives you a reading on a scale rather
          than a verdict. Both converge on one dial.

          Then the thing that makes a judge trustworthy rather than merely
          convenient: a dotted tap takes the judge off to a second, smaller
          dial, where its answers on the same A-or-B pairs are compared with
          a human's. A judge is a model too, and it gets marked as well. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="389" y="147" width="488" height="240" />

        <path className={s.thin} d="M400 189V301" />

        {/* The exact check: two stops, and a needle hard against one. */}
        <path className={s.thin} d="M400 189H435" />
        <rect className={s.thin} x="435" y="163" width="101" height="53" />
        <path className={s.thin} d="M448 203H523M453 203V192M517 203V192M485 203L515 193" />
        <circle className={s.dot} cx="485" cy="203" r="4" />
        <text className={s.lab} x="549" y="179">
          Exact check
        </text>

        {/* The judge, drawn as what it is. */}
        <path className={s.thin} d="M400 301H421" />
        <path
          className={s.thin}
          d="M421 267V336M523 267V336M421 267H440M421 336H440M523 267H504M523 336H504"
        />
        <rect className={s.plate6} x="435" y="277" width="7" height="48" />
        <rect className={s.plate6} x="453" y="277" width="7" height="48" />
        <rect className={s.plate6} x="472" y="277" width="7" height="48" />
        <rect className={s.plate6} x="491" y="277" width="7" height="48" />
        <text className={s.lab} x="421" y="256">
          LLM judge
        </text>

        {/* Both readings converge on one dial. */}
        <path className={s.thin} d="M536 189H581L617 320M523 301H581L617 320" />
        <path className={s.thin} d="M617 320H717" />
        <path className={s.flow} d="M622 320A45 45 0 0 1 712 320" />
        <path
          className={s.thin}
          d="M622 320H634M635 288L644 297M667 275V287M699 288L690 297M712 320H700"
        />
        {/* The score settles as the last of the two readings reaches it,
            and falls back through the rest beat so the next replay has
            something to settle again. The exact check's spark lands at
            4.1s, and cv-swing finishes its rise 16% into the cycle, so
            the phase is 4.1 - 0.16 x 8. */}
        <path
          className={`${s.flow} ${s.needle}`}
          d="M667 320L694 285"
          style={
            { transformOrigin: '667px 320px', '--pl-swing-at': '2.82s' } as CSSProperties
          }
        />
        <circle className={s.dot} cx="667" cy="320" r="5" />
        <text className={s.lab} x="667" y="355" textAnchor="middle">
          Score
        </text>

        {/* The judge's own report card. */}
        <text className={s.lab} x="805" y="251" textAnchor="middle">
          Judge check
        </text>
        <rect className={s.thin} x="773" y="261" width="35" height="37" />
        <rect className={s.thin} x="819" y="261" width="35" height="37" />
        <text className={s.lab} x="791" y="285" textAnchor="middle">
          A
        </text>
        <text className={s.lab} x="836" y="285" textAnchor="middle">
          B
        </text>
        <path className={s.thin} d="M791 298V309H836V298M813 309V325" />

        <path className={s.thin} d="M778 360H848" />
        <path className={s.flow} d="M778 360A35 35 0 0 1 848 360" />
        <path
          className={s.thin}
          d="M778 360H787M788 335L795 342M813 325V334M838 335L831 342M848 360H839"
        />
        <path className={s.thin} d="M813 360L834 337" />
        <circle className={s.dot} cx="813" cy="360" r="5" />

        <path className={s.obs} d="M515 336V381H867V360H848" />
      </Bay>

      {/* ---- 3. Shipping a change --------------------------------------
          The same set again, run twice: once on what is live and once on
          the change. Two scales with a marker each, converging on a
          comparator, and what comes out of the comparator meets a gate.
          The gate is drawn as a gate — the change passes it or it does not
          go out. Past it the line is solid, because a shipped change is
          carrying requests again.

          And then the reading moves on its own. The strip chart after the
          gate is fed by a dotted line, not a solid one: nobody changed
          anything, the model underneath did, and the trace walks down
          across its own threshold while you are not looking. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="40" y="389" width="843" height="139" />

        <path className={s.thin} d="M267 347V395M200 395H267M200 395V488" />

        <path className={s.thin} d="M200 429H373M200 419V440M373 419V440M283 416V443" />
        <path className={s.thin} d="M200 488H373M200 477V499M373 477V499M320 475V501" />
        <text className={s.lab} x="200" y="461">
          Before
        </text>
        <text className={s.lab} x="200" y="520">
          After
        </text>

        <path className={s.thin} d="M373 429L490 449M373 488L490 469" />
        <circle className={s.thin} cx="512" cy="459" r="24" />
        <path className={s.thin} d="M499 451H525M499 467H525" />

        <path className={s.thin} d="M536 459H587" />
        <path className={s.thin} d="M587 440L621 459L587 477ZM656 440L621 459L656 477Z" />
        <text className={s.lab} x="621" y="424" textAnchor="middle">
          Regression gate
        </text>

        <path className={s.flow} d="M656 459H725" />
        <path className={s.head} d="M747 459L725 448V470Z" />
        <text className={s.lab} x="675" y="488">
          Ship
        </text>

        <path className={s.obs} d="M755 459H779" />
        <rect className={s.thin} x="779" y="413" width="96" height="75" />
        <path className={s.hair} d="M779 440H875" />
        <path className={s.thin} d="M784 424L805 429L827 440L848 459L869 477" />
        <text className={s.lab} x="827" y="509" textAnchor="middle">
          Drift
        </text>
      </Bay>

      {/* ---- 4. Watching it run ----------------------------------------
          The output tap does not stop at a number. It lands on a trace: one
          run recorded end to end, its steps drawn as bars against a time
          axis, each starting after the one above it began. The third bar is
          struck out and drawn weak — that field was seen and deliberately
          not written down.

          The same tap carries on down the left of the column, turns into
          the rail the board is mounted on, and feeds three gauges. Quality
          is the one everybody draws. Latency and cost are the two that get
          left off, and a correct answer that takes nine seconds and burns a
          fortune is still a problem, so all three are the same size and
          hang off the same rail. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="883" y="139" width="312" height="387" />

        <path className={s.obs} d="M1053 133V200" />
        <text className={s.lab} x="1064" y="173">
          Live
        </text>

        <path className={s.thin} d="M901 200H1131" />
        <text className={s.lab} x="920" y="189">
          One run
        </text>

        <rect className={s.thin} x="920" y="211" width="72" height="16" />
        <rect className={s.thin} x="939" y="235" width="101" height="16" />
        <rect className={s.dropped} x="965" y="259" width="59" height="16" />
        <path className={s.dropped} d="M965 259L1024 275M1024 259L965 275" />
        <rect className={s.thin} x="984" y="283" width="117" height="16" />
        <text className={s.lab} x="1035" y="272">
          Not logged
        </text>

        {/* The tap carried on down, and the rail the board hangs off. */}
        <path className={s.obs} d="M901 200V320" />
        <path className={s.thin} d="M901 320V512" />
        <path className={s.obs} d="M901 357H928M901 427H928M901 496H928" />

        <path className={s.thin} d="M928 357H992" />
        <path className={s.flow} d="M928 357A32 32 0 0 1 992 357" />
        <path
          className={s.thin}
          d="M928 357H938M937 334L943 340M960 325V335M983 334L977 340M992 357H982"
        />
        <path className={s.thin} d="M960 357L981 333" />
        <circle className={s.dot} cx="960" cy="357" r="5" />
        <text className={s.lab} x="1003" y="362">
          Quality
        </text>

        <path className={s.thin} d="M928 427H992" />
        <path className={s.flow} d="M928 427A32 32 0 0 1 992 427" />
        <path
          className={s.thin}
          d="M928 427H938M937 404L943 410M960 395V405M983 404L977 410M992 427H982"
        />
        <path className={s.thin} d="M960 427L965 396" />
        <circle className={s.dot} cx="960" cy="427" r="5" />
        <text className={s.lab} x="1003" y="432">
          Latency
        </text>

        <path className={s.thin} d="M928 496H992" />
        <path className={s.flow} d="M928 496A32 32 0 0 1 992 496" />
        <path
          className={s.thin}
          d="M928 496H938M937 473L943 479M960 464V474M983 473L977 479M992 496H982"
        />
        <path className={s.thin} d="M960 496L941 471" />
        <circle className={s.dot} cx="960" cy="496" r="5" />
        <text className={s.lab} x="1003" y="501">
          Cost
        </text>
      </Bay>

      {/* ---- Callouts --------------------------------------------------
          One ring per bay, each in clear air, each with a leader that
          crosses nothing. The same four numbers head the four columns of
          the schedule below. */}
      <g className={s.callouts}>
        <Callout k={k} i={0} cx={48} cy={381} lead="M64 369L85 349" dot={[88, 347]} />
        <Callout k={k} i={1} cx={360} cy={368} lead="M375 360L417 338" dot={[420, 336]} />
        <Callout k={k} i={2} cx={48} cy={459} lead="M68 459H192" dot={[195, 459]} />
        <Callout k={k} i={3} cx={1168} cy={200} lead="M1148 200H1135" dot={[1131, 200]} />
      </g>

      {/* ---- The request -----------------------------------------------
          Four sparks on one cycle, in the order the sheet is true in. The
          live request runs the top first, because everything below reads
          what it left behind. Then the replayed set arrives at the riser
          and splits to both instruments — two sparks, because the whole
          point of that bay is that they are not the same instrument — and
          both converge on the score dial, whose needle settles as the
          second of them lands. Last, along the bottom, the before run
          reaches the comparator, passes the gate and ships.

          None of the dotted lines is sparked, on the one sheet where the
          dotted line is the subject. They watch and carry nothing, and a
          spark on the bus or a tap would say the opposite. */}
      <Spark
        d="M40 61H1128"
        dur="3.2s"
        delay="0.2s"
        cycle={`${CYCLE}s`}
        len="0.064"
      />
      <Spark
        d="M293 279H400V301H421M523 301H581L617 320"
        dur="1s"
        delay="2.9s"
        cycle={`${CYCLE}s`}
        len="0.2"
      />
      <Spark
        d="M400 279V189H435M536 189H581L617 320"
        dur="0.9s"
        delay="3.2s"
        cycle={`${CYCLE}s`}
        len="0.23"
      />
      <Spark
        d="M267 347V395H200V429H373L490 449M536 459H725"
        dur="1.9s"
        delay="4.4s"
        cycle={`${CYCLE}s`}
        len="0.11"
      />
    </svg>
  )
}

export const detail: Detail = {
  bays: 4,
  steps: [
    'Live requests run across the top of the sheet. Three dotted taps hang off it — one at retrieval, one at the model, one at the output. A dotted line watches and carries nothing.',
    'The three taps run into one dotted line that feeds everything below.',
    'At the left it turns down into a hopper. The wide mouth is all your traffic; what drops out of the spout is the handful of cases you keep, ruled up as an eval set.',
    'The set is replayed offline, and splits to two instruments. The exact check has two stops and a needle against one of them: it passed or it did not. The judge is a model, drawn as one, and gives a reading on a scale.',
    'Both readings converge on one dial, the score.',
    'A dotted tap takes the judge off to a second, smaller dial, where its answers on A-or-B pairs are checked against a human’s.',
    'Along the bottom the same set is run before a change and after it. Two scales, a marker on each, meeting at a comparator.',
    'The difference has to pass a gate before anything ships. Past the gate the line is solid again.',
    'After it ships a dotted line keeps reading, onto a strip chart where the score drifts down across its own threshold on its own.',
    'At the right the output tap lands on a trace: one run end to end, its steps drawn as bars, with the field that is never logged struck out.',
    'The same tap carries on down a rail, and three gauges hang off it: quality, latency and cost.',
  ],
  keyBoxes: [[236, 60, 44, 50]],
  Drawing: EvalsDetail,
}
