# The figure kit — the manual

Ten components a lesson body can use by name, with no import line. They are
wired into `lessonComponents` in `app/learn/_lesson/mdx.tsx`, so writing
`<Flow steps={[...]} />` in an `.mdx` file under `content/learn/` is all there
is to it.

Your job as a lesson author is to **pick a component and supply data**. Do not
write an SVG, do not write a `<div>`, do not add a class, do not reach for a
colour. There are seventy-two lessons and the only thing standing between the
section and seventy-two different websites is that every figure on all of them
comes out of this file.

---

## Choosing

Start here, because most of getting this right is not making one.

| The idea you are trying to land | Reach for |
|---|---|
| Something moves through stages | `<Flow>` |
| A decision with named outcomes | `<Flow>` with `branch` |
| Something goes round again | `<Flow>` with `back` |
| The same fields hold different values at each step | `<Steps>` |
| Parts adding up to one whole | `<Budget>` |
| A few independent numbers, and which is biggest | `<Bars>` |
| Numbers orders of magnitude apart | `<Scale>` |
| Two things varying at once, and where each option sits | `<Plot>` |
| Before and after, naive and correct | `<Compare>` |
| A literal — a prompt, a JSON body, a trace — with its parts named | `<Anatomy>` |
| One knob, several regions of behaviour along it | `<Dial>` |
| A comparison across four or more attributes | **A markdown table** |
| A sequence of instructions to follow | **A numbered markdown list** |
| A definition, a rule, a caveat | **A sentence** |

### When the honest answer is no figure

Most of the time. A lesson is a printed spread and the prose is the thing; a
figure earns its place by saying something the sentence beside it cannot.

Do not draw a figure that:

- **Restates the sentence above it.** If the caption and the prose say the same
  thing, delete the figure.
- **Is a list with boxes round it.** Five nodes with no arrows between them is a
  bulleted list that took up half a screen.
- **Would be a better table.** Six columns of attributes across four options is a
  markdown table. Tables already break out onto the full spread and already
  pin their first column — they are a first-class citizen here, not a fallback.
- **Has numbers you invented.** Never draw a measurement the lesson does not
  have. If you need illustrative figures — a worked example of a context window
  filling up — that is fine, and **the caption has to say so in words.**
- **Is decoration.** No figure exists to break up the page.

Two or three figures in a lesson is a lot. Zero is a perfectly good answer for a
lesson that is an argument rather than a mechanism.

---

## The rules all ten obey

You do not have to enforce these — the components do — but knowing them stops
you fighting the kit.

- **No colour is yours to pick.** Every value comes from the lesson's own
  tokens, in both themes. There is no `color` prop and there will not be one.
- **`--lm-spark` marks one thing.** Every component takes `subject: true` on at
  most one item: the thing the figure is *about*. Nothing else in a figure is
  ever warm. Mark two and you have marked nothing.
- **Difference is not carried by hue.** Five bars are one ink. Six budget
  segments are one ink and four hatches. That is deliberate and it is why the
  key under a `<Budget>` is not optional.
- **Captions number themselves.** A CSS counter prints `FIG. 1`, `FIG. 2` in
  document order. Never write the number yourself; insert a figure anywhere and
  the rest renumber.
- **Every figure needs a caption**, and the caption is the figure's accessible
  name. Write it as a sentence that states what the drawing shows or what it
  found — not `"A diagram of the loop"`. It has to make sense read on its own.
- **Numbers get a text equivalent for free.** `<Budget>`, `<Bars>` and `<Scale>`
  build a spoken list of their own values. Override it with `alt` only when you
  can genuinely do better.
- **Interactive means a real control.** `<Dial>` is an `<input type="range">`
  with a label; `<Steps>` is a row of `<button>`s. Both work from the keyboard
  and draw a visible focus ring.
- **Motion happens once.** `<Flow>` runs a spark down its arrows on load and
  then nothing moves again. Under `prefers-reduced-motion` it is removed.
- **Nothing has a fixed pixel width and nothing caps a height.** Every figure
  fills the spread it is given, at every window size.

---

## `<Flow>`

**For:** a request running through a machine; a pipeline; a decision with named
outcomes; a loop that goes round again. The workhorse.

**Not for:** a list of things that are all true at once (that is a bulleted
list); a sequence where the same fields change value at each stage (that is
`<Steps>`); a comparison (that is `<Compare>` or a table).

A row above 46rem and a column below it, from one source. Two to five nodes read
as a row; six or more stay a column at every width, because five boxes across a
spread is a drawing and nine is a smudge.

```ts
interface FlowStep {
  /** What the node is. Two or three words: "Count the tokens". */
  label: string
  /** One clause under it, if the label needs it. */
  note?: string
  /** A real fork — the alternatives, ruled apart inside the node. */
  branch?: string[]
  /** The one node the figure is about. At most one per Flow. */
  subject?: boolean
}

interface FlowBack {
  /** 1-based index of the node the return leaves from. */
  from: number
  /** 1-based index of the node it returns to. Must be less than `from`. */
  to: number
  /** Why it goes round again. */
  label: string
}

interface FlowProps {
  caption: string
  alt?: string
  steps: FlowStep[]
  back?: FlowBack
  /** Turn the travelling spark off. Rare. */
  still?: boolean
}
```

Real example — the agent loop, from `content/learn/agents/01-a-loop-not-a-brain.mdx`:

```mdx
<Flow
  caption="The whole machine. Nothing in it runs itself: the model emits a request, your process executes it, and the loop exits on whichever termination comes first."
  steps={[
    { label: 'Your messages', note: 'Plus the tool definitions, on every single request' },
    { label: 'The model', note: 'Stateless. Reads everything you send' },
    {
      label: 'stop_reason',
      subject: true,
      branch: [
        'tool_use — the model wants a tool',
        'anything else — the model decided it is finished',
      ],
    },
    { label: 'Your executor', note: 'Your code runs the real function and returns a tool_result' },
  ]}
  back={{ from: 4, to: 1, label: 'Round again, until the step budget runs out' }}
/>
```

## `<Steps>` — interactive

**For:** a loop going round; a cache being written and then read; a retry after
a failure; a transcript growing a turn at a time. Use it wherever the *same
fields hold different values at each step*, because that is precisely what a
static drawing of five boxes cannot show.

**Not for:** stages that are all true at once and want to be seen side by side —
that is `<Flow>`. Not for a recipe: a list of instructions is a numbered
markdown list.

There is no progress bar, no track and no counter, and there is not going to be.

```ts
interface StepFact {
  /** What the field is. "cache_read_input_tokens", "messages". */
  label: string
  /** What it holds at this step. Set in mono, so keep it short. */
  value: string
}

interface Step {
  /** The button's text. Two or three words — it sits in a row. */
  label: string
  /** The panel's heading. Defaults to `label`. */
  title?: string
  /** What is happening at this step, in a sentence or two. */
  body: string
  /** The state at this step, ruled one fact per row. */
  facts?: StepFact[]
}

interface StepsProps {
  caption: string
  steps: Step[]
}
```

Real example — prompt caching, from
`content/learn/llms/04-context-windows-and-limits.mdx`:

```mdx
<Steps
  caption="The same script, four times over. Click through and watch the two usage fields: the saving is entirely a matter of whether the prefix is still byte-identical and still warm."
  steps={[
    {
      label: 'First call',
      title: 'The cache is written',
      body: 'The provider processes the handbook and stores the result against the prefix. Writing costs slightly more than a plain input token, so this call is a small loss.',
      facts: [
        { label: 'cache_creation_input_tokens', value: 'the whole prefix' },
        { label: 'cache_read_input_tokens', value: '0' },
      ],
    },
    {
      label: 'Second call',
      title: 'The cache is read',
      body: 'Byte-identical prefix, still inside the window. The provider reuses the processing it already did.',
      facts: [
        { label: 'cache_creation_input_tokens', value: '0' },
        { label: 'cache_read_input_tokens', value: 'the whole prefix' },
      ],
    },
  ]}
/>
```

## `<Budget>`

**For:** parts adding up to one whole — a context window filling up, where a
request's latency goes, what a bill is actually made of.

**Not for:** independent magnitudes that are not shares of anything (that is
`<Bars>`); two numbers (that is a sentence).

Segments are told apart by hatch and by the key under the bar. There are four
textures and they cycle, so a seventh segment repeats the third — the key is
what makes the figure readable, and it is always drawn.

```ts
interface BudgetSegment {
  label: string
  /** How much of the whole it takes, in whatever `unit` says. */
  value: number
  note?: string
  /** Takes the warm ink. At most one per Budget. */
  subject?: boolean
  /** Room that is not spent: drawn empty rather than filled. */
  spare?: boolean
}

interface BudgetProps {
  caption: string
  /** Built from the segments when left out. Usually leave it out. */
  alt?: string
  segments: BudgetSegment[]
  /** "tokens", "ms", "$". */
  unit?: string
  /** The whole. Defaults to the sum of the segments. */
  total?: number
  /** What the whole is: "A 200,000-token window". */
  totalLabel?: string
}
```

Real example, shipped in `content/learn/llms/04-context-windows-and-limits.mdx`.
Note the last clause of the caption — these are illustrative figures and the
caption says so:

```mdx
<Budget
  caption="One worked request against a 200,000-token window. The retrieved documents are the biggest slice, as they usually are, and the answer is inside the same budget as everything that was sent. The figures are an illustration, not a measurement — count your own."
  totalLabel="A 200,000-token window"
  unit="tokens"
  total={200000}
  segments={[
    { label: 'System prompt', value: 1200, note: 'Resent on every single turn' },
    { label: 'Tool definitions', value: 2400, note: 'Schemas get large faster than you expect' },
    { label: 'Conversation history', value: 9000, note: 'Grows every turn, never shrinks on its own' },
    { label: 'Retrieved documents', value: 62000, note: 'Usually the biggest slice by far', subject: true },
    { label: 'The new user message', value: 180, note: 'Rarely the problem' },
    { label: 'Reserved for the answer', value: 1500, note: 'max_tokens, out of the same budget' },
    { label: 'Unspent headroom', value: 123720, spare: true },
  ]}
/>
```

## `<Bars>`

**For:** a handful of independent numbers on one scale, where the point is which
is bigger — latency, price per million tokens, recall@k, accuracy across three
prompts.

**Not for:** parts of a whole (`<Budget>`); numbers orders of magnitude apart,
where every bar but one is a stub (`<Scale>`); more than about eight rows, which
is a table.

Every rule is the same ink at the same weight. An item with no number is drawn
as a dashed gap and named, never dropped.

```ts
interface Bar {
  label: string
  /** Leave out or pass null where there genuinely is no number. */
  value?: number | null
  note?: string
  /** Printed where the value would be, when there is no value. */
  no?: string
  /** Takes the warm ink. At most one per Bars. */
  subject?: boolean
}

interface BarsProps {
  caption: string
  alt?: string
  bars: Bar[]
  unit?: string
  /** The length the longest bar is drawn at. Set it to 100 for a percentage. */
  max?: number
  /** What the scale is, printed under the bars. */
  axis?: string
}
```

Example, for `content/learn/rag/12-reranking.mdx`:

```mdx
<Bars
  caption="Recall at the k the model actually sees. Reranking does not find anything new — it moves what was already retrieved into the window."
  unit="%"
  max={100}
  axis="Recall@5 on the same 200 candidates"
  bars={[
    { label: 'Vector search alone', value: 61 },
    { label: 'Hybrid, no rerank', value: 74, note: 'BM25 and vectors, fused' },
    { label: 'Hybrid, then rerank', value: 88, subject: true },
    { label: 'Cross-encoder over all 200', value: null, no: 'too slow to ship' },
  ]}
/>
```

## `<Scale>`

**For:** magnitudes placed against each other — context sizes, token prices,
latency budgets. Logarithmic by default, because that is what this subject needs:
4,000 next to 1,000,000 on a linear rule puts every mark but one in the first
four pixels.

**Not for:** which is bigger (`<Bars>`); more than about six marks, where the
labels collide at any width.

```ts
interface ScaleMark {
  /** Where it sits, in the same unit as every other mark. */
  at: number
  label: string
  /** What to print. Defaults to `at` with the unit. Set it for "~1M". */
  value?: string
  /** Takes the warm ink. At most one per Scale. */
  subject?: boolean
}

interface ScaleProps {
  caption: string
  alt?: string
  marks: ScaleMark[]
  min?: number
  max?: number
  unit?: string
  /** Logarithmic placement. Defaults to true. */
  log?: boolean
  /** What the low end is, printed under it. */
  fromLabel?: string
  /** What the high end is. */
  toLabel?: string
}
```

Example, for `content/learn/llms/07-what-you-actually-pay-for.mdx`:

```mdx
<Scale
  caption="What one request can cost, on a log rule. The jump is three orders of magnitude and none of it is the model getting cleverer."
  unit="tokens"
  fromLabel="One question"
  toLabel="A long PDF"
  marks={[
    { at: 40, label: 'The user message' },
    { at: 1200, label: 'A system prompt' },
    { at: 9000, label: 'An hour of conversation' },
    { at: 62000, label: 'Retrieved documents', subject: true },
  ]}
/>
```

## `<Plot>`

**For:** two things varying at once, and where each option sits between them —
cost against capability, recall against latency, effort against what it buys.
This is also the honest 2×2: turn `divide` on and the quadrants are ruled, but
the items still sit where they actually are.

**Not for:** four items invented to fill four corners. If you had to make one up
to complete the square, you wanted a table. Not for more than about six items,
and not for two items within a few per cent of each other — labels do not wrap
and they will overlap.

Below 44rem it is not drawn at all: it becomes a ruled list of the same facts,
which is also what a screen reader gets at every width.

```ts
interface PlotPoint {
  /** Kept short — it is set on one line beside its dot. */
  label: string
  /** 0 to 100 on each axis. */
  x: number
  y: number
  /** Takes the warm ink and a heavier weight. At most one per Plot. */
  subject?: boolean
}

interface PlotProps {
  caption: string
  alt?: string
  xAxis: string
  /** The two ends, low first. */
  xEnds: [string, string]
  yAxis: string
  yEnds: [string, string]
  points: PlotPoint[]
  /** Rule it into quadrants at the midpoint of both axes. */
  divide?: boolean
}
```

Example, for `content/learn/agents/01-a-loop-not-a-brain.mdx`:

```mdx
<Plot
  caption="Flexibility is bought with predictability, and the middle ground is where most systems that work in production actually sit."
  divide
  xAxis="Who picks the next step"
  xEnds={['Your code', 'The model']}
  yAxis="What you can state in advance"
  yEnds={['A range', 'A number']}
  points={[
    { label: 'Prompt chaining', x: 8, y: 95 },
    { label: 'Routing', x: 22, y: 88 },
    { label: 'Orchestrator–workers', x: 45, y: 62 },
    { label: 'One agentic step inside a pipeline', x: 62, y: 48, subject: true },
    { label: 'A coding agent', x: 94, y: 12 },
  ]}
/>
```

## `<Compare>`

**For:** before and after, naive and correct, this and not that. The one
component that takes children rather than data, because its contents are prose
and prose belongs in markdown.

**Not for:** four or more options across several attributes — that is a table.
Not for a difference you can state in one sentence.

Neither side is tinted and neither is filled. There is no red panel and no green
one and there is no glyph: a lesson carries no hue for right and wrong anywhere.
Say which side is which in `label` and `title`, in words.

**Leave a blank line after the opening `<Panel>` tag and before the closing
one**, or MDX treats the contents as inline JSX text and your markdown is not
parsed.

```ts
interface CompareProps {
  caption: string
  alt?: string
  /** Two <Panel> elements, or at most three. */
  children: ReactNode
}

interface PanelProps {
  /** What this side is. */
  title: string
  /** The short word over it: BEFORE, NAIVE, WHAT TO DO. */
  label?: string
  children: ReactNode
}
```

Real example, shipped in `content/learn/llms/04-context-windows-and-limits.mdx`:

```mdx
<Compare caption="The same question, answered two ways. The retrieval side wins on all three axes at once, which is why a big window is not a reason to stop retrieving.">
  <Panel label="Naive" title="Paste the whole handbook">

Every token of it is read on every turn, and paid for on every turn. Time to first token is mostly the model reading input, so the user watches a blank screen.

  </Panel>
  <Panel label="What to do" title="Retrieve ten paragraphs">

Cheaper, because you send a fraction of the tokens. Faster, for the same reason. And more accurate, because the evidence is not buried in text that pulls the answer away from it.

  </Panel>
</Compare>
```

## `<Anatomy>`

**For:** a literal with its parts named — a prompt, a JSON response, a
`tool_use` block, a line of a trace. The parts are underlined and numbered in
place, and the numbers repeat in a key that goes out into the spread's right-hand
margin above 62rem.

**Not for:** a code sample where nothing needs naming. That is a fenced code
block, and if it needs a number, `<Figure bare>` around it.

The literal is given as a list of runs, not as one string with things to search
for in it. A run with a `name` is marked; a run without one is printed plain.
Joined in order they are the literal, character for character — so a figure can
never mark the wrong `"type"` because there were three of them.

```ts
interface AnatomyPart {
  /** The characters, exactly. Newlines and indentation are kept. */
  text: string
  /** Present means marked and numbered; absent means printed plain. */
  name?: string
  note?: string
  /** Takes the warm underline. At most one per Anatomy. */
  subject?: boolean
}

interface AnatomyProps {
  caption: string
  alt?: string
  parts: AnatomyPart[]
  /** What the literal is, over the block: "A REQUEST". */
  label?: string
}
```

Real example, shipped in `content/learn/llms/04-context-windows-and-limits.mdx`:

```mdx
<Anatomy
  caption="The shape that holds up across models: the instruction at the start, the bulk in the middle where position hurts least because it is bulk, and the question again at the end."
  label="One long request"
  parts={[
    {
      text: 'Answer only from the documents below. Cite the section you used.',
      name: 'The instruction, first',
      note: 'The start is one of the two strong positions',
    },
    { text: '\n\n<documents>\n' },
    {
      text: '  ...40,000 tokens of retrieved passages...',
      name: 'The documents, in the middle',
      note: 'The weakest position, and where the bulk has to go anyway',
      subject: true,
    },
    { text: '\n</documents>\n\n' },
    {
      text: 'How much notice do I have to give?',
      name: 'The question again, last',
      note: 'A few dozen tokens, and the cheapest reliability fix on the list',
    },
  ]}
/>
```

## `<Dial>` — interactive

**For:** one number with a few named regions of behaviour along it —
`temperature`, `top_p`, `top_k`, chunk size, `max_tokens`, `k` in a retrieval, a
similarity threshold.

**Not for:** a switch with two settings, which is `<Compare>`. Not for a
sequence of states, which is `<Steps>`. Not for a number with no regions: if you
cannot name three bands and say what happens in each, there is nothing to drag
towards.

Bands must ascend and the first must start at `min`. The band in force is the
last boundary the value has passed.

```ts
interface DialBand {
  /** The value this band starts at. */
  at: number
  /** The band's name, printed as a tick under the rail. */
  label: string
  /** What happens here, in a sentence. This is the point of the figure. */
  outcome: string
  /** Where it goes wrong, or what it costs. */
  note?: string
}

interface DialProps {
  caption: string
  /** What the knob is. Used as the input's label. */
  name: string
  min: number
  max: number
  step: number
  /** Where it sits on arrival. Defaults to `min`. */
  start?: number
  unit?: string
  /** Two to five, ascending. */
  bands: DialBand[]
}
```

Example, for `content/learn/llms/02-sampling-and-its-knobs.mdx`:

```mdx
<Dial
  caption="One knob, four regions. None of them has anything to do with whether the answer is correct — they govern variety and fluency, and a wrong answer at a low temperature is just wrong the same way every time."
  name="temperature"
  min={0}
  max={2}
  step={0.1}
  start={1}
  bands={[
    {
      at: 0,
      label: 'Greedy',
      outcome: 'Always the single highest-probability token.',
      note: 'Duller and more repetitive than sampling properly — the safest word, repeated, is a loop.',
    },
    {
      at: 0.3,
      label: 'Sharpened',
      outcome: 'The distribution is squeezed toward its peak. Consistent, and never a guarantee of identical output.',
    },
    {
      at: 0.9,
      label: 'As trained',
      outcome: 'The default, and the only value current Anthropic reasoning models accept.',
    },
    {
      at: 1.3,
      label: 'Flattened',
      outcome: 'The tail becomes reachable and the answer starts drawing words that make it look broken.',
    },
  ]}
/>
```

## `<Figure>`

**For:** putting a numbered caption on a block that is already right — a
markdown table or a fenced code block you have decided needs no drawing.

**Not for:** anything else. If you find yourself putting hand-written markup
inside a `<Figure>`, one of the nine components above is what you actually
wanted, or the answer is no figure.

```ts
interface FigureProps {
  caption: string
  /** The text equivalent, for a drawing that encodes something. */
  alt?: string
  /** Drop the two hairlines. Use this when wrapping a table or a code block. */
  bare?: boolean
  children: ReactNode
}
```

```mdx
<Figure bare caption="Five workflow patterns, all of them in production somewhere. Every one of them is a path you wrote.">

| Pattern | Shape | Reach for it when |
|---|---|---|
| Prompt chaining | Output of call one feeds call two | The task splits into fixed stages |
| Routing | Classify, then send to one of N specialised prompts | Inputs fall into known categories |

</Figure>
```

---

## Two things that will bite you

**Blank lines end a JSX block in MDX.** A multi-line `<Flow steps={[...]} />` is
fine as long as there is no blank line inside it. The one place blank lines are
wanted is inside `<Panel>`, where they are what makes the contents parse as
markdown.

**JSX expression attributes are switched on deliberately.** `next-mdx-remote` 6
strips `{...}` attributes by default as a security measure for untrusted MDX;
`app/learn/[course]/[lesson]/page.tsx` passes `blockJS: false` because this MDX
is the owner's own files read at build time. If a figure ever renders as nothing
at all while its caption still appears, that option has been removed and every
data prop is arriving `undefined`.

## Before you commit a figure

- The caption is a sentence stating what the drawing shows or found.
- At most one `subject: true` in the figure.
- Every number in it is either from the lesson, from a source the lesson cites,
  or captioned as an illustration in so many words.
- You did not change one word of the surrounding prose. Figures go **between**
  paragraphs. Run `git diff` on the lesson and confirm every line you touched is
  an addition.
- `npm run build` exits 0.
