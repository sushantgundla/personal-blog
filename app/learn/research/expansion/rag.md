# RAG course — gap audit (2026-09-09)

## 1. Verdict

This is still the most complete of the four courses. The pipeline from embeddings
through citations holds together, and nothing inside it is thin. The gaps are at
the two edges — before the pipeline starts and after it stops working — exactly
where the previous audit (`app/learn/research/gaps.md`) pointed. I verified both
against outside sources and both are real, current, and distinct from what the
Agents course already owns.

Two lessons missing, ranked:

1. **Parsing documents before you chunk them.** Chunking (03) already admits
   "PDFs love to emit column-shuffled text" and tells the reader to look at
   fifty raw chunks — but never teaches what to do about it. Every source I
   checked treats this as the actual point of failure in production RAG, ahead
   of the model or the chunk size. Higher priority: it gates everything
   downstream, and readers hit it before they hit anything else in the course.
2. **Iterative retrieval — searching more than once.** `12-when-rag-is-wrong.mdx`
   names this in two sentences ("agentic search... a loop") and stops. 2026
   sources (Redis, Towards Data Science, Microsoft) treat retrieve-reason-decide
   as a standard fourth generation of retrieval, not an edge case.

No padding beyond these two — I looked hard for a third and didn't find one that
wasn't already someone else's course (see Rejected).

## 2. Proposed lesson specs

### A. Parsing documents before you chunk them

- **Title:** Parsing documents before you chunk them
- **Subtitle:** The step chunking assumes already happened — turning a scanned page, a multi-column PDF, or a table into text worth splitting.
- **Joins:** Part 1 (Embeddings), as new lesson 3, immediately before `03-chunking.mdx`. Renumber `03`–`12` up one file each (`03→04` ... `12→13`).
- **Why (opener):** You pointed your chunker at a folder of PDFs and it ran without complaining. Retrieval came back wrong in three specific ways: a sentence from the left column glued to one from the right, a pricing table flattened into a line of bare numbers with no headers, and a scanned invoice that produced no text at all. You spent two days on chunk size and swapping embedding models. None of it helped, because the input was already wrong before the chunker ever saw it.
- **Sections:**
  1. *What a naive parser throws away* — a PDF stores positioned glyphs, not reading order or table structure; a basic extractor reproduces the glyph stream, so multi-column pages interleave and tables flatten into runs of digits nobody can attribute to a column.
  2. *Matching the tool to the document* — plain text extraction for clean born-digital text; a layout-aware parser (Unstructured, LlamaParse, PyMuPDF) for structured PDFs that need reading order and block types restored; OCR for scanned pages with no text layer at all; a vision-capable model reading the page image directly when the layout is too irregular for a parser to get right.
  3. *Tables, and knowing when parsing is the problem* — convert every table to markdown or JSON before it reaches the chunker, because a flattened table looks like data and lies about it; then the diagnostic habit — read fifty raw extracted chunks yourself before touching chunk size, the embedding model, or anything downstream, because none of those can fix text that arrived already broken.
- **Comparison table:** rows = plain text extraction / layout-aware parser / OCR / vision-model page reading; columns = handles scanned pages, preserves table structure, reading order on multi-column pages, cost, best for.
- **Code block:** one Python example sending a scanned page to Claude as a `document` content block (`type: "document"`, `source: {type: "base64", media_type: "application/pdf", data: ...}`) and asking it to return every table as markdown with headers attached — the vision-model path from section 2, made concrete.
- **Wins:** read the raw extracted text before blaming chunking or the model; match the tool to the document (plain / layout-aware / OCR / vision); convert every table to markdown or JSON before chunking; keep page number and block type on every extracted piece; treat garbled input as a parsing bug, not a retrieval bug.
- **Quiz:** 5 questions on why multi-column text interleaves, what a flattened table loses, when OCR vs a layout parser is the right tool, what to check first when retrieval looks bad, and the honest cost of the vision-model path. Full text in the shipped draft.
- **Deeper:** Unstructured docs, LlamaParse docs, PyMuPDF docs, Claude PDF support docs — all curled, all HTTP 200.

**This is the lesson I wrote in full — see `/tmp/learn-expansion/rag-draft.mdx`.**

### B. Iterative retrieval — searching more than once

- **Title:** Iterative retrieval — searching more than once
- **Subtitle:** Let the loop search again when the first pass came back thin, and know exactly when to make it stop.
- **Joins:** Part 3 (Retrieval), as new lesson 10, right after `09-query-rewriting.mdx`. Renumber `10→11`, `11→12`, `12→13`.
- **Why (opener):** Decomposition (lesson 09) splits a question into sub-queries you can name up front — "refund policy" and "exchange policy" — and retrieves for both. Some questions don't work that way: "find the incident that caused this regression, then tell me who reviewed the fix" needs the first search to finish before you know what the second one is even for. One retrieval pass has no way to ask a follow-up.
- **Sections:**
  1. *When one pass, or even a decomposed one, isn't enough* — the shape of dependent lookups, and the line between "I can name all my sub-queries now" (decomposition) and "I need the first answer to write the second query" (iterative retrieval).
  2. *The loop: retrieve, reason, decide* — reuses lesson 07's hybrid search, lesson 08's reranker, lesson 09's rewrites as the tools called inside the loop; the decision each round is retrieval-specific (is the evidence enough to cite, or do I search again, switch source, or give up), not the general "which tool do I call next" decision the Agents course teaches.
  3. *Stopping it* — hard iteration cap, cost budget, a confidence/citation-coverage threshold, and detecting thrash (the same chunk keeps coming back with no new information, which means stop, not try again).
- **Comparison table:** single-pass retrieval / decomposition / iterative retrieval — columns: are the sub-queries known up front, number of model calls, best for, main risk.
- **Code block:** a retrieve-reason-decide loop in Python with an explicit `max_iterations` and a thrash check (stop if the top result id repeats with no new chunk ids).
- **Wins, quiz, deeper:** same shape as above; deeper links would be the Redis and Towards Data Science pieces below plus the Microsoft `ai-agents-for-beginners` lesson and one paper (IRCoT or the reasoning-RAG survey), all confirmed 200.
- **Distinctness from the Agents course, stated for whoever writes it:** "A loop, not a brain" teaches that a loop exists at all; "Planning a run, and knowing when to stop" teaches generic run budgets. This lesson is retrieval's version of "knowing when to stop" — specifically what counts as enough *evidence*, which is a recall/citation question, not a task-completion question. Say this explicitly in the lesson's opening paragraph so it doesn't read as a rerun.

I did not write this one in full — the ingestion lesson was the stronger, more self-contained pick, and doing both in full wasn't asked for.

## 3. Expansions

- `03-chunking.mdx` — once the parsing lesson exists, add one sentence at the end of its final paragraph ("PDFs love to emit column-shuffled text...") pointing forward to it by name, so the two lessons don't say the same thing independently.
- `12-when-rag-is-wrong.mdx` — once the iterative-retrieval lesson exists, add one clause to the "Agentic search" row/paragraph in section 2 pointing to it, e.g. "the loop itself is covered in lesson 10." No content change beyond the pointer; both paragraphs are already correct, just now redundant with a full lesson.

No other lesson needs a section added — the pipeline (embeddings → chunking → storage → retrieval → citations) doesn't have a gap in the middle.

## 4. Rejected

- **GraphRAG as its own lesson** — real pattern, but `12-when-rag-is-wrong.mdx` already covers it in one paragraph correctly, and a fuller lesson would end up teaching a specific framework (Microsoft GraphRAG), against the site's no-framework rule.
- **Multimodal RAG (embedding images/charts, VLM retrieval)** — a genuine 2026 pattern, but it belongs to the multimodal course that's already spoken for; flagging so it isn't lost.
- **Semantic/agent caching for retrieval latency** — real (Redis's Iris pitch centers on it) but it's a production-cost concern, which is the production-engineering course's territory, not RAG mechanics.
- **RAG-specific eval frameworks (Ragas etc.)** — overlaps the evals/observability course already proposed elsewhere; lesson 10 (measuring retrieval) already teaches the metrics themselves without naming a framework, correctly.
- **"Context engines" / unified retrieval infrastructure** — every source describing this was vendor content pitching a specific product; not a teachable mechanic, just marketing shaped like one.
- **A separate lesson on routing across multiple knowledge bases** — the routing code and reasoning already live in `12-when-rag-is-wrong.mdx` section 3; not enough new mechanics to justify splitting it out.

## 5. Sources

Fetched and read:

- https://www.omdena.com/blog/document-parsing-for-rag — parsing-first-failure thesis, tool recommendations (Unstructured, LlamaParse, Textract, Document AI, VLMs), PyMuPDF-over-PyPDF advice. Titled "for 2026," reads current.
- https://redis.io/blog/agentic-retrieval-techniques/ — definition of agentic retrieval, the retrieve-reason-decide framing, four-generation history (keyword → vector → modular → agentic), matching/routing/query-formulation/caching taxonomy. Published 2026-05-23, updated 2026-05-27.
- https://towardsdatascience.com/agentic-rag-vs-classic-rag-from-a-pipeline-to-a-control-loop/ — the control-loop framing, explicit stopping conditions, named failure modes (retrieval thrash, tool cascades, stop-condition bugs). Current terminology, no visible staleness.
- https://github.com/microsoft/ai-agents-for-beginners/blob/main/05-agentic-rag/README.md — a live teaching lesson on agentic RAG; confirms the loop is taught as quality-threshold-driven, not step-count-driven, elsewhere too.
- https://platform.claude.com/docs/en/build-with-claude/pdf-support — used to verify the exact `document` content-block shape (`type: "document"`, `source.type: "base64"`, `media_type: "application/pdf"`) before putting it in the draft's code block. Live docs, fetched today.
- https://www.anthropic.com/news/contextual-retrieval — re-fetched to confirm it does *not* cover parsing/OCR, ruling out double-coverage with my proposed lesson.

Confirmed reachable (HTTP 200 via curl) but not deep-read, used only as candidate `deeper` links: https://docs.unstructured.io/, https://docs.llamaindex.ai/en/stable/llama_cloud/llama_parse/, https://docs.aws.amazon.com/textract/, https://cloud.google.com/document-ai/docs, https://pymupdf.readthedocs.io/, https://arxiv.org/abs/2212.10496.

Could not retrieve: YouTube transcripts. I fetched `youtube.com/watch?v=tLMViADvSNE` ("Every RAG Strategy Explained in 13 Minutes") directly; WebFetch returned only page navigation and footer, no transcript or description text. Used the Redis and Towards Data Science articles instead, both of which I could actually read.
