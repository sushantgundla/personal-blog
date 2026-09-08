# Research — what to teach next

Six proposals, written 2026-09-08, for courses beyond the first three. Each was
researched independently against the live web, so they do not know about each
other; the overlaps at the bottom of this file are real and have to be resolved
before two of them are built.

`PRODUCT.md` at the repo root is the product truth these were written against,
and `../DESIGN.md` is the visual contract any new course has to obey.

## The files

| File | What it proposes | Verdict |
|---|---|---|
| `agents.md` | Agents and Tool Use — the loop, tool schemas, MCP, sandboxing | One course, 12 lessons |
| `evals.md` | Evaluating and Observing LLM Systems — eval sets, judges, tracing, drift | One course, 12 lessons |
| `production.md` | Production — streaming, latency, caching, failover, cost as architecture | One course, 11 lessons |
| `safety.md` | Securing LLM Systems — indirect injection, trust boundaries, PII, isolation | One course, 11 lessons |
| `adaptation.md` | Multimodal, and Fine-Tuning | Two courses, 11 lessons each |
| `gaps.md` | An audit of the three courses that already exist | Findings, not a course |

## Build order

1. **Agents and Tool Use.** Two of the six found this independently: a reader who
   finishes all three existing courses can prompt, retrieve and validate one call
   at a time, and nothing teaches the loop that ties them together. It is also
   the most searched of the six.
2. **Evaluating and Observing.** Both `Versioning and testing prompts` and
   `Measuring retrieval` already assume eval infrastructure the reader has not
   been shown how to build.
3. **Production.** Everything about the call once real traffic hits it.
4. **Multimodal.** Genuinely absent from all thirty-two lessons. Trim it first —
   three of its lessons duplicate ground the existing courses already hold.
5. **Securing LLM Systems.** Real, but it collides with 1 and 3 more than any
   other pair in the set. Resolve the overlap before writing a word of it.
6. **Fine-Tuning.** Its own proposal calls it a literacy course. Most of this
   audience will never do it.

## Overlaps to resolve

Each proposal was written blind to the others, so these are the same lesson
twice:

- `safety.md` L4 "trust boundary around tool calls" and `agents.md` L9 "Letting
  an agent touch the real world".
- `safety.md` L10 "Denial-of-wallet" and L5 "Tenant isolation" against
  `production.md` L10 "Cost control as architecture" and L11 "Keys, secrets and
  multi-tenant isolation".
- `agents.md` L11 "Why the bill exploded" and `evals.md` L12 "Latency and cost as
  first-class metrics" both against `production.md` Part 1.
- `adaptation.md` Multimodal L1 "Structured Output" against Prompt Engineering's
  existing "Output contracts", and its L2 "Long Documents" against the LLMs
  course's "Context windows and their limits".

## The constraint nobody costed

`../DESIGN.md` fixes the palette at three transit inks, one per course, and
`../learn.css` hardcodes them as `--ln-llms`, `--ln-prompt` and `--ln-rag` in
both themes. Every course after the third needs a new ink that holds 4.5:1 in
dark and light and stays apart from the others for a colour-blind reader, plus
an amendment to the design contract. That is a design decision, not a content
one, and it comes before the first lesson of course four.

## What `gaps.md` found in the shipped lessons

Four defects, all fixed and deployed on 2026-09-08 — kept here because the audit
is the record of how they were found, not because they are still open. The
thinking-budget API and the sampling knobs had both moved under the lessons.
