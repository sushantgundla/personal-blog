# Expansion research — 2026-09-09

Seven passes run in parallel, each blind to the others. Four looked for what was
missing inside a course that already exists; three went hunting for whole new
sections through a different lens each, so they would not converge on the same
obvious answers.

Every pass was told the same thing: propose only what genuinely belongs, and a
short honest answer beats a padded one. All four course audits came back with
exactly two lessons. None of them reached for a third to look thorough.

## What shipped from this

Four lessons, one per existing course, drafted here and now live:

| Lesson | Course | Position |
|---|---|---|
| Sampling, and the knobs providers are taking away | LLMs | new 02 |
| Let a model write the prompt | Prompt Engineering | 11 |
| Parsing documents before you chunk them | RAG | 04 |
| Testing an agent without the model in the loop | Agents and Tool Use | new 06 |

## What did not ship, and why

Three new courses were found and specified in full. At the time this was
written, none of them could be built, for a reason that had nothing to do with
their quality:

| File | Course | Lessons |
|---|---|---|
| `new-data.md` | Data Pipelines for LLM Systems | 12 |
| `new-product.md` | After the Call | 9 |
| `new-frontier.md` | LLMs Over Structured Data | 10 |

`../../DESIGN.md` gives every course its own transit ink, and after amber there
was no fifth hue that cleared the rule written there. All three passes reached
that conclusion independently, without being told the others had. **That was
an open design decision and nothing here was meant to be built until it was
made.**

Data Pipelines was built and shipped anyway, once a fifth and sixth ink were
measured and cleared (`../../DESIGN.md`, "Adding a new ink"). It was pulled
soon after: the course taught data engineering, not building with LLMs, which
is a different remit from the rest of this site. Three of its twelve lessons
were genuinely RAG's plumbing and were kept, moved into `content/learn/rag/`.
`new-data.md` stays here as the original proposal.

The strongest lesson from each of the three is drafted in full alongside its
proposal — `new-data-draft.mdx`, `new-product-draft.mdx`,
`new-frontier-draft.mdx` — so the courses start from something real rather than
an outline. `new-frontier-draft.mdx` still has a Title Case title and three
blockquotes where the house style takes sentence case and one; fix that before
it ships.

## The unbuilt lessons

Each of the four audits proposed two lessons and only the stronger one was
drafted. Still specified and unwritten:

- **Why models hallucinate, mechanistically** — `llms.md`. The course says
  "confidently wrong" once and moves on, and the RAG citations lesson is a fix
  rather than an explanation.
- **Sampling and voting** — `prompt-engineering.md`. The failure retries cannot
  help with: a response that is well formed and wrong.
- **Iterative retrieval** — `rag.md`. Carries the seam against the Agents course.
- **When nobody is watching: agents on a schedule** — `agents.md`. The human
  gate and the trace-reading lesson both assume someone is there.

## On sources

Every URL in these files was fetched before it was cited, and each pass was told
to say plainly what it could not retrieve rather than fill the gap.

**No YouTube transcript was retrievable.** All seven passes tried; the fetch
returns page furniture rather than the transcript. They fell back to engineering
blogs, vendor documentation and papers they could actually read, and said so.
Worth knowing before anyone plans research that depends on video.
