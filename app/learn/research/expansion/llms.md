# LLMs course — gap audit (2026-09-09)

## 1. Verdict

**Two lessons**, both genuine holes, not padding:

1. **Sampling — temperature, top-p, top-k, and why providers are removing them.** Every code sample in this course and the Prompt Engineering course sets `temperature=0` or `temperature` without ever explaining what it does. Worse, it's actively going stale: Anthropic's models released after Claude Opus 4.6 reject any temperature but the default (1.0) with a 400, and reject `top_k` outright — a fact `prompt-engineering/08-retries-and-fallbacks.mdx` and `10-versioning-and-testing-prompts.mdx` already mention in passing but never explain the mechanism behind. Every outside tutorial I found teaches the old, now-partially-wrong universal model.
2. **Why models hallucinate, mechanistically.** Lesson 01 says in one line "it can be confidently wrong about one" fact and moves on. No lesson explains *why* — that generation is a training/eval incentive problem, not a bug, per OpenAI's 2025 paper. RAG's "citations and grounding" is a fix, not an explanation, and it doesn't help someone using a bare model with no retrieval.

## 2. Proposed lesson 1: Sampling, and the knobs providers are taking away

- **Title:** Sampling, and the knobs providers are taking away
- **Subtitle:** Temperature, top-p, and top-k explained — and why the frontier models are quietly refusing to let you touch them.
- **Slot:** Part 1 ("The machine"), after lesson 01 (`what-a-model-is-made-of`) and before lesson 02 (`base-instruct-and-reasoning`) — it's the missing step between "tokens in" and "which model type", and 02's reasoning-model section already assumes the reader knows what a sampling knob is.
- **Why opener:** dev sets `temperature=0.2` per every tutorial online, to stop an extraction step rephrasing fields inconsistently between runs. Gets a 400: temperature deprecated for this model. No replacement knob exists — just a note the model now accepts one fixed value.
- **Sections:**
  1. *A forward pass ends in a distribution, not a word* — logits, softmax, greedy decoding, and why greedy alone degenerates into bland repetition (Holtzman et al.).
  2. *Three knobs on the same distribution* — temperature (rescales all logits equally), top-k (fixed headcount), top-p (adaptive cumulative cutoff) — and that none of them affect correctness, only variety.
  3. *Why the labs are removing the knobs, and what replaces them* — Anthropic's post-Opus-4.6 models reject non-default temperature/top_p/top_k; extended thinking enforces temperature=1; OpenAI did the same on its reasoning line; temperature=0 was never a true determinism guarantee anyway (floating-point + batching); replacements are schema validation for consistency and self-consistency (sample N, take the mode) for reasoning accuracy.
- **Table:** the three knobs — what it changes / narrow setting / wide setting / where it goes wrong.
- **Code block:** one Anthropic call that hits the 400 on `temperature=0.2`, followed by a `self_consistent_answer()` function that samples 5 times and returns the most common answer via `Counter`.
- **wins / quiz / deeper:** full 5/5/4 written into the draft.

Full spec and exact copy is written out as the shipped draft — see below, this is the one I wrote in full.

## 3. Proposed lesson 2: Why a model states a wrong fact with total confidence

- **Title:** Why a model states a wrong fact with total confidence
- **Subtitle:** Hallucination is not a bug you patch — it's what generation does when guessing scores better than admitting doubt.
- **Slot:** Part 1, after the new sampling lesson (so it lands after base/instruct/reasoning, which is where "confidently wrong" first gets said in passing in lesson 01) — practically, after current lesson 02.
- **Why opener:** a reader asks the model for a citation, a version number, or a person's job title, gets a clean confident-sounding answer, and it's wrong — not vague-wrong, specifically and fluently wrong, in a way that reads exactly like a correct answer would.
- **Sections:**
  1. *There is no "I don't know" token* — the model always outputs a distribution over next tokens; refusing to answer isn't a special mode, it's a learned behavior, and it competes against every other continuation the same way a correct answer does.
  2. *Training rewards a good guess over an honest shrug* — OpenAI's Kalai et al. (2025) result: standard training/eval scores guessing above admitting uncertainty, and a formal bound that generation error is at least double classification error on the same fact.
  3. *What actually reduces it, and what doesn't* — self-consistency and asking for direct quotes/verification passes help; a bigger model or lower temperature does not fix it because it isn't a sampling problem (ties back to lesson 1); RAG's grounding is the real fix when there's a document to point at, and this lesson is explicit that it isn't one when there isn't.
- **Table:** compares "what people think causes hallucination" vs "what the mechanism actually is" (e.g. "the model is lying" vs "there's no distinction in training between a lie and a guess that didn't pay off").
- **Code block:** a small script asking the same factual question 5 times at whatever sampling is available and printing whether the specific wrong claim (a fabricated date, say) is stable across samples — showing that confidence in phrasing doesn't correlate with the model repeating the same fabrication.
- **wins:** know there's no internal "confidence" the model consults before answering; expect fluency and correctness to be totally uncorrelated signals; don't fix a hallucination rate with a bigger model alone; ask for a claim to be checked against a source rather than trusting the tone it's stated in; treat "I don't know" as something you have to explicitly reward or prompt for, not a default.
- **quiz (5 sketched, not written to full spec — this is the one I left as a sketch, see verdict):** why there's no internal doubt signal; the OpenAI finding in one sentence; why grounding (RAG) fixes a different failure than this lesson describes; why a reasoning model still hallucinates; what a "calibration" eval actually measures.
- **deeper:** OpenAI — Why Language Models Hallucinate (arXiv 2509.04664 or the PDF at `cdn.openai.com/pdf/.../why-language-models-hallucinate.pdf`), TruthfulQA (arXiv 2109.07958), Anthropic — Reduce hallucinations (`platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations`), Kadavath et al. — Language Models (Mostly) Know What They Know (arXiv 2207.05221).

I wrote lesson 1 out in full as the shippable draft (time/scope tradeoff — see Rejected). Lesson 2 is specced to the same depth of structure above but not written as complete prose/quiz copy.

## 4. Expansions to existing lessons

- `content/learn/llms/01-what-a-model-is-made-of.mdx` — the line "It can be confidently wrong about one" (fact) is the seed of the hallucination lesson; once that lesson exists, add one sentence there pointing forward to it, the way lesson 07 already forward-references lesson 08.
- `content/learn/prompt-engineering/08-retries-and-fallbacks.mdx` and `10-versioning-and-testing-prompts.mdx` — both already state "Anthropic's current models do not accept `temperature` at all" as an aside. Once the sampling lesson exists, these two should link back to it instead of re-explaining the fact inline.

## 5. Rejected

- **Structured output / JSON mode as its own lesson** — real gap in general, but Prompt Engineering already has `08-output-contracts.mdx`-equivalent ("Output contracts"); a sampling-adjacent structured-decoding lesson would overlap it too much.
- **Embeddings, fine-tuning, multimodal** — explicitly out of scope per the brief (RAG owns embeddings; fine-tuning and multimodal are separate future courses).
- **Streaming mechanics as its own lesson** — already covered adequately inside `06-rate-limits-and-reliability.mdx`; not enough left over for a full lesson.
- **Statelessness / conversation-state as its own lesson** — already stated plainly in `04-the-big-three.mdx` ("stateless... billed per token"); thin material, not a lesson.
- **A dedicated "knowledge cutoff" lesson** — real reader confusion, but it's one paragraph of content, not three sections; better as a two-line addition somewhere than a lesson.

## 6. Sources

- https://arxiv.org/abs/1904.09751 — Holtzman et al., "The Curious Case of Neural Text Degeneration" (nucleus sampling origin paper). Fetched, 200. Timeless — it's the original research, not a dated claim.
- https://platform.claude.com/docs/en/api/messages — fetched directly; confirms temperature/top_p/top_k deprecation text verbatim for models after Claude Opus 4.6. Current as of fetch today.
- https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting — fetched, 200. Confirms extended thinking requires default temperature.
- https://arxiv.org/abs/2506.07295 — "Exploring the Impact of Temperature on Large Language Models." Fetched, 200.
- https://arxiv.org/abs/2509.04664 and https://cdn.openai.com/pdf/d04913be-3f6f-4d2b-b283-ff432ef4aaa5/why-language-models-hallucinate.pdf — Kalai, Nachum, Vempala, Zhang, "Why Language Models Hallucinate" (OpenAI, Sept 2025). Both fetched, 200.
- https://arxiv.org/abs/2109.07958 — TruthfulQA. Fetched, 200.
- https://arxiv.org/abs/2207.05221 — Kadavath et al., "Language Models (Mostly) Know What They Know." Fetched, 200 (URL check only, not read in full).
- Could not retrieve: `openai.com/index/why-language-models-hallucinate/` (403, blocked non-browser requests) — used the arXiv/CDN PDF version instead, which is the same paper.
- YouTube transcripts: searched, found several relevant videos on sampling (`youtube.com/watch?v=j2ZGvE7FvvU` and others) but could not retrieve transcript text through available tools — used the arXiv and vendor-doc sources above instead, which I could actually read.
