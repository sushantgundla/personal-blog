import { Stage } from './Stage'
import type { StageDoors } from './stages'
import s from './plate.module.css'

/**
 * FIG. 1, drawn across. One request running left to right through the
 * machine that answers it, with the five courses hung on the five parts.
 *
 * Read it as a signal-flow drawing, because that is what it is:
 *
 *   the inlet manifold   a prompt goes in — system, then user
 *   the comb             it is cut into tokens
 *   the junction (+)     everything meets here: this is the context window
 *   the query line       the prompt goes back out as a search
 *   the branch below     a corpus, a fan of candidates, two kept, one line up
 *   the stack            the model — layers, with attention across each one
 *   the diamond          stop, or call a tool
 *   the loop above       out to a tool and back into the junction
 *   the outlet manifold  an answer comes out, in the shape asked for
 *   the gauge            the output is tapped, traced and scored
 *
 * Three line weights, and each means something. Solid carries the request.
 * Dashed happens only when the model decides to call a tool. Dotted watches
 * and carries nothing — the trace tap does not move the answer along. The
 * title strip states all three, so the notation is readable, not guessed.
 *
 * Stage 1 owns both manifolds. Prompt Engineering teaches the shape of the
 * answer as well as the shape of the question, so the drawing hangs the
 * course on both ends of the request; the arrowheads at each end stay on
 * the spine, because the spine is the request running and a stage is the
 * object it travels to.
 *
 * The drawing rests in one graphite, and colour is the answer to a
 * question: hover or focus a stage and that stage alone takes its course's
 * ink while the rest of the machine steps back. Every rule doing that lives
 * in plate.module.css and runs on :has(); nothing here is a client
 * component and this page ships no JavaScript of its own.
 *
 * The hover half of it is scoped to a device with a real pointer. A touch
 * browser synthesises hover on the first tap, and now that the parts are
 * links, an unscoped reveal spends the reader's first tap lighting the part
 * instead of opening the course. On a phone the drawing never lights up; the
 * five inked callout rings are what carry the tie to the legend there, and
 * they are inked at rest for exactly that reason.
 *
 * Each of the five parts is also the door into its course — see Stage.tsx,
 * which wraps the geometry below in the link and carries the accessible
 * name. So the sheet is no longer aria-hidden: it is role="presentation",
 * which says nothing itself and hides nothing inside it, every mark on it is
 * aria-hidden, and the five links are the only things in it a screen reader
 * meets. The ordered description in page.tsx still carries the structure.
 *
 * Two things the drawing deliberately does not carry, because there is no
 * clear corridor for either and the empty parts of this sheet are earned:
 * that everything joined at the junction is counted in tokens, and that
 * evals measure retrieval as well as the final answer. Both are stated in
 * words instead — in the legend's role lines, the notes band and the
 * screen-reader description in page.tsx.
 *
 * Geometry is hand-authored in a 1600 x 680 viewBox. It is not assembled
 * from library shapes and it is not generated: every junction, arrowhead
 * and lattice line is placed.
 */
export function MachineWide({ doors }: { doors: StageDoors }) {
  return (
    <svg viewBox="0 0 1600 680" className={s.wide} focusable="false" role="presentation">
      {/* ---- The spine: the parts that belong to no single course ------
          The axis the request runs along, the junction where everything
          is assembled, and the answer leaving. These dim a little under a
          stage highlight rather than going all the way back, so the
          highlighted part never floats free of the machine. */}
      <g className={s.spine} aria-hidden="true">
        <path className={s.flow} d="M200 300H502" />
        {/* Direction, stated at the inlet as well as the outlet — the two
            were 1200 units apart and only the far one said which way. */}
        <path className={s.head} d="M228 300L212 291.5V308.5Z" />
        <path className={s.flow} d="M558 300H654" />
        <path className={s.flow} d="M986 300H1086" />
        <path className={s.flow} d="M1154 300H1386" />

        {/* The summing junction. A circle with a cross in it is what a
            control drawing puts where several inputs become one. */}
        <circle className={s.flow} cx="530" cy="300" r="28" />
        <path className={s.thin} d="M511 281L549 319M511 319L549 281" />
        <text className={s.lab} x="500" y="352" textAnchor="end">
          Context window
        </text>

        {/* The request arriving. The manifold it arrives at belongs to
            stage 1, the same way the inlet head here belongs to the spine
            and the inlet manifold does not — the spine's job is the
            request running, and a stage owns the object at the end. */}
        <path className={s.head} d="M1402 300L1386 291.5V308.5Z" />
      </g>

      {/* ---- 1. Prompt Engineering — both ends of the request ---------
          The only stage that is two objects, at opposite ends of the sheet.
          Four of this course's twelve lessons are about what comes back —
          output contracts, validating it, retries and fallbacks, sampling
          and voting — so the shape of the answer is a prompt concern, not
          the model's. The model owns how a token gets chosen; the stack of
          layers already carries that. The two manifolds are mirror shapes
          and holding stage 1 lights both: you write this end, you specify
          that end. */}
      <Stage id="prompt-engineering" doors={doors}>
        <rect className={s.hit} x="44" y="200" width="396" height="180" />
        <rect className={s.hit} x="1404" y="210" width="148" height="158" />

        {/* The inlet manifold, and the prompt itself as lines of text. */}
        <path className={s.flow} d="M60 232V368" />
        <path className={s.flow} d="M60 232L200 283M60 368L200 317" />
        <path className={s.thin} d="M80 270H150M80 300H176M80 330H150" />

        {/* The comb. Fifteen teeth at a uniform pitch — the prompt stops
            being a sentence here and becomes a run of tokens. */}
        <path
          className={s.thin}
          d="M242 284V316M255 284V316M268 284V316M281 284V316M294 284V316M307 284V316M320 284V316M333 284V316M346 284V316M359 284V316M372 284V316M385 284V316M398 284V316M411 284V316M424 284V316"
        />

        <text className={s.lab} x="60" y="214">
          System + user
        </text>
        <text className={s.lab} x="424" y="266" textAnchor="end">
          Tokens
        </text>

        {/* The outlet manifold, and the answer as lines of text — the
            inlet's shape, reflected. */}
        <path className={s.flow} d="M1410 300L1544 242M1410 300L1544 358" />
        <path className={s.flow} d="M1544 242V358" />
        <path className={s.thin} d="M1472 282H1528M1472 300H1538M1472 318H1524" />
        <text className={s.lab} x="1544" y="228" textAnchor="end">
          Output
        </text>
      </Stage>

      {/* ---- 2. RAG — what gets fetched and stuffed in beside it ------- */}
      <Stage id="rag" doors={doors}>
        <rect className={s.hit} x="444" y="330" width="176" height="310" />

        {/* Retrieval starts at the prompt. Without this the candidates
            rise out of the corpus on their own and the drawing reads as a
            preload rather than a search. */}
        <path className={s.thin} d="M307 316V524H450" />
        <path className={s.head} d="M466 524L450 515.5V532.5Z" />
        <text className={s.lab} x="299" y="440" textAnchor="end">
          Query
        </text>

        {/* The corpus. */}
        <ellipse className={s.flow} cx="530" cy="524" rx="64" ry="16" />
        <path className={s.flow} d="M466 524V596M594 524V596" />
        <path className={s.flow} d="M466 596A64 16 0 0 0 594 596" />

        {/* Out of it, a fan of candidates. Two are kept, at the heavier of
            the fan's two weights; two are struck through and drawn weak,
            because reranking is what drops them. Struck and not dashed:
            dashed is spoken for on this sheet and means "only if the model
            calls a tool", and a fourth meaning may not be invented — see
            .dropped in plate.module.css. */}
        <path className={s.flow} d="M530 508V478" />
        <path
          className={s.thin}
          d="M530 478L470 442M530 478L510 442M530 478L550 442M530 478L590 442"
        />
        <rect className={s.dropped} x="457" y="406" width="26" height="34" />
        <rect className={s.kept} x="497" y="406" width="26" height="34" />
        <rect className={s.kept} x="537" y="406" width="26" height="34" />
        <rect className={s.dropped} x="577" y="406" width="26" height="34" />
        <path
          className={s.dropped}
          d="M457 406L483 440M483 406L457 440M577 406L603 440M603 406L577 440"
        />

        {/* The kept two converge, and go up into the junction. */}
        <path className={s.thin} d="M510 404L530 376M550 404L530 376" />
        <path className={s.flow} d="M530 376V342" />
        <path className={s.head} d="M530 330L521.5 346H538.5Z" />

        <text className={s.lab} x="530" y="634" textAnchor="middle">
          Corpus
        </text>
        <text className={s.lab} x="445" y="428" textAnchor="end">
          Candidates
        </text>
        <text className={s.lab} x="548" y="366">
          Top-k
        </text>
      </Stage>

      {/* ---- 3. LLMs — the thing in the middle -------------------------
          The heaviest object on the plate, because it is the heaviest
          thing in the machine: a stack of layers, each with attention
          running across the tokens inside it, in an enclosure with feet.
          The label says so, and so does the geometry below — nothing here
          crosses from one layer to the next. */}
      <Stage id="llms" doors={doors}>
        <rect className={s.hit} x="646" y="156" width="350" height="316" />

        <path className={s.thin} d="M654 176V424M986 176V424" />
        <path className={s.thin} d="M654 176H672M654 424H672M986 176H968M986 424H968" />

        {/* Attention. Every chord starts and ends on the same plate,
            because attention runs across the tokens inside one block — not
            from one block to the next. Straight lines between neighbouring
            plates said the opposite, and said it in the one place on the
            sheet where the reader is least equipped to catch it. */}
        <path
          className={s.hair}
          d="M696 214A56 56 0 0 1 696 286M696 270A98 98 0 0 1 696 374M696 330A41 41 0 0 1 696 386M740 206A41 41 0 0 1 740 262M740 240A98 98 0 0 1 740 344M740 312A56 56 0 0 1 740 384M784 222A56 56 0 0 1 784 294M784 280A41 41 0 0 1 784 336M784 318A56 56 0 0 1 784 392M828 210A98 98 0 0 1 828 314M828 268A41 41 0 0 1 828 324M828 340A41 41 0 0 1 828 396M872 218A56 56 0 0 1 872 290M872 250A98 98 0 0 1 872 354M872 298A56 56 0 0 1 872 372M916 204A56 56 0 0 1 916 276M916 262A98 98 0 0 1 916 366M916 334A41 41 0 0 1 916 390M960 216A56 56 0 0 1 960 288M960 276A41 41 0 0 1 960 332M960 300A98 98 0 0 1 960 404"
        />

        <rect className={s.plate6} x="690" y="196" width="6" height="208" />
        <rect className={s.plate6} x="734" y="196" width="6" height="208" />
        <rect className={s.plate6} x="778" y="196" width="6" height="208" />
        <rect className={s.plate6} x="822" y="196" width="6" height="208" />
        <rect className={s.plate6} x="866" y="196" width="6" height="208" />
        <rect className={s.plate6} x="910" y="196" width="6" height="208" />
        <rect className={s.plate6} x="954" y="196" width="6" height="208" />

        <text className={s.lab} x="654" y="164">
          Layers
        </text>
        <text className={s.lab} x="654" y="450">
          Attention within a layer
        </text>
      </Stage>

      {/* ---- 4. Agents and Tool Use — the loop out and back ------------
          Everything in this group is dashed. The loop is the one path in
          the machine that only happens sometimes. */}
      <Stage id="agents" doors={doors}>
        <rect className={s.hit} x="1068" y="258" width="110" height="90" />
        <rect className={s.hit} x="520" y="88" width="660" height="62" />

        <path className={s.flow} d="M1120 264L1156 300L1120 336L1084 300Z" />

        <path className={s.cond} d="M1120 264V120H856" />
        <path className={s.cond} d="M804 120H530V252" />
        <path className={s.head} d="M530 268L521.5 252H538.5Z" />

        {/* The tool, sitting on the return line. */}
        <path className={s.flow} d="M804 120L817 97.5H843L856 120L843 142.5H817Z" />
        <circle className={s.thin} cx="830" cy="120" r="6.5" />

        <text className={s.lab} x="830" y="80" textAnchor="middle">
          Tool call
        </text>
        <text className={s.lab} x="516" y="196" textAnchor="end">
          Tool result
        </text>
        <text className={s.lab} x="1120" y="368" textAnchor="middle">
          Stop, or call
        </text>
      </Stage>

      {/* ---- 5. Evals and Observability — was any of it any good ------
          A tap on the output line and a dial under it. The tap is dotted
          because it observes; it does not carry the answer anywhere. */}
      <Stage id="evals" doors={doors}>
        <rect className={s.hit} x="1274" y="284" width="34" height="180" />
        <rect className={s.hit} x="1206" y="462" width="170" height="112" />

        <circle className={s.dot} cx="1290" cy="300" r="7" />
        <path className={s.obs} d="M1290 310V462" />

        <path className={s.flow} d="M1226 530A64 64 0 0 1 1354 530" />
        <path className={s.thin} d="M1222 530H1358" />
        <path
          className={s.thin}
          d="M1226 530H1238M1244.8 484.8L1253.2 493.2M1290 466V478M1335.2 484.8L1326.8 493.2M1354 530H1342"
        />

        {/* The needle swings up to its reading as the request finishes —
            the last beat of the run, and then it falls back through the
            rest beat so the next request has something to settle again. */}
        <path className={`${s.flow} ${s.needle}`} d="M1290 530L1322 489" />
        <circle className={s.dot} cx="1290" cy="530" r="5" />

        <text className={s.lab} x="1302" y="398">
          Trace
        </text>
        <text className={s.lab} x="1290" y="558" textAnchor="middle">
          Score
        </text>
      </Stage>

      {/* ---- Callouts -------------------------------------------------
          A numbered ring and a leader to the part it names. The same five
          numbers head the five entries in the legend below, and the rings
          carry their course's ink at rest on every device — the reveal is
          scoped to a real pointer, so a reader with a finger never sees the
          drawing light up at all, and without the rings the tie between a
          part of the machine and a course would be invisible to them. The
          numeral inside stays graphite; see the note on .ring and section 7
          in plate.module.css. */}
      <g className={s.callouts} aria-hidden="true">
        <g className={s.callout} data-course="prompt-engineering">
          <path className={s.lead} d="M162 168L294 280" />
          <circle className={s.dot} cx="296" cy="282" r="3.5" />
          <circle className={s.ring} cx="150" cy="158" r="16" />
          <text className={s.num} x="150" y="164" textAnchor="middle">
            1
          </text>
        </g>

        <g className={s.callout} data-course="rag">
          <path className={s.lead} d="M382 560H458" />
          <circle className={s.dot} cx="462" cy="560" r="3.5" />
          <circle className={s.ring} cx="366" cy="560" r="16" />
          <text className={s.num} x="366" y="566" textAnchor="middle">
            2
          </text>
        </g>

        <g className={s.callout} data-course="llms">
          <path className={s.lead} d="M960 476V434" />
          <circle className={s.dot} cx="960" cy="430" r="3.5" />
          <circle className={s.ring} cx="960" cy="492" r="16" />
          <text className={s.num} x="960" y="498" textAnchor="middle">
            3
          </text>
        </g>

        <g className={s.callout} data-course="agents">
          <path className={s.lead} d="M1000 71L950 110" />
          <circle className={s.dot} cx="946" cy="113" r="3.5" />
          <circle className={s.ring} cx="1010" cy="58" r="16" />
          <text className={s.num} x="1010" y="64" textAnchor="middle">
            4
          </text>
        </g>

        <g className={s.callout} data-course="evals">
          <path className={s.lead} d="M1408 530H1362" />
          <circle className={s.dot} cx="1358" cy="530" r="3.5" />
          <circle className={s.ring} cx="1424" cy="530" r="16" />
          <text className={s.num} x="1424" y="536" textAnchor="middle">
            5
          </text>
        </g>
      </g>

      {/* ---- The request ----------------------------------------------
          One request runs the machine, the sheet rests, and the next one
          goes after it. Seven sparks on seven paths, and they are seven
          rather than three because the drawing is a journey and three
          sparks only showed three of its legs; what the loop has to
          carry is the whole order, or a reader who watches twice learns
          nothing the second time.

          The order below is the order it happens in, and the numbers
          are what make that true rather than the order of the JSX:

            0.15  the prompt in at the inlet, cut into tokens
            0.55  the query out to the corpus
            1.35  the passages back up into the junction
            1.95  the assembled context into the model
            2.25  the model running, out to the decision
            3.60  the tool loop, out and back — AFTER the model has
                  run, which is the whole meaning of the dashed weight
            4.65  the answer out at the outlet
            5.10  the needle settles, and that is the last beat

          The cycle is 7.5s. No spark is on the sheet after 5.15s; the
          needle holds its reading in silence until 6.8s and falls back
          to zero over the last of the cycle, so the only thing moving
          through the rest beat is one 40-unit line going quiet. The
          request runs for most of the loop and the pause is short on
          purpose — a drawing that rests longer than it works reads as
          broken rather than as calm.

          Three numbers per spark, all in seconds except the last:
          --pl-delay is when in the cycle it sets off, --pl-run how long
          it takes to cross its own path, and --pl-d its own length as a
          fraction of that path — worth setting per path, because 0.06
          of the 876-unit tool loop is a 53-unit mark and 0.06 of the
          96-unit run into the model is a speck. They are all about 44
          units long here, so the same request reads as the same size
          wherever it is on the sheet. The dash arithmetic that turns
          those three into a loop is section 6 of plate.module.css.

          Removed entirely under prefers-reduced-motion. */}
      <g className={s.sparks} aria-hidden="true">
        {/* In at the inlet, through the comb, to the junction. */}
        <path
          className={s.spark}
          d="M200 300H502"
          pathLength={1}
          style={
            { '--pl-delay': '0.15', '--pl-run': '1', '--pl-d': '0.15' } as React.CSSProperties
          }
        />
        {/* Out to the corpus as a query. It leaves from the comb, so it
            sets off as the request passes that tooth and not before. */}
        <path
          className={s.spark}
          d="M307 316V524H450"
          pathLength={1}
          style={
            { '--pl-delay': '0.55', '--pl-run': '0.8', '--pl-d': '0.13' } as React.CSSProperties
          }
        />
        {/* What came back: up out of the corpus, through the candidate
            the reranker kept, and into the junction from below. */}
        <path
          className={s.spark}
          d="M530 508V478L510 442V404L530 376V340"
          pathLength={1}
          style={
            { '--pl-delay': '1.35', '--pl-run': '0.5', '--pl-d': '0.18' } as React.CSSProperties
          }
        />
        {/* Assembled, and into the model. */}
        <path
          className={s.spark}
          d="M558 300H654"
          pathLength={1}
          style={
            { '--pl-delay': '1.95', '--pl-run': '0.3', '--pl-d': '0.28' } as React.CSSProperties
          }
        />
        {/* The model running: across all seven layers and out to the
            decision. The slowest leg on the sheet, 432 units against the
            96 it took to get here, because this is where the time in a
            request actually goes. */}
        <path
          className={s.spark}
          d="M654 300H1086"
          pathLength={1}
          style={
            { '--pl-delay': '2.25', '--pl-run': '1.25', '--pl-d': '0.1' } as React.CSSProperties
          }
        />
        {/* Out to the tool and back into the junction. It runs the dashed
            path and it runs it after the model, which is the drawing's
            one conditional saying when it is allowed to happen. */}
        <path
          className={s.spark}
          d="M1120 264V120H530V262"
          pathLength={1}
          style={
            { '--pl-delay': '3.6', '--pl-run': '0.95', '--pl-d': '0.05' } as React.CSSProperties
          }
        />
        {/* And out, past the trace tap, to the outlet manifold. */}
        <path
          className={s.spark}
          d="M1154 300H1386"
          pathLength={1}
          style={
            { '--pl-delay': '4.65', '--pl-run': '0.5', '--pl-d': '0.19' } as React.CSSProperties
          }
        />
      </g>
    </svg>
  )
}
