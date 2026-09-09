# New course — the product layer above the API call

Written 2026-09-09. Read blind to the six files in `app/learn/research/`, per instructions,
except to confirm no overlap.

## 1. Verdict

**A real course, lean: 9 lessons, not the usual 10-12.** Everything in it teaches a mechanic —
a true, checkable fact about how a system behaves — not a design preference. I found nine that
clear that bar and cut four that didn't (see §6). I would rather ship nine strong lessons than
pad to twelve with UX opinion.

It should build **after** Agents and Tool Use and Evaluating and Observing (build order 1-2 in
the README) — several lessons here assume the reader already has "a loop" and "an eval set" as
concepts, and one lesson (review queues) produces exactly the labelled data an evals course
would consume.

## 2. Proposed course

**Title:** After the Call
**Subtitle:** What happens once a person is looking at what the model said.
**Blurb:** Prompting and retrieval get you a good answer. This course is about everything after
that: the answer arrives wrong sometimes, arrives one token at a time, arrives differently on a
retry, and eventually has to replace a system that already worked. These are the engineering
problems that only show up once real output meets a real interface.

**Parts:**
1. Wrong Some of the Time
2. The Boundary
3. Changing What's Already Running
4. What Persists

### Part 1 — Wrong Some of the Time

**1. Who catches the error, and when**
*A synchronous human in the loop is a error handler you didn't have to write.*
Opens on a support-reply assistant that worked fine as a draft-and-send tool, then broke
production the day it was wired to send automatically. Nothing about the model changed. What
changed is that a person used to be the last check before a bad reply went out, and now nothing
is. Teaches that "assist" and "automate" aren't a tone choice — they're two different places for
error-handling code to live: in a person's judgment, or in your code's fallback path.

**2. Confidence that means nothing, and the two things that do**
*A model's stated confidence isn't calibrated to how often it's right.*
Opens on a pipeline that only escalates answers below "80% confident" — a number the model made
up on request, unrelated to its real accuracy. Teaches why verbalized confidence is
uncalibrated, and the two signals that actually correlate with correctness: agreement across
repeated samples, and (where the API exposes them) token log-probabilities.

### Part 2 — The Boundary

**3. Streaming into a shape that isn't finished yet**
*A partial JSON fragment is not a smaller JSON object — it's not JSON yet.*
Opens on a UI that renders a half-built object mid-stream and shows a null date because the
field hadn't arrived. Teaches the accumulate-then-parse contract for streamed structured output,
and the rule that a field is only safe to render once its closing token has arrived. Full draft
below.

**4. The same input, a different answer each time**
*Temperature zero does not mean deterministic, and "regenerate" is a new sample, not a retry.*
Opens on a bug report nobody can reproduce because the "same" request never really was the same
request twice. Teaches why server-side batching and floating-point order break determinism even
at temperature 0, and that application-level determinism has to be built at the interface
boundary (a cache keyed on the normalized request) rather than assumed from a sampling
parameter.

### Part 3 — Changing What's Already Running

**5. Running the old system and the new one side by side**
*Shadow mode measures a model against production traffic without ever letting it decide anything.*
Opens on a rules engine slated for replacement, and the fear that the model will silently do
worse on cases the rules engine happened to get right. Teaches the shadow-deploy pattern:
duplicate every request, run both paths, log both outputs, serve only the old one, and use the
divergence log to decide when — and whether — to cut over.

**6. Deciding not to call the model at all**
*A small, fixed output space with a hard determinism requirement is exactly the case a lookup
beats a model.*
Opens on a "smart" categorizer that classifies invoices into one of six billing codes, at LLM
latency and LLM cost, when a keyword table would have been instant, free and exact. Teaches a
concrete decision procedure — output cardinality, determinism requirement, and error tolerance —
for when deterministic code dominates a model call.

**7. When the model's answer needs an undo**
*A revert can only tell "the model wrote this" from "the user typed this" if every write carries
its source.*
Opens on a document editor where "undo" after an AI rewrite also erased three sentences the user
had typed themselves in the meantime. Teaches span-level provenance tagging as the only way a
correction or revert path can act on machine-written content without touching human edits sitting
next to it.

### Part 4 — What Persists

**8. A conversation is a tree, not a list**
*The moment an interface lets you edit a past turn and regenerate, message history branches.*
Opens on a chat product where editing an old message and regenerating brought back an answer
that referenced a fact from the abandoned branch — because the server rebuilt context from the
full history, not the active path. Teaches conversation state as a tree with one active branch,
and why context assembly has to resolve which branch before every call, not just append.

**9. The review queue is a system, not a screen**
*Whether a review gate blocks the pipeline or runs beside it decides what "processed" means for
an item still waiting on a person.*
Opens on an extraction pipeline where "pending review" quietly meant "already used downstream" —
nobody had decided whether review was blocking or advisory, so the code did both inconsistently.
Teaches blocking (human-in-the-loop) vs. non-blocking (human-on-the-loop) as an architectural
choice with real latency and correctness consequences, plus the minimum audit-trail schema
(source output, decision, reviewer, timestamp) a queue needs to be trustworthy.

## 3. The mechanic test

1. Who catches the error, and when — a synchronous human turn changes *where* error-handling code has to live.
2. Confidence that means nothing — verbalized confidence is uncalibrated; sample agreement is a measurable proxy.
3. Streaming into a shape that isn't finished yet — `partial_json` fragments are unvalidated and must be accumulated before parsing.
4. The same input, a different answer each time — batching and floating-point order break determinism even at temperature 0.
5. Running the old system and the new one side by side — shadow mode compares outputs on real traffic with zero user exposure.
6. Deciding not to call the model at all — fixed small output space + determinism requirement predicts a lookup wins.
7. When the model's answer needs an undo — undo requires per-span source tags to separate machine writes from human edits.
8. A conversation is a tree, not a list — editable history makes context assembly a branch-resolution problem, not an append.
9. The review queue is a system, not a screen — blocking vs. non-blocking gate placement changes the pipeline's latency and correctness contract.

## 4. The cost of a new course

`app/learn/DESIGN.md`'s "Adding a fifth ink" rule says the palette (red, navy, forest, amber)
is nearly exhausted after Agents took the fourth. This course would be at best the sixth in the
queue behind the five already proposed — by the time it's built, there will almost certainly be
no ink left to give it, and DESIGN.md already anticipates that: "the next course may have to earn
its identity from the diagram's shape rather than a new ink." I'd take that at face value rather
than propose a new hue: this course should ship, if it ships, distinguished by line shape or
position on the network, not colour. Worth naming now so nobody spends a design pass hunting for
a colour that clears ΔE00 ≥ 12.7 against four inks that already use most of the available room.

## 5. Where it sits

- Assumes the Agents course's "loop" vocabulary (L1 references it) and produces exactly the
  labelled corpus (L9's review queue) that an Evaluating and Observing course would want to
  measure against — build this after both.
- **Overlap risk, flagged honestly:** L2 (confidence signals) and L9 (review-queue audit trail)
  are adjacent to `evals.md`'s territory (judges, tracing, drift). The distinction I'd hold: evals
  measure a system offline against a held-out set; this course is about routing and provenance
  decisions made online, per request, with no eval set required. If `evals.md` is built first,
  its author should read L2 and L9 before writing, the same way `agents.md` and `safety.md` had
  to be reconciled.
- L1 and L9 both touch `production.md`'s territory (latency, failover) at the edges — they're
  about *where* a check happens, not how fast the call runs, but a reader could reasonably
  wonder why sync-vs-async isn't in Production. Worth one cross-reference link, not a merge.
- Does not touch Multimodal, Fine-Tuning, or Securing LLM Systems at all.

## 6. Rejected

- **Classification and extraction as the boring high-value case** — already taught, at the
  mechanic level, by Prompt Engineering's "Output contracts" and "Validating what comes back."
  A tenth lesson here would repeat enums, schemas and boundary validation under a new name.
- **The shapes an LLM feature comes in (autocomplete / chat / pipeline / agent)** — real
  taxonomy, but every mechanic under it (latency budget, streaming, retries) already lives in a
  shipped or proposed lesson. What was left after removing those was a naming exercise, not a
  mechanic.
- **Automating a workflow end-to-end vs. assisting a human in it, as its own lesson** — folded
  into L1. Once you state the mechanic precisely (who catches the error), "assist vs. automate"
  is the same fact restated, not a second one.
- **Showing reasoning/thinking traces in a product UI** — Prompt Engineering's "Thinking out
  loud" already covers stripping the working from the display and keeping it in logs. Nothing
  left to add that isn't UI taste.

## 7. Sources

- [Two Samples Are Enough: Verbal Confidence Meets Self-Consistency in Reasoning LLMs](https://openreview.net/forum?id=66D3rZrNjV) — fetched via search summary; current (2026), grounds L2's sample-agreement claim.
- [Deploying Machine Learning Models in Shadow Mode — Neal Lathia](https://nlathia.github.io/2020/07/Shadow-mode-deployments.html) — fetched, 200. Older (2020) but the pattern is a stable MLOps mechanic, not a dated number; grounds L5.
- [Streaming Structured Output Without a Flickering UI](https://mosharif.me/blog/streaming-structured-output-ui) — fetched. Grounds L3's "don't render an unclosed scalar" rule.
- [Anthropic — Fine-grained tool streaming](https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming) — fetched, 200, current. Primary source for L3's draft: `input_json_delta`, `partial_json`, `eager_input_streaming`.
- [Anthropic — Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming) — fetched, 200, current. Confirms event ordering (`content_block_start` / `_delta` / `_stop`).
- [GitHub — st3w4r/openai-partial-stream](https://github.com/st3w4r/openai-partial-stream) — confirmed 200. Example of a maintained partial-JSON parser, used as a deeper link.
- [GitHub — itruf/PartialJSON](https://github.com/itruf/PartialJSON) — confirmed 200. Second partial-JSON parser, not fetched in full, link only.
- [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — confirmed 200.
- [Non-Determinism of "Deterministic" LLM Settings (arXiv 2408.04667)](https://arxiv.org/html/2408.04667v5) — fetched. Grounds L4: batching/floating-point causes non-determinism even at temperature 0.
- [Velt — Designing Human-in-the-Loop Workflows for AI Products](https://velt.dev/blog/designing-human-in-the-loop-workflows-ai-products) — fetched. Grounds L9's blocking-vs-non-blocking distinction and audit-trail schema.

**Could not retrieve:** a working SAP Community post on prompt caching and determinism
(`community.sap.com/.../the-hidden-behavior-of-llms...`) returned HTTP 403 — used the arXiv paper
instead. No YouTube transcript was used: I could not find a talk on this specific lens (product
engineering above the API call) with a retrievable transcript in the time available, and used
written engineering sources instead rather than invent a citation.
