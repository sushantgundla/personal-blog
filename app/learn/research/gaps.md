# Gap audit — LLMs, Prompt Engineering, RAG (as of 2026-09-08)

## 1. Verdict

1. **A working code sample is now broken.** `content/learn/llms/02-base-instruct-and-reasoning.mdx` runs `thinking={"type": "enabled", "budget_tokens": 2000}` against `model="claude-sonnet-5"`. Anthropic's current docs confirm Claude Sonnet 5 rejects `type: "enabled"` with a 400 error — it only supports the newer "adaptive thinking" (`type: "adaptive"`, `output_config.effort`). This is the single most concrete fix needed.
2. **No course covers tool-use/agent loops as their own topic.** All three courses end with a reader who can prompt, retrieve, and validate one call at a time, but nobody teaches the "call a tool, read the result, decide the next step" loop, or where MCP (now the standard tool-connectivity layer in 2026) fits. This is the biggest structural gap and the natural thing a reader wants next after finishing all three courses.
3. **Multimodal input (images, PDFs, audio) is absent everywhere.** Not one lesson across 32 covers vision/audio input, despite it being standard in every frontier model by 2026 and directly relevant to RAG ingestion and prompt design.
4. **35 `docs.anthropic.com` links across all three courses now 301-redirect** to `platform.claude.com`. Not dead, but the whole domain has moved — worth a bulk find-and-replace rather than 35 individual fixes.

## 2. Per course

### LLMs

**Missing lessons**
- *Multimodal models* — what vision/audio input costs in tokens, why an image is not "free," and how this changes lesson 1's token-budget mental model. Slot after lesson 3 (context windows) or as a new part.
- *Fine-tuning your own model* — mentioned only as a comparison-table row in `rag/12-when-rag-is-wrong.mdx`; never taught. Natural fit after lesson 8 (`running-a-model-yourself.mdx`), in Part 3.

**Expansions**
- `02-base-instruct-and-reasoning.mdx` — the "reasoning tokens" section and code sample are written entirely around the old manual `budget_tokens` API, now deprecated for Sonnet 4.6+/Opus 4.6+ and outright rejected (400) on Claude Sonnet 5, Opus 5, Fable 5.1 and later. Needs a rewrite to `thinking: {type: "adaptive"}` + `effort`.
- `05-what-you-actually-pay-for.mdx` and `09-picking-a-model.mdx` — OpenAI code samples use `gpt-4o` / `gpt-4o-mini`, models from 2024. Given the site's own "no benchmark numbers that will date" rule, swap for placeholder names (`CHEAP_MODEL` / `STRONG_MODEL` env vars, which lesson 09 already half-does) rather than a literal, now-stale model id.

### Prompt Engineering

**Missing lessons**
- *Tool use and agent loops* — "Loop: call a tool, read the result, decide the next call." Belongs in Part 2 or as a new Part 5, and should introduce MCP by name as the 2026-standard way tools are wired to models, since `09-prompt-injection.mdx` already discusses tool-granting risk without naming the protocol most readers will actually be using.
- *Prompting with images and documents* — how attaching an image/PDF changes message shape and cost (ties to LLMs multimodal gap above).

**Expansions**
- `09-prompt-injection.mdx` — real 2026 injection surface now includes poisoned/malicious MCP servers and tool descriptions, not just fetched web content. Worth a paragraph under "indirect injection," since MCP server registries (with unreviewed community servers) are exactly the new "content your app fetched" this lesson warns about.

### RAG

This course is the most complete of the three — the pipeline from embeddings through citations is genuinely thorough and current. The gaps are at the edges, not the middle.

**Missing lessons**
- *Agentic / iterative retrieval* — `12-when-rag-is-wrong.mdx` gestures at "agentic search" in two paragraphs and calls it out as the fix for multi-hop questions, but 2026 sources treat iterative, agent-driven retrieval as a baseline pattern, not an edge case. Deserves its own lesson in Part 3, after hybrid search and reranking, covering the search-read-decide loop and its stopping conditions.
- *Ingesting messy documents (parsing, OCR, tables, images)* — `03-chunking.mdx` mentions in passing that "PDFs love to emit column-shuffled text" but never teaches parsing. Given RAG systems increasingly ingest scanned PDFs and slide decks, this is a real hole before chunking even starts.

**Expansions**
- `12-when-rag-is-wrong.mdx` — the GraphRAG and agentic-search paragraphs are correct but thin; if the missing lesson above isn't written, at minimum expand these two paragraphs.

## 3. Stale content

- `content/learn/llms/02-base-instruct-and-reasoning.mdx` — the code sample's `thinking={"type": "enabled", "budget_tokens": 2000}` against `model="claude-sonnet-5"` no longer runs; current Anthropic docs say Sonnet 5 requires `type: "adaptive"` and returns a 400 on `type: "enabled"`. This is broken, not just dated.
- `content/learn/prompt-engineering/05-thinking-out-loud.mdx`, final section ("Reasoning models") — describes thinking as "you set a thinking budget," which is the manual mode now deprecated/removed on current-generation models in favor of adaptive thinking with effort levels. Not broken code (no sample), but the mental model is out of date.
- `content/learn/llms/05-what-you-actually-pay-for.mdx` and `content/learn/llms/09-picking-a-model.mdx` — `gpt-4o` / `gpt-4o-mini` as example model ids are two years stale by site's own standard.

No prices, benchmark numbers, or model rankings were found baked into prose — the course is disciplined about that rule specifically.

## 4. Dead links

None outright dead. One systemic issue: all 35 `https://docs.anthropic.com/...` links (spread across all three courses) now issue a 301 to the equivalent `https://platform.claude.com/docs/...` path. Checked several by hand (`extended-thinking`, `agents-and-tools/tool-use/overview`, `prompt-engineering/chain-of-thought`) — all redirect and the destination content is live and current. Recommend a bulk domain swap rather than auditing each one individually.

## 5. Sequencing and seams

- A reader who finishes all three courses has no answer for "how do I wire a model, a tool, and a retriever together into something that loops" — none of the three courses teach the agent loop itself, only its pieces (tool schemas in PE, retrieval in RAG, model choice in LLMs).
- `rag/12-when-rag-is-wrong.mdx` and `prompt-engineering/04-decomposition.mdx` both describe multi-step pipelines with a router in front — reasonable, not a real seam, but worth noting they never cross-reference each other despite covering the same "route first" idea from two directions.
- `llms/02-base-instruct-and-reasoning.mdx` and `prompt-engineering/05-thinking-out-loud.mdx` are the two lessons most exposed to the adaptive-thinking change above; fixing one without the other will leave an inconsistency between courses.

## 6. Sources

- https://atlan.com/know/what-is-rag/
- https://medium.com/@elammarisoufiane/rag-in-2026-architecture-shifts-emerging-patterns-and-what-it-means-for-java-developers-6f2803e39787
- https://towardsdatascience.com/beyond-rag/
- https://tedt.org/MCPs-2026-Roadmap/
- https://sureprompts.com/blog/model-context-protocol-mcp-complete-guide-2026
- https://www.bentoml.com/blog/multimodal-ai-a-guide-to-open-source-vision-language-models
- https://futureagi.com/blog/exploring-how-multimodal-large-language-models-work/
- https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking (fetched directly to confirm the Sonnet 5 behaviour)
