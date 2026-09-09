# Prompt Engineering course — gap audit (2026-09-09)

## 1. Verdict

**Two lessons genuinely missing.** Ranked:

1. **Sampling and voting (self-consistency)** — the course teaches how to retry a response that *fails*, but has nothing for a response that *passes validation and is still wrong*. This is a real, common, teachable gap.
2. **Meta-prompting: let the model draft and improve its own prompt** — lesson 10 builds an eval harness by hand; the natural next question ("can I search for a better prompt instead of hand-editing one") is real, current, and unanswered.

Everything else I found (context engineering, multimodal prompting, tool-use loops) is either already covered by another course, not a fit for this one, or too thin to be a lesson. See Rejected.

## 2. Proposed lessons

### Lesson: Sampling and voting

- **Subtitle:** "When there's no error to catch, run it more than once and let the answers disagree with each other."
- **Joins:** Part 3 (Making it reliable), slotted after `08-retries-and-fallbacks.mdx` and before `09-prompt-injection.mdx`.
- **Why opener:** A ticket classifier passes every check in lesson 7 — valid enum, valid urgency range, owner exists — and is still wrong. There's no error to retry against, because nothing failed. The reader has hit "confidently wrong and technically valid" and has no tool for it yet.
- **## 1. Why retrying the same call doesn't help here.** Retries (lesson 8) fix a call that *failed*; this is a call that *succeeded* with the wrong answer. Explains that even though Anthropic's current models reject a custom `temperature`, default sampling still varies run to run — lesson 10 already established this — so five identical calls are five real, independent opinions, not five copies.
- **## 2. Counting the votes.** How to aggregate: majority vote for a closed set (label, enum, short numeric answer); why it does *not* work for open prose (five different summaries aren't five ballots); what to do with a tie (escalate to a stronger model or a human, never break it arbitrarily).
- **## 3. What it costs, and when it's worth it.** N calls is N× the tokens, but the latency is parallel, not sequential (unlike retries, which must be sequential because attempt 2 depends on attempt 1's error). Where it pays: a decision that's expensive to get wrong and has no ground truth to validate against. Where it's waste: cheap low-stakes calls, or anything a schema can already fully validate.
- **Comparison table:** Retries (lesson 8) vs. voting (this lesson) — trigger, what changes between calls, sequential vs. parallel, cost shape, when to use.
- **Code block:** call the same prompt N=5 times, collect short answers, `collections.Counter` majority vote, explicit tie handling.
- **Wins:**
  1. Reach for voting when there is no error to retry against — an open classification, a judgment call, a borderline case.
  2. Run N calls in parallel, not in sequence — voting buys reliability without paying retries' latency.
  3. Use an odd N, so a majority exists and ties are rare.
  4. Voting only works when answers are comparable — a closed label or a number, not free prose.
  5. Escalate a tie to a stronger model or a human. Do not break it with a coin flip.
- **Quiz (5, 3 options each):**
  1. Q: Anthropic's current models reject a custom `temperature`. Why do five identical calls still return different answers? — A: "Default sampling still has some randomness in it" (opt 0) / "Each call is silently routed to a different model version" / "It never does — identical prompts always return identical text." Answer: 0. Explain: lesson 10 covered why this used to be masked by setting temperature to zero, which current models no longer allow.
  2. Q: Voting fixes... — "Malformed JSON that fails to parse" / "A wrong-but-well-formed answer that would pass every check in lesson 7's validator" (opt 1) / "A 429 rate limit response." Answer: 1. Explain: malformed output is what a repair retry fixes; voting is for a plausible answer that might just be one of several readings.
  3. Q: Self-consistency works best on... — "A one-paragraph creative summary" / "A short, comparable answer like a label or a number" (opt 1) / "A task where every run already returns the identical answer." Answer: 1. Explain: voting needs answers you can compare; open prose gives five essays, not five ballots.
  4. Q: Five calls split 2-2-1 across three labels. The right move is... — "Take the first answer that arrived" / "Treat it as a genuine tie and escalate, rather than pick one to end the debugging" (opt 1) / "Lower max_tokens and try again." Answer: 1. Explain: a split this even is itself information — the case is genuinely ambiguous.
  5. Q: The honest cost of voting with N=5 is... — "Five times the tokens of one call, though not five times the latency if run in parallel" (opt 0) / "Free, since identical calls are served from cache" / "The same cost as one call, because only the majority answer is billed." Answer: 0. Explain: you pay for every sample; the saving is they needn't run sequentially the way retries do.
- **Deeper (4, all confirmed 200):**
  - Wang et al. — Self-Consistency Improves Chain of Thought Reasoning — https://arxiv.org/abs/2203.11171
  - Learn Prompting — Self-Consistency — https://learnprompting.org/docs/intermediate/self_consistency
  - Kinde — LLM Fan-Out 101: Self-Consistency, Consensus, and Voting Patterns — https://www.kinde.com/learn/ai-for-software-engineering/workflows/llm-fan-out-101-self-consistency-consensus-and-voting-patterns/
  - Anthropic — prompt engineering best practices — https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

### Lesson: Meta-prompting — this is the one I drafted in full (see below)

- **Subtitle:** "Stop hand-editing the prompt. Have a model draft it, and let your own eval harness pick the winner."
- **Joins:** Part 4 (Making it last), right after `10-versioning-and-testing-prompts.mdx` — it depends on that lesson's harness existing first.
- **Why opener:** The reader has just built the 20-case harness from lesson 10. They change a sentence, the score moves from 17 to 18, they change another, it drops to 16, and they're back to guessing by feel — just now with a number attached. The harness tells you *whether* an edit helped; it was never going to tell you *what to try next*. That's the gap.
- Full spec is in the draft MDX itself (frontmatter + three sections + table + code + quote), since I wrote this one to ship.

## 3. Expansions (existing lessons, not new ones)

- **`content/learn/prompt-engineering/09-prompt-injection.mdx`** — I read the full file; it names direct and indirect injection (fetched pages, documents, emails) but never mentions MCP servers, even though the lesson already talks about "tool results" as an untrusted surface. MCP tool poisoning — malicious instructions hidden in a tool's *description*, loaded into context before the model ever calls it — is a distinct and current attack shape (OWASP now ranks it #1 in the LLM Top 10) and deserves one paragraph under the indirect-injection section, plus a `deeper` link to OWASP's MCP Tool Poisoning page. Not a new lesson — the mechanism and defenses in the lesson are unchanged; only the list of untrusted surfaces needs a line.
- **`content/learn/prompt-engineering/05-thinking-out-loud.mdx`** — checked against the 2026-09-08 audit's claim that this lesson still described manual `budget_tokens`. It does not — the file already teaches adaptive-thinking/`effort` correctly. No action needed; flagging so nobody re-does this.

## 4. Rejected

- **Context engineering as its own lesson** — real term, but I fetched Anthropic's own definition (`effective-context-engineering-for-ai-agents`) and it explicitly scopes the discipline to "multi-step agent interactions" and "context state" across a run — that's the existing **Agents and Tool Use** course's territory (`What the loop remembers within one run`, `What sticks around after the run ends`), not single-prompt work. The single-call version of the same idea — what to put in the system prompt vs. the user turn, what gets buried under pasted context — is already lessons 1 and 2 of this course. Writing a third lesson would either repeat those or duplicate the Agents course.
- **Prompting with images and documents (multimodal)** — real gap, confirmed by re-reading the course, but explicitly named in my brief as belonging to the multimodal course, not this one.
- **Tool use and agent loops** — flagged as a gap by the 2026-09-08 audit, but the course list I was given shows a 12-lesson "Agents and Tool Use" course already covers this ground. Gap is closed.
- **Automatic prompt optimization frameworks (DSPy etc.)** — real technique, but the site's rule is no framework as the subject of a lesson. Folded the useful part (searching for a better prompt against a fixed eval set) into the meta-prompting lesson above without naming any framework.
- **LLM-as-judge for grading subjective output** — real and asked-about, but it's evaluation/observability territory, which I was told is its own course and not mine to write.

## 5. Sources

Fetched and used:
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — Anthropic's own definition; confirmed context engineering is scoped to multi-step agent runs, current (their framing, no date decay risk).
- https://www.elastic.co/search-labs/blog/context-engineering-vs-prompt-engineering — vendor blog, current, used to cross-check the context-engineering vs prompt-engineering distinction.
- https://arxiv.org/abs/2203.11171 — Wang et al., self-consistency paper (2022), evergreen technique description, used for the sampling-and-voting lesson.
- https://learnprompting.org/docs/intermediate/self_consistency — teaching-site explanation of self-consistency, current.
- https://www.kinde.com/learn/ai-for-software-engineering/workflows/llm-fan-out-101-self-consistency-consensus-and-voting-patterns/ — engineering-team blog on fan-out/voting patterns in production, current.
- https://www.prompthub.us/blog/a-complete-guide-to-meta-prompting — teaching-site guide to meta-prompting, current.
- https://arxiv.org/abs/2311.05661 — "Prompt Engineering a Prompt Engineer" (2023), academic grounding for automated prompt improvement.
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompt-generator — Anthropic's own prompt-generator docs, live and current; verified before using in the draft.
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices — current Anthropic docs, re-verified live.
- https://owasp.org/www-community/attacks/MCP_Tool_Poisoning — OWASP's MCP Tool Poisoning page, current, used for the prompt-injection expansion.
- https://www.aptible.com/mcp-security/mcp-prompt-injection — engineering blog on MCP prompt injection, current, cross-check for the same expansion.

Could not retrieve: YouTube transcripts. I tried `youtube.com/watch?v=Evg4HXvsYVY` ("Anthropic's Meta Prompt") — the page fetch returned only YouTube's footer/nav chrome, no transcript or video content. I did not find a working transcript source for it or for any other candidate talk, so no YouTube source is cited above; everything used is a page I could actually read.
