# New frontier — research for learn.sushantgundla.com

Researched 2026-09-09.

## 1. Verdict

**One new full course, but it should not be next in line, and the site's ink
budget makes it the most expensive of the pipeline so far.** Most of the other
candidates in this lens are real but too thin, or too close to a course that
already shipped, to stand alone — they belong as one or two lessons folded
into an existing course instead.

## 2. Proposed course — LLMs Over Structured Data

**Subtitle:** Your business runs on tables, not text — and a wrong answer
here still runs.

**Blurb:** RAG taught you to ground a model in documents. Your company's real
answers live in a database instead — orders, revenue, users — and a model
let loose on that schema fails in a way retrieval never does: it writes a
query that runs, returns a number, and is wrong. This course is about the
machinery that keeps that number honest.

**Parts:**
1. The gap RAG doesn't close
2. Making up an answer that runs
3. Guarding the door
4. Living with it

**Lessons:**

1. **Why your database is not a document.** Subtitle: a schema is not a
   passage you can chunk and embed. Opens on a model asked a plain question
   over a 40-table schema, picking the wrong table because nothing told it
   which one mattered. Teaches schema linking as its own problem, separate
   from everything RAG already taught.
2. **Schema linking.** Subtitle: giving the model the slice of the schema it
   needs, not all of it. Opens on a query that fails because the full schema
   didn't fit in context and the model guessed. Teaches retrieving relevant
   tables/columns before generation, the same way lesson design in RAG
   retrieves chunks — but against structured metadata, not embeddings.
3. **The kind of wrong that still executes.** Subtitle: a query can be
   perfectly grammatical and completely wrong. Opens on a report that shipped
   with a number 4x too high because of a silent fan-out join. Teaches why
   "it ran without an error" is the weakest possible check.
4. **The semantic layer.** Subtitle: one definition of revenue, not five.
   Opens on two dashboards disagreeing about the same number because two
   people wrote two different joins for "revenue." Teaches compiling
   questions through a governed metric definition instead of asking the
   model to reconstruct business logic from raw tables each time.
5. **Execution as verification.** Subtitle: run it before you trust it.
   (Full draft — see below.) Opens on the fan-out bug from lesson 3, this
   time caught before it shipped. Teaches dry runs, shape/row-count sanity
   checks, and repair-hint loops.
6. **Read-only, least privilege.** Subtitle: what a model should never be
   able to do to your database. Opens on an agent that "just wanted to check
   something" and ran an UPDATE. Teaches the sandbox and permission boundary
   for anything that writes SQL against production data.
7. **Row-level security and the missing tenant filter.** Subtitle: the join
   that forgot which customer it belonged to. Opens on one tenant seeing
   another tenant's rows because the generated query had no `WHERE
   tenant_id = ?`. Teaches enforcing isolation in the database, not in the
   prompt.
8. **Ambiguity in plain business language.** Subtitle: "active user" means
   five different things depending who you ask. Opens on a stakeholder
   getting three different answers to the same question from three
   different tools. Teaches disambiguating business terms before they reach
   SQL, not after.
9. **Measuring text-to-SQL.** Subtitle: exact string match lies to you.
   Opens on a query that looks nothing like the reference answer and returns
   the identical result. Teaches execution-match evaluation — same idea as
   the RAG course's "Measuring retrieval," applied to a different output.
10. **When to hand it a fixed menu instead.** Subtitle: not every question
    needs a model that can write arbitrary SQL. Opens on a support bot that
    only ever needs five known queries, given free rein to write its own
    anyway. Teaches the boundary between query generation and parameterized,
    pre-approved tool calls — closing lesson, same shape as RAG's "When RAG
    is the wrong tool."

## 3. The durability test

1. Schema-vs-document is a structural fact about relational data, not a
   product name.
2. Retrieving relevant schema before generation is the same mechanic as RAG
   chunk retrieval, restated for metadata — outlives any specific model.
3. "Syntax valid ≠ logically correct" is true of every query language that
   will ever exist.
4. A governed metric definition compiled once is a data-architecture idea
   older than LLMs (it's what a semantic layer always did); the model is
   just the new caller.
5. Dry-run-before-trust and row-count sanity bounds are database mechanics
   from long before LLMs; only the generator changed.
6. Least-privilege access is security 101, unaffected by which model wrote
   the query.
7. Row-level security is a database feature, not an AI feature — durable by
   construction.
8. Disambiguating business vocabulary is a modeling problem every BI team
   already had; LLMs just exposed it faster.
9. Execution-match over string-match is a durable evaluation principle,
   independent of the eval tool used.
10. Generation vs. fixed-tool-call is an architecture decision that doesn't
    depend on which vendor's agent framework is fashionable.

## 4. The cost of a new course

`DESIGN.md`'s "Adding a fifth ink" already says the palette is nearly
exhausted after amber (course 4, Agents), and that the *next* course may
have to earn its identity from the diagram's shape, not a new colour. This
course would be the **sixth** proposal in the pipeline (after Evals,
Production, Security, Multimodal, Fine-Tuning), so by the time its turn
came the ink budget would already be spent by five courses ahead of it. It
is not worth a new ink on its own. Two honest paths: build it last and let
it be the one that tests the "shape, not colour" fallback DESIGN.md
anticipates, or — cheaper — treat it as a thematic sequel to RAG (it answers
the question RAG's closing lesson raises: "when RAG is the wrong tool") and
reuse RAG's ink under a distinct diagram shape. I'd pick the second if the
course gets built at all.

## 5. Where it sits

- Distinct from RAG: RAG grounds a model in unstructured text via
  embeddings; this grounds it in structured schema via metadata and
  execution — a different retrieval mechanism entirely, but a real sibling.
- Distinct from Agents and Tool Use: that course is the generic loop; this
  is one high-stakes application of "a tool a model can actually use"
  (lesson 3 in Agents) to the specific, common, and dangerous case of
  database access.
- Distinct from the five already-proposed (Evals, Production, Security,
  Multimodal, Fine-Tuning): none of them touch structured-data grounding.
  Lesson 9 (measuring text-to-SQL) will need coordinating with whatever
  Evals course ships, the same way RAG's own "Measuring retrieval" would.

## 6. Rejected

- **Inference-time compute / test-time compute economics** — real and
  durable (trading pretraining spend for inference spend, reasoning
  budgets, self-consistency), but it's an extension of the shipped "Base,
  instruct, and reasoning models" and "What you actually pay for," not new
  ground. Fold in, don't found a course on it.
- **Small and local models as a deployment choice** — overlaps three
  shipped LLMs lessons directly (Open weights vs closed APIs, Running a
  model yourself, Picking a model). The one genuinely new mechanic — a
  cheap local model handling most turns and escalating hard ones to a
  bigger cloud model — is a single lesson, not a course.
- **On-device / edge inference** — same overlap as above, and much of what's
  written about it names specific runtimes (Core ML, MediaPipe, llama.cpp)
  that the site's "no framework as the subject of a lesson" rule rules out
  wholesale.
- **Coding agents / "loop engineering"** — a real 2026 term, but the
  mechanics underneath it (a loop, a verifier, a stopping rule, retries) are
  the exact mechanics the shipped Agents and Tool Use course already
  teaches. This would be that course wearing a code costume. The one truly
  distinct idea — using test/build/lint output as the verifier signal — is
  a lesson, not a course, and probably belongs in Agents' "When a tool call
  goes wrong."
- **Batch and offline processing at scale** — real pattern (sharded queue,
  checkpoint per shard, ~50% cost discount for batch APIs) but thin: one
  lesson's worth, and it fits naturally into the already-proposed
  Production course next to caching and failover.
- **The operational shape of long-running agent work** (durable execution,
  crash-resume, sandbox isolation across hours or days) — genuinely new and
  not covered by the shipped Agents course's "within a run" / "after the
  run ends" lessons, which are about the model's own memory, not
  system-level crash recovery. Real, but sized for one or two lessons
  appended to Agents' Part 4 ("Running it at scale"), not a course.
- **Multimodal document/data extraction as its own angle** — already
  claimed by the proposed Multimodal course; nothing left for this lens.
- **Prompt caching economics** — already covered by "What you actually pay
  for."
- **MCP updates or protocol churn** — already covered by "One protocol
  instead of forty integrations"; nothing new and durable to add.
- **"Vibe coding" as a named practice** — a slogan, not a mechanic. Fails
  the durability test outright.
- **Deep-research-style agentic search products** — bound to specific
  product names and behaviors that will have changed by the time this is
  read; no durable mechanic found underneath that isn't already "Planning a
  run, and knowing when to stop."

## 7. Sources

Fetched and confirmed:

- [Text-to-SQL Accuracy in Enterprise Environments](https://colrows.com/blogs/text-to-sql-accuracy-cliff/) — colrows.com, published 2026-06-11, updated 2026-08-30. The "accuracy cliff" between benchmark and real schemas; three causes (schema scale, business logic living outside the database, silent wrong-but-executing queries).
- [Semantic Layer vs Text-to-SQL: When Each Wins, and Why Mature Teams Use Both](https://colrows.com/blogs/semantic-layer-vs-text-to-sql/) — colrows.com, published 2026-06-12, updated 2026-08-30. When to route through a governed semantic layer vs. ad hoc generation.
- [Semantic Layer vs. Text-to-SQL: 2026 Benchmark Update](https://docs.getdbt.com/blog/semantic-layer-vs-text-to-sql-2026) — dbt Labs, published 2026-04-07. Comparative benchmark and failure-mode framing (plausible-but-wrong vs. clear-error).
- [SQL Semantic Validation for LLM-Generated Queries](https://www.dpriver.com/blog/sql-semantic-validation-for-llm-generated-queries/) — dpriver.com, published 2026-05-03. The five-step validation pipeline (name binding, scope resolution, semantic checking, policy enforcement, structured feedback) used for lessons 3, 5, 6, 7.
- [sqlglot](https://github.com/tobymao/sqlglot) — GitHub, live repo, no dependency SQL parser/validator; source for the lesson 5 code example.
- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) — postgresql.org, current docs, canonical RLS reference for lesson 7.
- [PostgreSQL: EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html) — postgresql.org, current docs, confirms EXPLAIN validates a query plan without executing against real data; used for lesson 5's dry-run concept.
- [dbt Semantic Layer docs](https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl) — dbt Labs, current docs, canonical description of a governed metric layer.

Searched but not individually fetched (used only for landscape context, not cited in the draft lesson): search result summaries on loop engineering / coding agents (ADTmag, aibuilderclub.com, tosea.ai — all July–August 2026), inference-time compute economics (arXiv 2604.10739, "Awesome-Inference-Time-Scaling" repo), small/edge models (digitalapplied.com, derekmolloy.ie, zylos.ai — all 2026), batch processing (spheron.network, tianpan.co, parasail.io — all 2026), long-running agents (O'Reilly Radar "Long-Running Agents," Google Developers Blog on ADK, zylos.ai on durable execution — all 2026).

**Not attempted:** YouTube talk transcripts. Text search returned strong, dated blog and vendor-docs sources with verifiable publication dates for the chosen lens; I did not find a YouTube URL worth the extra fetch once the blog sources covered the mechanic. Stating this plainly per the brief rather than fabricating a transcript source.
