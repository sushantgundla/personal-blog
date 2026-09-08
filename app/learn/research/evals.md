# Research: a course on evaluating and observing LLM systems

## 1. Verdict

**One course.** The topic is one job done by one kind of engineer at two points in
time — before you ship a change (evals) and after it's live (observability). They
share one dataset (production traffic), one skill (judging output), and one
outcome (catching a regression). Splitting them would force the reader to learn
"how do I know if my system is good" twice, once in the abstract and once in
production, which is the same question asked twice.

It also isn't a handful of lessons bolted onto an existing course. "Versioning
and testing prompts" (Prompt Engineering #10) and "Measuring retrieval" (RAG
#10) are each one narrow slice of this — versioning a single artifact, scoring
one pipeline stage. This course is the general skill both of those borrow from.
Full course, 12 lessons, 4 parts.

## 2. Proposed course

**Title:** Evaluating and Observing LLM Systems
**Subtitle:** How to know it's working, and how to know when it stops.

**Blurb:** You shipped the prompt. It worked on the five cases you tried. Now
what — how do you know it works on the five thousand you didn't, and how do you
find out the day it quietly stops? This course is the answer: building a test
set from real traffic, judging output at scale, catching a regression before a
user does, and watching a live system without drowning in dashboards.

### Part 1 — Why "looks good" isn't a metric

**1. Why "looks good to me" fails**
*A demo of five examples tells you almost nothing about the other five thousand.*
Opens with: a prompt change that read better on every case the engineer tried,
shipped, and two weeks later support tickets spike on an input nobody tried.
Covers three failure modes of eyeballing output: small sample, cherry-picked
sample, and — the same trap wearing a different hat — chasing a public
leaderboard number instead of your own traffic, since a benchmark score is
just someone else's five examples. Table: demo eyeballing vs. public benchmark
vs. an eval set built from your own traffic — what each actually measures, and
what it misses.

**2. Building an eval set from your own traffic**
*Your users already wrote your test cases; you just haven't collected them.*
Opens with: an engineer asked to "write tests for the chatbot" and stuck,
because there's no `assertEqual` for "was this a good answer." Teaches
sourcing eval examples from real logs, expert-written edge cases, and
synthetic generation for gaps — and the rule that every production incident
becomes a permanent test case. Table: traffic-sourced vs. expert-written vs.
synthetic examples, by realism, cost, and blind spots.

**3. Offline evals vs. online evals**
*One runs before a stranger sees the output, one runs after.*
Opens with: a team ran a thorough offline eval, shipped, and a category of
real input the eval set never covered — a different language, a longer
conversation — broke in production the eval never caught. Teaches the two-tier
loop: a golden set you run before every change, and continuous sampling of
live traffic after. Table: offline vs. online — when it runs, what it catches,
what it costs, how fast it tells you something's wrong.

### Part 2 — Judging the output

**4. Deterministic checks vs. LLM-as-judge**
*Don't spend a model call answering a question code can answer for free.*
Opens with: a team reaching for an LLM judge to check "is this valid JSON" —
a schema check answers instantly, never hallucinates, and costs nothing.
Teaches where a regex, schema, or unit-style assertion is the whole answer,
and where judgment genuinely requires a model (tone, relevance, faithfulness
to a source). Table: deterministic checks vs. LLM judges, by cost, speed,
what they can and can't catch.

**5. How to trust a judge**
*A judge is a model too, and models need their own report card.*
Opens with: a judge that scores 9/10 on answers a human reviewer flagged as
wrong — nobody had checked the judge against a human-labeled set before
trusting its numbers. Teaches calibrating a judge against human labels,
writing a rubric specific enough to score against, and the known biases
(position, verbosity, self-preference) with the standard fixes: swap answer
order, keep the same judge model and settings run to run, periodic human spot
checks. Table: judge biases, what causes each, and the fix.

**6. Pairwise comparison and human review that scales**
*"Which is better, A or B" gets a cleaner answer than "rate this 1 to 5."*
Opens with: a team asked reviewers for star ratings and got noise — two
reviewers, two different 3-star answers, neither one wrong. Teaches pairwise
comparison (for humans and judges), and how to route only disagreements or a
sample to a human instead of reviewing everything. Table: absolute scoring vs.
pairwise comparison, by consistency, reviewer fatigue, and what each is good
for.

### Part 3 — Shipping a change without breaking it

**7. Regression testing a prompt or model change**
*Treat a one-line prompt edit like the code change it actually is.*
Opens with: someone tweaks a prompt to fix one broken case, ships it, and
silently breaks three others that nobody notices until a user does. Assumes
the reader already versions prompts (that's "Versioning and testing prompts"
in the Prompt Engineering course) and picks up from there: running the golden
set from Lesson 2 against every prompt or model-swap change, gating a merge
on the result. Table: what a golden-set regression run catches vs. what a
human review still needs to catch.

**8. A/B testing and shipping a change safely**
*An eval score is a hypothesis. A rollout is the experiment that checks it.*
Opens with: the eval says the new prompt is better, real users prefer the
old one — because the eval scored something that wasn't what users actually
cared about. Teaches shadow traffic, canary rollout, and full A/B, plus
picking a real success metric (task completion, not a judge score) before
rolling out. Table: shadow vs. canary vs. full A/B, by risk, speed, and what
you learn.

**9. Drift: when the model changes under you**
*Your prompt didn't change. The model behind the API did.*
Opens with: quality quietly drops overnight with no code change on your side
— the provider updated the model behind the same API name. Teaches why this
happens (safety retuning, silent model swaps, deprecations), and the only
real defense: rerunning your golden set on a schedule and after every noticed
behavior shift, not trusting a changelog to tell you. Table: causes of drift,
how each shows up, and how you'd notice.

### Part 4 — Watching it run in production

**10. Tracing a multi-step run**
*Find which of the seven calls in the pipeline actually went wrong.*
Opens with: a user reports "it gave a weird answer," and it takes an hour of
guessing across a retrieval call, two LLM calls, and a tool call to find
where it broke. Teaches tracing a request as a tree of spans — one span per
retrieval, model call, and tool call — so a bad output points at one step
instead of the whole pipeline. Table: what a span records at each pipeline
stage (retrieval, generation, tool call).

**11. What to log, and what never to**
*See what happened without collecting what you shouldn't have kept.*
Opens with: a team piping full prompts and responses into a third-party
observability tool, then realizing a customer's SSN was sitting in there in
plain text. Teaches a working default — log structure, timing, and token
counts always; redact or hash user content; never log secrets or full
identity fields — and why "we'll clean it up later" doesn't work once it's
left your infrastructure. Table: log field categories — always log, redact,
never log.

**12. Latency and cost as first-class metrics**
*A correct answer that arrives in 9 seconds for 40 cents is still a problem.*
Opens with: a team swaps in a model that scored higher on a public
leaderboard, ships it, and it's three times slower and four times more
expensive for a task the leaderboard never tested. Teaches treating
time-to-first-token, p50/p95 latency, and cost per request as metrics you
track and alert on with the same seriousness as quality — and, closing the
loop back to Lesson 1, why the leaderboard number was never the thing to
optimize for in the first place. Table: latency and cost metrics, what each
one tells you, and a reasonable place to start alerting.

## 3. Ordering rationale

Part 1 sets the mindset before any mechanics: "looks good" is not a metric,
here's how you actually build one. Part 2 is the core skill — judging output
at scale — because everything after it (regression tests, A/B tests, drift
detection) is "run the judgment from Part 2, repeatedly, and compare." Part 3
is what changes when you ship deliberately (a code or model change you chose).
Part 4 is what happens when nothing you chose still breaks — the system
running unattended, and a provider or the world changing under it. Deterministic
checks come before LLM-as-judge in Part 2 because the cheaper, more reliable
tool should always be reached for first; judges are for the residue that's
left after that.

The benchmark trap is folded into Lesson 1 rather than given its own slot: a
public leaderboard number is the same failure as eyeballing five demo cases —
someone else's narrow sample standing in for your traffic — so it's one lesson
about the same mistake in two disguises, not two lessons.

## 4. Rejected

- **Model leaderboards / "which model is best right now"** — a ranking, banned
  by the no-rankings rule, and it's exactly the trap Lesson 1 warns against.
- **Fine-tuning your own judge model** — real technique, too deep and too
  infra-heavy for a 5–8 minute lesson; off-the-shelf frontier model as judge
  (Lesson 5) covers what most readers need.
- **Formal statistics for A/B tests (power analysis, sequential testing)** —
  worth a paragraph inside Lesson 8, not its own lesson; it's a stats course
  wearing an LLM costume.
- **Adversarial red-teaming / jailbreak evaluation** — overlaps with "Prompt
  injection" already in the Prompt Engineering course; a full red-teaming
  lesson is its own course, not a slot here.
- **Guardrail/content-moderation classifiers as a topic** — this is a product
  category (specific vendors sell it), not a mechanic; readers who need it
  will find it, but it dates the course to name it.
- **Walking through a specific observability product (LangSmith, Braintrust,
  etc.)** — vendor docs are exactly what this site positions against; the
  course teaches spans, golden sets, and drift as concepts that outlive any
  one tool's UI.
- **RLHF / reward model training** — that's how a model gets built, not how
  you evaluate one you're building on top of; out of scope for a practitioner
  course.
- **Chatbot Arena–style Elo rankings as a technique to adopt** — it's a public
  benchmark by another name; already covered by the point Lesson 1 makes.

**Overlap with existing lessons, resolved:**
- *"Versioning and testing prompts"* (Prompt Engineering #10) stays where it
  is — it's about managing a prompt as a versioned artifact and running a
  basic test on edit. Lesson 7 here assumes that skill and builds the eval
  infrastructure (golden sets, CI gating) around it. No content moves.
- *"Measuring retrieval"* (RAG #10) stays in RAG — it's retrieval-specific
  metrics (recall@k, MRR) for one pipeline stage. This course's evals score
  whole-system output, not retrieval mechanics. Lesson 2 here can note in
  passing that retrieval-only datasets are covered there; no content moves.

## 5. Sources

- [LLM-as-a-Judge in 2026: Top evaluation techniques and best practices — DeepEval](https://deepeval.com/blog/llm-as-a-judge) — current, dated 2026, matches what's in Lessons 4–5.
- [LLM-as-Judge Best Practices in 2026: Calibration, Bias, and Cost — FutureAGI](https://futureagi.com/blog/llm-as-judge-best-practices-2026/) — current, backs the bias/calibration content in Lesson 5.
- [Best LLM Observability Tools for AI Agents — Latitude (2026)](https://latitude.so/blog/best-llm-observability-tools-agents-latitude-vs-langfuse-langsmith) — current, used only to confirm the tracing/span pattern in Lesson 10, not to endorse a vendor.
- [Top LLM Observability and Evaluation Platforms in 2026 — MarkTechPost](https://www.marktechpost.com/2026/08/09/top-llm-observability-and-evaluation-platforms-in-2026-langfuse-langsmith-braintrust-arize-and-more-compared/) — published Aug 2026, very current, confirms industry has converged on span-based tracing as the standard shape.
- [Catching Silent LLM Degradation — Traceloop](https://www.traceloop.com/blog/catching-silent-llm-degradation-how-an-llm-reliability-platform-addresses-model-and-data-drift) — current, backs Lesson 9's framing of drift as provider-side, undetectable without your own baseline.
- [What is LLM evaluation? A practical guide — Braintrust](https://www.braintrust.dev/articles/llm-evaluation-guide) — current, backs the three-tier (offline / CI-gate / online sampling) structure used across Lessons 3, 7, 8.
- [LLM regression testing: fail CI before regressions ship — Langfuse](https://langfuse.com/resources/engineering/llm-regression-testing) — current, backs Lesson 7's CI-gating approach and "every incident becomes a test case" rule in Lesson 2.
- [LLM Benchmark Methodology 2026: Reading Leaderboards — Digital Applied](https://www.digitalapplied.com/blog/llm-benchmark-methodology-2026-contamination-leaderboard-guide) — current, backs the contamination/overfitting argument behind the benchmark trap in Lesson 1.
- [Towards Contamination Resistant Benchmarks (arXiv)](https://arxiv.org/pdf/2505.08389) — academic, dated but the contamination problem it describes hasn't changed; used for background only, not cited as a number.
