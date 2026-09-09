import s from './plate.module.css'

/**
 * FIG. 1, drawn down. The phone version, and a redraw rather than a shrink.
 *
 * A wide machine does not reflow, so this is authored separately in a
 * 360 x 1060 viewBox with the request running top to bottom: in at the top,
 * the comb, the junction with retrieval arriving from the right and the
 * tool result from the left, the stack of layers, the decision, the answer
 * out at the bottom, and the gauge tapping it.
 *
 * Two deliberate differences from the wide plate, both because 360px is
 * 360px:
 *
 *   - Every fine annotation is dropped. The wide drawing names tokens, the
 *     context window, top-k, layers, the tool call and the trace; here
 *     there is not room to set those without the words crowding the parts
 *     they point at. The five numbered callouts stay, because they are what
 *     ties the drawing to the legend, and the legend under it carries the
 *     names in full.
 *   - The stack turns with the flow. Layers are drawn across rather than
 *     down, so the model still reads as a run of plates the request passes
 *     through rather than a rotated copy of the wide one. The attention
 *     chords turn with it: both feet of every chord sit on one plate,
 *     because attention runs across the tokens inside a block.
 *
 * The query line runs down the far right, outside the reranker fan, and
 * turns into the side of the corpus. Nothing on this drawing crosses
 * anything else. Its arrowhead is smaller than the rest, because the corner
 * it turns is short and a full-size head on a thin line would swallow it.
 *
 * Same three line weights and the same meanings: solid carries the request,
 * dashed only happens if the model calls a tool, dotted watches.
 */
export function MachineNarrow() {
  return (
    <svg
      viewBox="0 0 360 1060"
      className={s.narrow}
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* ---- The spine ------------------------------------------------ */}
      <g className={s.spine}>
        <path className={s.flow} d="M180 118V134" />
        <path className={s.flow} d="M180 206V268" />

        <circle className={s.flow} cx="180" cy="290" r="24" />
        <path className={s.thin} d="M163 273L197 307M163 307L197 273" />

        <path className={s.flow} d="M180 314V380" />
        <path className={s.flow} d="M180 560V632" />
        <path className={s.flow} d="M180 688V752" />
        <path className={s.flow} d="M180 766V788" />

        <path className={s.head} d="M180 802L171.5 786H188.5Z" />
        <path className={s.flow} d="M180 810L116 888M180 810L244 888" />
        <path className={s.flow} d="M116 888H244" />
        <path className={s.thin} d="M158 842H202M148 860H212M134 878H226" />
      </g>

      {/* ---- 1. Prompt Engineering ------------------------------------ */}
      <g className={s.stage} data-line="prompt-engineering">
        <rect className={s.hit} x="80" y="30" width="200" height="190" />

        <path className={s.flow} d="M116 40H244" />
        <path className={s.flow} d="M116 40L180 118M244 40L180 118" />
        <path className={s.thin} d="M136 62H224M146 80H214M158 98H202" />

        <path
          className={s.thin}
          d="M162 134H198M162 143H198M162 152H198M162 161H198M162 170H198M162 179H198M162 188H198M162 197H198M162 206H198"
        />
      </g>

      {/* ---- 2. RAG --------------------------------------------------- */}
      <g className={s.stage} data-line="rag">
        <rect className={s.hit} x="248" y="294" width="112" height="200" />

        {/* Retrieval starts at the prompt, not at the corpus. */}
        <path className={s.thin} d="M198 152H350V470" />
        <path className={s.head} d="M342 470L353 464.5V475.5Z" />

        <ellipse className={s.flow} cx="304" cy="430" rx="38" ry="11" />
        <path className={s.flow} d="M266 430V474M342 430V474" />
        <path className={s.flow} d="M266 474A38 11 0 0 0 342 474" />

        {/* Four candidates out of the corpus, two kept and merged. The
            two the reranker drops are the faint pair, and they end
            where they are dropped. */}
        <path className={s.flow} d="M304 419V400" />
        <path className={s.dropped} d="M304 400L266 366M304 400L342 366" />
        <path className={s.kept} d="M304 400L288 366M304 400L320 366" />
        <path className={s.kept} d="M288 366L304 344M320 366L304 344" />
        <path className={s.flow} d="M304 344V300H226" />
        <path className={s.head} d="M208 300L224 291.5V308.5Z" />
      </g>

      {/* ---- 3. LLMs -------------------------------------------------- */}
      <g className={s.stage} data-line="llms">
        <rect className={s.hit} x="76" y="372" width="180" height="196" />

        <path className={s.thin} d="M84 380H252M84 560H252" />
        <path className={s.thin} d="M84 380V396M252 380V396M84 560V544M252 560V544" />

        {/* Both feet of every chord sit on the same plate — see the wide
            drawing's note. Bulging down into the gap under each layer. */}
        <path
          className={s.hair}
          d="M120 405A55 55 0 0 0 180 405M150 405A102 102 0 0 0 238 405M196 405A35 35 0 0 0 240 405M108 433A102 102 0 0 0 196 433M140 433A35 35 0 0 0 184 433M196 433A35 35 0 0 0 240 433M112 461A55 55 0 0 0 172 461M160 461A55 55 0 0 0 220 461M128 461A102 102 0 0 0 216 461M100 489A102 102 0 0 0 188 489M150 489A35 35 0 0 0 194 489M200 489A35 35 0 0 0 240 489M116 517A55 55 0 0 0 176 517M168 517A55 55 0 0 0 228 517M104 517A102 102 0 0 0 192 517M124 545A55 55 0 0 0 184 545M176 545A55 55 0 0 0 236 545M140 545A102 102 0 0 0 228 545"
        />

        <rect className={s.plate6} x="96" y="400" width="144" height="5" />
        <rect className={s.plate6} x="96" y="428" width="144" height="5" />
        <rect className={s.plate6} x="96" y="456" width="144" height="5" />
        <rect className={s.plate6} x="96" y="484" width="144" height="5" />
        <rect className={s.plate6} x="96" y="512" width="144" height="5" />
        <rect className={s.plate6} x="96" y="540" width="144" height="5" />
      </g>

      {/* ---- 4. Agents and Tool Use ----------------------------------- */}
      <g className={s.stage} data-line="agents">
        <rect className={s.hit} x="144" y="626" width="76" height="70" />
        <rect className={s.hit} x="20" y="296" width="52" height="380" />

        <path className={s.flow} d="M180 632L210 660L180 688L150 660Z" />

        <path className={s.cond} d="M150 660H52V496" />
        <path className={s.cond} d="M52 444V300H142" />
        <path className={s.head} d="M158 300L142 291.5V308.5Z" />

        <path className={s.flow} d="M52 444L74 457V483L52 496L30 483V457Z" />
        <circle className={s.thin} cx="52" cy="470" r="6" />
      </g>

      {/* ---- 5. Evals and Observability ------------------------------- */}
      <g className={s.stage} data-line="evals">
        <rect className={s.hit} x="164" y="746" width="136" height="28" />
        <rect className={s.hit} x="100" y="944" width="180" height="90" />

        <circle className={s.dot} cx="180" cy="760" r="6" />
        <path className={s.obs} d="M188 760H300V1010H244" />

        <path className={s.flow} d="M124 1010A56 56 0 0 1 236 1010" />
        <path className={s.thin} d="M120 1010H240" />
        <path
          className={s.thin}
          d="M124 1010H135M140.4 970.4L148.2 978.2M180 954V965M219.6 970.4L211.8 978.2M236 1010H225"
        />

        <path className={`${s.flow} ${s.needleN}`} d="M180 1010L208 974" />
        <circle className={s.dot} cx="180" cy="1010" r="4.5" />
      </g>

      {/* ---- Callouts ------------------------------------------------- */}
      <g className={s.callouts}>
        <g className={s.callout} data-line="prompt-engineering">
          <path className={s.lead} d="M142 170H158" />
          <circle className={s.dot} cx="162" cy="170" r="3" />
          <circle className={s.ring} cx="128" cy="170" r="14" />
          <text className={s.numN} x="128" y="176" textAnchor="middle">
            1
          </text>
        </g>

        <g className={s.callout} data-line="rag">
          <path className={s.lead} d="M304 498V489" />
          <circle className={s.dot} cx="304" cy="485" r="3" />
          <circle className={s.ring} cx="304" cy="512" r="14" />
          <text className={s.numN} x="304" y="518" textAnchor="middle">
            2
          </text>
        </g>

        <g className={s.callout} data-line="llms">
          <path className={s.lead} d="M108 360V376" />
          <circle className={s.dot} cx="108" cy="380" r="3" />
          <circle className={s.ring} cx="108" cy="346" r="14" />
          <text className={s.numN} x="108" y="352" textAnchor="middle">
            3
          </text>
        </g>

        <g className={s.callout} data-line="agents">
          <path className={s.lead} d="M100 700V664" />
          <circle className={s.dot} cx="100" cy="660" r="3" />
          <circle className={s.ring} cx="100" cy="714" r="14" />
          <text className={s.numN} x="100" y="720" textAnchor="middle">
            4
          </text>
        </g>

        <g className={s.callout} data-line="evals">
          <path className={s.lead} d="M108 1010H120" />
          <circle className={s.dot} cx="124" cy="1010" r="3" />
          <circle className={s.ring} cx="94" cy="1010" r="14" />
          <text className={s.numN} x="94" y="1016" textAnchor="middle">
            5
          </text>
        </g>
      </g>

      {/* ---- The request ---------------------------------------------- */}
      <g className={s.sparks}>
        <path
          className={s.spark}
          d="M180 118V788"
          pathLength={1}
          style={{ '--pl-dur': '2.5s', '--pl-delay': '0.2s' } as React.CSSProperties}
        />
        <path
          className={s.spark}
          d="M304 419V400L288 366L304 344V300H226"
          pathLength={1}
          style={
            { '--pl-dur': '0.5s', '--pl-delay': '0.6s', '--pl-d': '0.16' } as React.CSSProperties
          }
        />
        <path
          className={s.spark}
          d="M150 660H52V300H150"
          pathLength={1}
          style={
            { '--pl-dur': '0.9s', '--pl-delay': '2.05s', '--pl-d': '0.1' } as React.CSSProperties
          }
        />
      </g>
    </svg>
  )
}
