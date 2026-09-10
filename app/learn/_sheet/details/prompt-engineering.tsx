import type { BayKey, Detail } from '../details'
import { Bay, Callout, Spark } from '../details'
import s from '../sheet.module.css'

/**
 * FIG. 2.1 — Prompt Engineering: the inlet manifold and the outlet
 * manifold, at the scale the general arrangement had no room for.
 *
 * FIG. 1 gives this course both ends of the request, and draws each end as
 * one object: a manifold in, a manifold out. A detail at a larger scale
 * has to show more of its subject than that, not the same two shapes
 * bigger — so everything the course teaches between those two ends is on
 * this sheet, in the order the request meets it:
 *
 *   two inlets           the system turn and the user turn, into one manifold
 *   the example pairs    an input beside the answer it should have got
 *   the split            one hard request cut into three checkable ones
 *   the loop below       thinking out loud, with the tokens it costs ticked off
 *   the boundary         untrusted text crossing into your app
 *   the fan of three     the same request sent more than once
 *   the vote             three answers reduced to one
 *   the valve            the check against the contract
 *   the return below     what fails the check goes round again
 *   the outlet manifold  what passes, in the shape that was demanded
 *   the dotted tap       every version of the prompt, kept and tested
 *
 * Same pens as FIG. 1 and the same meanings. Solid carries the request —
 * which is why the retry is solid: a second attempt really does carry the
 * request round again. Dashed is not used at all here, because nothing on
 * this sheet is a tool call and dashed means only that. Dotted watches and
 * carries nothing, and is used twice: the contract watching the valve
 * (checking a thing does not move it) and the version tap watching the
 * prompt.
 *
 * Two objects sit deliberately far from their own bay. The contract is
 * part 2's, but it is drawn over the far end of the sheet because that is
 * what it governs — the same argument FIG. 1 makes when it hangs one
 * course on both ends of the machine. The version stack is part 4's, and
 * hangs off the prompt rather than the answer, because that is what gets
 * versioned.
 *
 * Geometry is hand-authored in a 1200 x 428 viewBox — the house width, at
 * the aspect this composition wants. The page fixes height and lets width
 * follow, so the lettering here lands at the same size as its siblings.
 */

function PromptDetail({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 428"
      className={s.detail}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* The axis, between the objects that belong to a part. */}
      <g className={s.spine}>
        <path className={s.flow} d="M333 213H363" />
        <path className={s.flow} d="M643 213H720" />
      </g>

      {/* --- Part 1: how instructions land ---------------------------
          Two inlets, not one. The system turn sets the frame and the user
          turn carries the job; they are separate ducts into the same
          manifold, which is the whole of that lesson in one shape. The
          worked example pairs join between them: an input, and the answer
          it should have got. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="11" y="27" width="333" height="333" />

        <rect className={s.flow} x="21" y="67" width="139" height="48" />
        <path className={s.thin} d="M37 85H139M37 101H123" />

        <rect className={s.flow} x="21" y="261" width="139" height="48" />
        <path className={s.thin} d="M37 280H139M37 296H117" />

        {/* Two example pairs. The left half is what came in, the right
            half is what should come back — kept ink, because an example
            is the answer being shown rather than described. */}
        <rect className={s.thin} x="21" y="149" width="53" height="24" />
        <rect className={s.kept} x="101" y="149" width="53" height="24" />
        <path className={s.thin} d="M75 161H93" />
        <path className={s.head} d="M101 161L93 156V166Z" />

        <rect className={s.thin} x="21" y="189" width="53" height="24" />
        <rect className={s.kept} x="101" y="189" width="53" height="24" />
        <path className={s.thin} d="M75 201H93" />
        <path className={s.head} d="M101 201L93 196V206Z" />

        <path className={s.thin} d="M155 161H192M155 201H192M192 161V201M192 181H227" />

        {/* The manifold: the two turns and the examples, gathered. */}
        <path className={s.flow} d="M160 91H227M160 285H227" />
        <path className={s.flow} d="M227 91V285" />
        <path className={s.flow} d="M227 91L333 205M227 285L333 221" />

        <text className={s.lab} x="21" y="56">
          System turn
        </text>
        <text className={s.lab} x="21" y="140">
          Examples
        </text>
        <text className={s.lab} x="21" y="339">
          User turn
        </text>
      </Bay>

      {/* --- Part 2: techniques that hold up -------------------------
          Decomposition splits one line into three and rejoins them.
          Thinking out loud is a loop under the axis with the tokens it
          costs ticked off beneath it. The contract is drawn as a template
          over the far end of the sheet, watching the valve that checks
          against it — dotted, because checking a thing does not move it
          anywhere. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="349" y="88" width="200" height="219" />
        <rect className={s.hit} x="523" y="200" width="133" height="128" />
        <rect className={s.hit} x="928" y="13" width="179" height="120" />

        <path className={s.thin} d="M363 139V288" />
        <path className={s.thin} d="M363 139H387M363 213H387M363 288H387" />

        <rect className={s.thin} x="387" y="121" width="91" height="35" />
        <path className={s.thin} d="M400 132H464M400 145H448" />
        <rect className={s.thin} x="387" y="196" width="91" height="35" />
        <path className={s.thin} d="M400 207H464M400 220H448" />
        <rect className={s.thin} x="387" y="271" width="91" height="35" />
        <path className={s.thin} d="M400 281H464M400 295H448" />

        <path className={s.thin} d="M477 139H501M477 213H501M477 288H501" />
        <path className={s.thin} d="M501 139V288" />
        <path className={s.flow} d="M501 213H560" />

        {/* The detour. The axis is genuinely broken between 420 and 482:
            the request goes down, along and back up, which is the point —
            it takes the long way round before it answers. */}
        <path className={s.flow} d="M560 213V301H643V235" />
        <path className={s.head} d="M643 213L632 235H654Z" />
        <path className={s.thin} d="M552 301V315M568 301V315M584 301V315M600 301V315M616 301V315" />

        {/* The contract, drawn as a template rather than a box: two
            bracket corners round the shape the answer has to arrive in. */}
        <path className={s.thin} d="M955 40H933V120H955M1072 40H1093V120H1072" />
        <path className={s.thin} d="M949 61H1077M965 80H1061M965 99H1040" />
        <path className={s.obs} d="M947 128L931 176" />
        <circle className={s.dot} cx="928" cy="181" r="3.5" />

        <text className={s.lab} x="363" y="109">
          Decomposition
        </text>
        <text className={s.lab} x="651" y="339" textAnchor="end">
          Thinking out loud
        </text>
        <text className={s.lab} x="933" y="29">
          Contract
        </text>
      </Bay>

      {/* --- Part 3: making it reliable ------------------------------
          A boundary with untrusted text coming over it, the same request
          sent three times, a vote, the valve that checks the winner, and
          the return line for what the valve rejects. The return is solid,
          not dashed: a retry carries the request round again, and dashed
          means one thing on these sheets. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="621" y="13" width="307" height="80" />
        <rect className={s.hit} x="693" y="133" width="453" height="187" />
        <rect className={s.hit} x="693" y="320" width="267" height="59" />

        <path className={s.thin} d="M621 85H917" />
        <rect className={s.thin} x="635" y="32" width="133" height="37" />
        <path className={s.thin} d="M651 45H752M651 59H720" />
        <path className={s.flow} d="M677 69V192" />
        <path className={s.head} d="M677 213L666 191H688Z" />

        {/* The same request, sent three times over. */}
        <path className={s.flow} d="M720 213L773 157M720 213H773M720 213L773 269" />
        <rect className={s.kept} x="773" y="141" width="48" height="32" />
        <rect className={s.kept} x="773" y="197" width="48" height="32" />
        <rect className={s.kept} x="773" y="253" width="48" height="32" />

        <path className={s.thin} d="M821 157L856 200M821 213H851M821 269L856 227" />
        <circle className={s.flow} cx="869" cy="213" r="19" />
        <path className={s.thin} d="M861 205V221M869 205V221M877 205V221" />
        <path className={s.flow} d="M888 213H923" />

        {/* The valve. */}
        <path className={s.thin} d="M923 184V243L976 213Z" />
        <path className={s.thin} d="M976 184V243L923 213Z" />

        {/* Rejected, and sent round again. */}
        <path className={s.flow} d="M976 243V349H720V235" />
        <path className={s.head} d="M720 213L709 235H731Z" />

        {/* What passes, leaving through the outlet manifold — the inlet
            reflected, as FIG. 1 draws it. */}
        <path className={s.flow} d="M976 213H1003" />
        <path className={s.head} d="M1024 213L1002 202V224Z" />
        <path className={s.flow} d="M1024 213L1117 149M1024 213L1117 277M1117 149V277" />
        <path className={s.thin} d="M1056 179H1104M1048 213H1109M1056 248H1101" />

        <text className={s.lab} x="635" y="24">
          Untrusted text
        </text>
        <text className={s.lab} x="917" y="107" textAnchor="end">
          Your app
        </text>
        <text className={s.lab} x="773" y="312">
          Samples
        </text>
        <text className={s.lab} x="869" y="256" textAnchor="middle">
          Vote
        </text>
        <text className={s.lab} x="832" y="376" textAnchor="middle">
          Retry
        </text>
        <text className={s.lab} x="1104" y="304" textAnchor="end">
          Output
        </text>
      </Bay>

      {/* --- Part 4: keeping it working ------------------------------
          A dotted tap on the prompt itself, down to the versions that are
          kept and tested, and the model that writes the next one. Dotted,
          because the tap watches: the prompt does not travel this way. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="200" y="328" width="387" height="91" />

        <circle className={s.dot} cx="344" cy="213" r="6" />
        <path className={s.obs} d="M344 224V352" />

        <rect className={s.thin} x="267" y="352" width="155" height="19" />
        <rect className={s.thin} x="267" y="376" width="155" height="19" />
        <rect className={s.thin} x="267" y="400" width="155" height="19" />

        <rect className={s.thin} x="448" y="360" width="123" height="43" />
        <rect className={s.plate6} x="469" y="371" width="7" height="21" />
        <rect className={s.plate6} x="491" y="371" width="7" height="21" />
        <rect className={s.plate6} x="512" y="371" width="7" height="21" />
        <path className={s.thin} d="M448 381H429" />
        <path className={s.head} d="M421 381L429 376V386Z" />

        <text className={s.lab} x="253" y="408" textAnchor="end">
          Versions
        </text>
        <text className={s.lab} x="581" y="387">
          Model-written
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={248} cy={45} lead="M241 64L229 85" dot={[227, 91]} />
        <Callout k={k} i={1} cx={315} cy={64} lead="M333 77L357 131" dot={[360, 135]} />
        <Callout k={k} i={2} cx={1157} cy={328} lead="M1147 312L1120 280" dot={[1117, 277]} />
        <Callout k={k} i={3} cx={227} cy={352} lead="M245 357L261 361" dot={[267, 361]} />
      </g>

      <Spark d="M160 91H227L333 213H560V301H643V213H1024L1117 277" dur="2.4s" delay="0.25s" />
    </svg>
  )
}

export const detail: Detail = {
  bays: 4,
  steps: [
    'Two inlets meet at one manifold: the system turn sets the frame, the user turn carries the job.',
    'Two worked example pairs join them — what went in, beside the answer it should have got.',
    'One hard request is split into three smaller ones, which rejoin.',
    'A loop under the line is the model thinking out loud; the ticks beneath it are the tokens that costs.',
    'Untrusted text crosses the boundary into your app — the point where an injection gets in.',
    'The same request is sent three times, and the three answers are voted down to one.',
    'A valve checks the winner against the contract, which watches from above and carries nothing.',
    'What fails the check goes back round the bottom line and is asked again.',
    'What passes leaves through the outlet manifold, in the shape the contract demanded.',
    'A dotted tap watches the prompt itself: every version is kept and tested, and a model writes the next one.',
  ],
  keyBoxes: [
    [10, 34, 42, 56],
    [268, 36, 42, 52],
  ],
  Drawing: PromptDetail,
}
