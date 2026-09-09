# New course lens: the plumbing around the model

## 1. Verdict

**Full course.** The lens holds twelve distinct, sourced lessons that are
upstream and lifecycle concerns RAG's own twelve lessons don't cover - RAG
teaches how to search a corpus that already exists in good shape; this teaches
how a corpus gets into that shape and stays there while the business keeps
changing underneath it. Only one course came out of this lens - no second
candidate to rank against it.

## 2. Proposed course

**Data Pipelines for LLM Systems**
*Getting real data in, keeping it in sync, and not breaking retrieval when it changes underneath you.*

A RAG system is only as good as the corpus behind it, and nothing in the four
shipped courses explains how that corpus is built, kept fresh, or migrated.
This course is the plumbing: pulling documents out of the systems they live
in, keeping permissions and freshness correct as those systems change, turning
real usage into a dataset, and surviving the day the embedding model or the
corpus itself has to change under a live system.

### Part 1 — Getting data in
1. **From source system to corpus** — *Extraction is the bottleneck, not the embedding call.* Opens on a PDF with two columns that got read left-to-right across both, scrambling every sentence. Teaches connectors vs. hand-rolled extraction, parsing formats, and why layout-aware parsing is most of the ingestion budget.
2. **One document, five copies** — *Canonical sources and deduplication.* Opens on a support bot citing a policy that was superseded eight months ago, still live because nobody deleted the old file from the wiki that also feeds the index. Teaches near-duplicate detection (MinHash/Jaccard) and picking one system of record.
3. **The schema you wish you'd written on day one** — *Designing metadata before you index.* Opens on a corpus with no way to tell which chunks came from which document version. Teaches IDs, content hashes, source URL, version, and provenance fields decided before ingestion, not bolted on after.

### Part 2 — Staying in sync
4. **Nightly is a design choice, not a default** — *Freshness and incremental re-indexing.* Opens on an editor's 2pm policy fix that every user still can't see at midnight. Teaches poll vs. webhook vs. change-data-capture, and picking a freshness SLA on purpose instead of by default.
5. **Permissions that travel with the data** — *Syncing ACLs into the index, not just enforcing them at query time.* Opens on a user who lost access to a folder last week and can still retrieve it through search. Builds on RAG lesson 06's "enforce in the query" by covering the half before that: getting the permission bits in, and keeping them current as they change upstream.
6. **Deleting is a feature** — *Tombstones, revocation, and the right to be forgotten.* Opens on a document deleted from the source three months ago that a reader still gets cited to them. Teaches soft-delete markers, revocation propagation, and why "just re-index everything" isn't a real deletion story.

### Part 3 — The corpus over time
7. **What your users already told you** — *Turning production traffic into a dataset.* Opens on a team debating a prompt change with no data, while six months of thumbs-down clicks sit unused in a log table. Teaches logging, sampling for review, and the data-flywheel idea of feeding real failures back into evals.
8. **Labelling is engineering, not an afterthought** — *Annotation as a practice, not a one-off spreadsheet.* Opens on two labelers disagreeing on a third of a hand-built eval set with nobody having checked agreement. Teaches guidelines, inter-rater agreement, and annotation queues as infrastructure.
9. **Changing the embedding model underneath a live index** — *Migrating without mixing two incompatible vector spaces.* Opens on search quality quietly splitting between old and new documents after a one-line model swap. Full draft below.
10. **When the corpus itself has to move** — *Schema migrations and re-chunking a live index.* Opens on a chunking strategy that has to change and no way to run the old and new chunk sizes side by side. Teaches versioned chunk schemas and staged cutovers, the same discipline as lesson 9 applied to structure instead of the model.

### Part 4 — The storage layer
11. **One corpus, three storage tiers** — *Raw blobs, parsed documents, and chunks-plus-vectors are three different jobs.* Opens on a team that re-parses a PDF from scratch every time chunking strategy changes, because nothing kept the intermediate parsed text. Teaches the multi-tier storage architecture, distinct from RAG lesson 04's array-vs-store ladder for the vector tier alone.
12. **Reading the ingestion pipeline's own trace** — *Debugging silent parse failures and partial batches.* Opens on an ingestion job that reports success while a third of a batch silently failed to parse and never made it into the index. Closes the course the way Agents lesson 12 closes that one: how to tell the pipeline broke before a reader does.

## 3. The cost of a new course

`app/learn/DESIGN.md`'s "Adding a fifth ink" rule requires a new colour to clear
family (chroma range), ground contrast, and a ΔE00 colour-blind floor against
every existing ink — and it already says amber (the fourth) is close to using
up the hues that survive that floor. This course would be the fifth. Given
that, and that `app/learn/research/README.md` already flags this exact wall
("the next course may have to earn its identity from the diagram's shape
rather than a new ink"), I'd spend the effort there first: test whether a
distinct line pattern or shape reads clearly against the four existing inks
before committing to searching for a colour that may not exist. If no shape
solution clears review, this content is strong enough to justify the ink
search rather than being cut for it — but that's a design call, not mine to
make from content alone.

## 4. Where it sits

Downstream of all four shipped courses and complementary to, not competing
with, RAG (which assumes a clean corpus already exists) and Agents (whose
"memory after the run ends" lesson 07 is about an agent's own state, not a
retrieval corpus). Against the five already-proposed courses: no overlap with
Agents and Tool Use, Evals and Observability, Production, Fine-Tuning, or
Multimodal — this is the only proposal about the corpus itself rather than the
model call around it. Build order: after RAG and Agents ship, since three
lessons (5, 9, 10) explicitly reference RAG lessons 06 and 10 by name.

## 5. Rejected

- **Data warehousing / lakehouse architecture for AI** — too general-purpose data-engineering, not LLM-specific enough to justify a slot here.
- **Building a labelling tool from scratch** — a build-a-framework lesson; the practice of annotation, not a specific tool, is what's durable.
- **Streaming ingestion frameworks (Kafka/Flink deep dive) as their own lesson** — CDC as a concept survives; naming and comparing streaming frameworks would date within a year and reads as framework-as-subject, which is against the rules here.
- **"Data contracts" as a named industry term** — real practice, but it's schema design (lesson 3) under a vendor-coined label; folded in rather than given its own lesson.
- **Vector database vendor comparison for storage tiers** — RAG lesson 04 already owns that ground; lesson 11 here is deliberately about the three tiers, not re-litigating which vector store to pick.

## 6. Sources

Fetched and used:
- Qdrant, "Migrate to a New Embedding Model" — https://qdrant.tech/documentation/tutorials-operations/embedding-model-migration/ — vendor doc, current, gave the dual-write/blue-green and named-vector migration patterns.
- arXiv 2509.23471, "Drift-Adapter" — https://arxiv.org/abs/2509.23471 — paper, posted 2025, gave the lightweight-adapter alternative to full re-embedding.
- tianpan.co, "Embedding Models in Production: Versioning and the Index Drift Problem" — https://tianpan.co/blog/2026-04-09-embedding-models-production-versioning-index-drift — engineering blog, dated April 2026, gave the index-drift framing and alias-based versioning.
- MTEB leaderboard — https://huggingface.co/spaces/mteb/leaderboard — live, confirmed it's the standard public embedding benchmark, used to make the "benchmark ≠ your domain" point honestly.
- OSO, "The Right Approach to Authorization in RAG" — https://www.osohq.com/post/right-approach-to-authorization-in-rag — vendor engineering blog, dated 2025, grounded lesson 5's authorization-gap framing.
- blog.nelhage.com, "Finding near-duplicates with Jaccard similarity and MinHash" — https://blog.nelhage.com/post/fuzzy-dedup/ — independent engineering blog, grounded lesson 2's dedup mechanics.
- Conduktor, CDC glossary — https://www.conduktor.io/glossary/what-is-change-data-capture-cdc-fundamentals — vendor-neutral glossary, grounded lesson 4's log-based vs. polling explanation.
- hamel.dev, "AI Evals" notes — https://hamel.dev/notes/llm/evals/ — practitioner blog, grounded lesson 7 and 8's production-traffic-to-dataset framing.

Searched (snippets only, not fetched, used only to find the above and to
survey the landscape, not cited as facts): kapa.ai, Extend, oneuptime.com,
Vectorize docs, Medium/dev.to RAG-pipeline explainers, Truto, Microsoft/Azure
AI Search docs, ClaudeDrive, NVIDIA data-flywheel glossary, Unstructured.io
and Unstract product pages, Airbyte/Fivetran mentions, various arXiv corpus-dedup papers (Blu-WERP, MAP-Neo, MathPile, Olmo 3).

Could not retrieve: `medium.com/real-time-data-evolution/...keep-retrieval-actually-fresh` returned HTTP 403 — used Conduktor's CDC glossary instead for lesson 4's grounding.
