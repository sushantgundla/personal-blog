import type { CSSProperties } from 'react'
import type { BayKey, Detail } from '../details'
import { Bay, Callout, Spark } from '../details'
import s from '../sheet.module.css'

/**
 * FIG. 2/2 — RAG, the retrieval branch of FIG. 1 blown up.
 *
 * On the general arrangement this course is a corpus, a fan of candidates,
 * a struck-out pair and a top-k line going up. That is the whole subject
 * seen from across the room. At this scale the sheet has to show the
 * machine that produces those four marks, so it is drawn as two bands and
 * a store between them:
 *
 *   the top band     ingestion, left to right — a source system, a parser,
 *                    a chunker, the chunks, the model that embeds one, and
 *                    the vector that comes out of it
 *   the store        a cylinder with the index drawn inside it, a chunk
 *                    carrying its permissions in on the left, and a
 *                    metadata gate on the outlet
 *   the bottom band  the query, left to right — rewritten, split into a
 *                    keyword search and a semantic search that both read
 *                    the same store, fanned into candidates, read by the
 *                    reranker, and up into the context window
 *
 * and two returns that close it: a citation running from the context
 * window back to the chunk it came from, and the search-again path from
 * the top-k line back to query rewriting.
 *
 * Same pens, same meanings as FIG. 1's title strip. Solid carries the
 * request. Dashed is not on this sheet at all, because nothing here is
 * conditional on the model calling a tool. Dotted watches and carries
 * nothing — which is exactly what a citation is: a reference back to a
 * chunk, not a path the answer travels. Thin is detail, and the query
 * side is drawn thin for the same reason FIG. 1 draws its query line
 * thin. Hair is texture, and the only hair on the sheet is the index.
 *
 * The search-again return is thin and headed rather than dashed. It does
 * carry the request, so it cannot be dotted, and dashed already means one
 * thing on this publication.
 *
 * Geometry is hand-authored in a 1200 x 520 viewBox — the house width, like
 * all five, and the third tallest of them, because this is the
 * seventeen-lesson course and it has a lot to show. Nothing is assembled
 * from library shapes: every junction, tooth and lattice line is placed.
 */

/** The index inside the store. Points with edges between them: the graph an
 *  approximate search walks instead of reading every vector. */
const INDEX_NODES: [number, number][] = [
  [592, 244],
  [622, 264],
  [656, 232],
  [698, 262],
  [600, 292],
  [682, 296],
]

const INDEX_EDGES =
  'M592 244L622 264L656 232L698 262L600 292L592 244M622 264L682 296L698 262M600 292L682 296M656 232L682 296'

/**
 * The loop, and the longest of the five, because this sheet has the most to
 * say: the corpus is built before a question is asked, the question is
 * asked, and on some runs it is asked again. OTHER is two laps, for that
 * last one. The needle on the recall dial is hung off the same cycle — see
 * the note where it is drawn.
 */
const CYCLE = 10
const OTHER = CYCLE * 2

function RagDrawing({ k }: { k: BayKey }) {
  return (
    <svg
      viewBox="0 0 1200 520"
      className={s.detail}
      focusable="false"
      role="presentation"
      style={{ '--pl-cycle': `${CYCLE}s` } as CSSProperties}
    >
      {/* ---- The spine: the query arriving, and the context window ------
          Everything a reader needs to place this sheet on FIG. 1. The
          request comes in bottom left as a question and leaves top right
          as a junction, which is the same junction FIG. 1 draws. */}
      <g className={s.spine} aria-hidden="true">
        <path className={s.flow} d="M30 412H84" />
        <path className={s.head} d="M100 412L84 403.5V420.5Z" />
        <text className={s.lab} x="30" y="396">
          Query
        </text>

        <circle className={s.flow} cx="1000" cy="90" r="26" />
        <path className={s.thin} d="M982 72L1018 108M982 108L1018 72" />
        <path className={s.head} d="M1000 116L991.5 132H1008.5Z" />
        <text className={s.lab} x="1034" y="96">
          Context window
        </text>
      </g>

      {/* ---- 1. Embeddings — how text becomes something searchable -----
          The band FIG. 1 had no corridor for at all: on the index the
          corpus simply exists. Here it is built, left to right. The
          chunks are drawn kept rather than thin, because a chunk is a
          unit that survives to be retrieved. */}
      <Bay k={k} i={0}>
        <rect className={s.hit} x="20" y="40" width="660" height="130" />

        {/* The source system. The content starts inside somebody else's
            product, which is where the work actually is. */}
        <rect className={s.thin} x="30" y="70" width="60" height="60" />
        <path className={s.thin} d="M42 88H78M42 100H70M42 112H78" />
        <path className={s.flow} d="M90 100H108" />
        <path className={s.head} d="M124 100L108 91.5V108.5Z" />

        {/* The parser: a wedge that narrows a page down to text. */}
        <path className={s.thin} d="M130 68V132L184 114V86Z" />
        <path className={s.flow} d="M184 100H200" />
        <path className={s.head} d="M216 100L200 91.5V108.5Z" />

        {/* The chunker: the document, and three cuts through it. */}
        <rect className={s.thin} x="222" y="86" width="104" height="28" />
        <path className={s.thin} d="M248 76V124M274 76V124M300 76V124" />
        <path className={s.flow} d="M326 100H342" />
        <path className={s.head} d="M358 100L342 91.5V108.5Z" />

        <rect className={s.kept} x="364" y="60" width="42" height="22" />
        <rect className={s.kept} x="364" y="90" width="42" height="22" />
        <rect className={s.kept} x="364" y="120" width="42" height="22" />

        {/* The embedding model: its own small machine, with the same
            plates the big one has, because that is what it is. */}
        <path className={s.flow} d="M406 101H422" />
        <path className={s.head} d="M438 101L422 92.5V109.5Z" />
        <path className={s.thin} d="M446 64V138M530 64V138" />
        <path className={s.thin} d="M446 64H460M446 138H460M530 64H516M530 138H516" />
        <rect className={s.plate6} x="464" y="78" width="5" height="46" />
        <rect className={s.plate6} x="480" y="78" width="5" height="46" />
        <rect className={s.plate6} x="496" y="78" width="5" height="46" />
        <rect className={s.plate6} x="512" y="78" width="5" height="46" />
        <path className={s.flow} d="M530 101H546" />
        <path className={s.head} d="M562 101L546 92.5V109.5Z" />

        {/* The vector. Components either side of zero, because they are
            signed — a row of bars all one way would be a histogram. */}
        <path className={s.thin} d="M566 101H646" />
        <path
          className={s.thin}
          d="M572 101V78M584 101V118M596 101V88M608 101V124M620 101V84M632 101V112M644 101V94"
        />

        {/* Into the store. */}
        <path className={s.flow} d="M646 101H666V166" />
        <path className={s.head} d="M666 182L657.5 166H674.5Z" />

        <text className={s.lab} x="30" y="58">
          Source system
        </text>
        <text className={s.lab} x="130" y="154">
          Parse
        </text>
        <text className={s.lab} x="364" y="52">
          Chunks
        </text>
        <text className={s.lab} x="446" y="52">
          Embedding model
        </text>
        <text className={s.lab} x="566" y="158">
          Vector
        </text>
      </Bay>

      {/* ---- 2. Storing vectors — the store, and what travels with a
          chunk into it ---------------------------------------------------
          FIG. 1 draws a corpus. A corpus is not a store: the store has an
          index inside it, it knows who may see each chunk, and it can be
          asked for a subset before anything semantic happens. All three
          are drawn. */}
      <Bay k={k} i={1}>
        <rect className={s.hit} x="440" y="182" width="300" height="190" />
        <rect className={s.hit} x="742" y="196" width="100" height="130" />

        <ellipse className={s.flow} cx="646" cy="200" rx="80" ry="18" />
        <path className={s.flow} d="M566 200V320M726 200V320" />
        <path className={s.flow} d="M566 320A80 18 0 0 0 726 320" />

        {/* The index: points, and the edges an approximate search walks
            instead of reading every vector in the store. */}
        <path className={s.hair} d={INDEX_EDGES} />
        {INDEX_NODES.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} className={s.dot} cx={cx} cy={cy} r={3} />
        ))}

        {/* A chunk arriving with its permissions attached — the tag is
            part of the chunk, not a check done later. */}
        <rect className={s.kept} x="452" y="236" width="48" height="26" />
        <path className={s.thin} d="M500 236L520 249L500 262" />
        <path className={s.thin} d="M520 249H550" />
        <path className={s.head} d="M566 249L550 240.5V257.5Z" />

        {/* The outlet, and the gate on it. The plate is in two pieces
            with one opening: a metadata filter is a narrowing of what may
            leave, and it happens before anything is ranked. */}
        <path className={s.flow} d="M726 250H860" />
        <path className={s.thin} d="M800 208V238M800 262V292M792 208H808M792 292H808" />

        <text className={s.lab} x="452" y="228">
          Permission
        </text>
        <text className={s.lab} x="612" y="316">
          Index
        </text>
        <text className={s.lab} x="566" y="364">
          Store
        </text>
        <text className={s.lab} x="772" y="316">
          Metadata
        </text>
      </Bay>

      {/* ---- 3. Retrieval — the query side ----------------------------
          The longest part of the longest course, and the one FIG. 1
          compresses hardest. Four objects it had no room for: the query
          being rewritten before it is used, the two searches running side
          by side on the same store, the reranker reading five passages,
          and the path back for when what came up was not enough. */}
      <Bay k={k} i={2}>
        <rect className={s.hit} x="96" y="340" width="330" height="140" />
        <rect className={s.hit} x="846" y="128" width="180" height="250" />

        {/* Rewriting: the question you were asked, and the question you
            actually search with. */}
        <rect className={s.thin} x="100" y="388" width="88" height="48" />
        <path className={s.thin} d="M114 406H174M114 420H156" />
        <path className={s.flow} d="M188 412H228" />
        <path className={s.head} d="M244 412L228 403.5V420.5Z" />

        {/* One query, two searches. */}
        <path className={s.thin} d="M248 378V446M248 378H300M248 446H300" />

        <path className={s.thin} d="M300 356H420V400H300Z" />
        <path className={s.thin} d="M312 372H408M312 386H386" />

        <path className={s.thin} d="M300 424H420V468H300Z" />
        <path className={s.hair} d="M322 438L348 452L374 436L400 456" />
        <circle className={s.dot} cx="322" cy="438" r="3" />
        <circle className={s.dot} cx="348" cy="452" r="3" />
        <circle className={s.dot} cx="374" cy="436" r="3" />
        <circle className={s.dot} cx="400" cy="456" r="3" />

        {/* Both read the same store, at two heights on the same wall. */}
        <path className={s.thin} d="M420 378H478V284H550" />
        <path className={s.head} d="M566 284L550 275.5V292.5Z" />
        <path className={s.thin} d="M420 446H522V312H550" />
        <path className={s.head} d="M566 312L550 303.5V320.5Z" />

        {/* Five candidates out of the gate. Two do not survive the
            reranker: struck through and drawn weak, never dashed. */}
        <path
          className={s.thin}
          d="M860 250L890 146M860 250L890 198M860 250H890M860 250L890 302M860 250L890 354"
        />
        <rect className={s.dropped} x="890" y="133" width="30" height="26" />
        <rect className={s.kept} x="890" y="185" width="30" height="26" />
        <rect className={s.kept} x="890" y="237" width="30" height="26" />
        <rect className={s.kept} x="890" y="289" width="30" height="26" />
        <rect className={s.dropped} x="890" y="341" width="30" height="26" />
        <path
          className={s.dropped}
          d="M890 133L920 159M920 133L890 159M890 341L920 367M920 341L890 367"
        />

        {/* The reranker: one blade across all five, because it reads them
            against the query rather than scoring each on its own. */}
        <path className={s.thin} d="M960 140V370" />
        <path className={s.dropped} d="M920 146H960M920 354H960" />
        <path className={s.thin} d="M920 198L1000 250M920 250H1000M920 302L1000 250" />
        <path className={s.flow} d="M1000 250V132" />

        {/* Not enough. Go back and ask differently. */}
        <path className={s.thin} d="M1000 250V490H144V452" />
        <path className={s.head} d="M144 436L135.5 452H152.5Z" />

        <text className={s.lab} x="100" y="380">
          Rewrite
        </text>
        <text className={s.lab} x="300" y="348">
          Keyword
        </text>
        <text className={s.lab} x="300" y="418">
          Semantic
        </text>
        <text className={s.lab} x="850" y="112">
          Candidates
        </text>
        <text className={s.lab} x="930" y="392" textAnchor="middle">
          Rerank
        </text>
        <text className={s.lab} x="1012" y="208">
          Top-k
        </text>
        <text className={s.lab} x="560" y="482">
          Search again
        </text>
      </Bay>

      {/* ---- 4. Proving it works --------------------------------------
          Two dotted lines, and neither carries the answer anywhere. The
          citation is a reference from the context window back to the
          chunk it was built from — the one line on the sheet that runs
          right to left through the whole machine. The tap on the top-k
          line reads whether retrieval found the right thing at all,
          which is measured on its own and never through the answer. */}
      <Bay k={k} i={3}>
        <rect className={s.hit} x="690" y="20" width="320" height="40" />
        <rect className={s.hit} x="1030" y="330" width="130" height="110" />

        <path className={s.obs} d="M1000 64V38H706V184" />
        <circle className={s.dot} cx="706" cy="186" r="4" />

        <circle className={s.dot} cx="1000" cy="180" r="6" />
        <path className={s.obs} d="M1008 180H1090V342" />

        <path className={s.flow} d="M1042 400A48 48 0 0 1 1138 400" />
        <path className={s.thin} d="M1038 400H1142" />
        <path
          className={s.thin}
          d="M1042 400H1052M1056 366L1063 373M1090 352V362M1124 366L1117 373M1138 400H1128"
        />
        {/* The needle settles as the top-k line reaches the context
            window — the last beat of the same request — and falls back
            through the rest beat so the next one has something to settle
            again. The query spark lands at 5.4s, and cv-swing finishes
            its rise 16% into the cycle, so the phase is 5.4 - 0.16 x 10. */}
        <path
          className={`${s.flow} ${s.needle}`}
          d="M1090 400L1118 366"
          style={
            { transformOrigin: '1090px 400px', '--pl-swing-at': '3.8s' } as CSSProperties
          }
        />
        <circle className={s.dot} cx="1090" cy="400" r="5" />

        <text className={s.lab} x="716" y="30">
          Citation
        </text>
        <text className={s.lab} x="1090" y="430" textAnchor="middle">
          Recall
        </text>
      </Bay>

      <g className={s.callouts}>
        <Callout k={k} i={0} cx={54} cy={200} lead="M58 186L72 137" dot={[73, 134]} />
        <Callout k={k} i={1} cx={830} cy={160} lead="M816 166L718 211" dot={[716, 212]} />
        <Callout k={k} i={2} cx={200} cy={330} lead="M215 335L296 359" dot={[300, 360]} />
        <Callout k={k} i={3} cx={660} cy={60} lead="M674 54L704 41" dot={[706, 40]} />
      </g>

      {/* ---- The request ---------------------------------------------
          Three sparks on one cycle, in the order the sheet is true in.
          The corpus is built first and the query is not asked until it
          is there, which is why the second sets off after the first has
          landed in the store rather than beside it. The third is the
          search-again path, and it is conditional — what came up was
          not enough — so it runs on every other lap.

          Neither dotted line is sparked. The citation and the recall tap
          watch and carry nothing, and a spark on either would say they
          carry something. */}
      <Spark
        d="M30 100H342M364 101H646M646 101H666V178"
        dur="2.4s"
        delay="0.2s"
        cycle={`${CYCLE}s`}
        len="0.1"
      />
      <Spark
        d="M30 412H228M248 446H300M420 446H522V312H550M726 250H860M890 250H1000V132"
        dur="2.7s"
        delay="2.7s"
        cycle={`${CYCLE}s`}
        len="0.09"
      />
      <Spark
        d="M1000 250V490H144V452"
        dur="2.9s"
        delay="5.4s"
        cycle={`${OTHER}s`}
      />
    </svg>
  )
}

export const detail: Detail = {
  bays: 4,
  steps: [
    'Before any question is asked, the corpus is built along the top: content is pulled out of the source system, parsed into text, cut into chunks, and one chunk at a time goes through the embedding model, which turns it into a vector.',
    'The vector drops into the store. Inside the store is an index — points with edges between them, which is what an approximate search walks instead of reading every vector.',
    'A chunk carries its permissions in with it, as a tag on the chunk rather than a check done later.',
    'A query comes in at the bottom left and is rewritten before it is used.',
    'The rewritten query splits in two: a keyword search and a semantic search, running side by side and reading the same store.',
    'On the way out, a gate narrows the results by their metadata, before anything is ranked.',
    'Five candidates fan out. The reranker is one blade across all five, because it reads them against the query rather than scoring each on its own. Two do not survive: they are struck through and drawn weak.',
    'The three that do converge into the top-k line and go up into the context window.',
    'If that was not enough, a line runs back from the top-k to the rewrite, and the query is asked again differently.',
    'A dotted line runs from the context window all the way back to the chunk the answer came from. That is the citation, and it carries nothing.',
    'A second dotted tap on the top-k line reads the dial: did retrieval find the right thing at all, measured on its own and never through the answer.',
  ],
  keyBoxes: [[80, 64, 48, 54]],
  Drawing: RagDrawing,
}
