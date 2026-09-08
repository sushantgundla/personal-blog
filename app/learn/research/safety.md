# Safety, Security, and Data Handling for LLM Systems — Proposal

## 1. Verdict

One course. Not a handful of lessons bolted onto Prompt Engineering or RAG.

The material spans four different failure surfaces — content coming in, actions going out,
data leaving the building, and the system staying up under abuse — and none of the three
existing courses owns any of them. Prompt Engineering's existing "Prompt injection" lesson is
about writing prompts that resist injection; this course is about what happens when the
attacker isn't in the prompt at all — they're in a PDF the model retrieved, or a webpage a tool
fetched. Different failure, different fix, same name. Keep both, cross-link them, don't merge.

11 lessons, 4 parts. A reader could in principle skip this course and still use the other
three, which is exactly why it has to earn its own space: nothing else in the site tells them
their RAG pipeline can leak tenant A's documents to tenant B, or that letting an agent call
`send_email` unsupervised is a decision, not a default.

## 2. Proposed course

**Title:** Securing LLM Systems
**Subtitle:** What breaks when the input is a webpage and the output is code.

**Blurb:** Every lesson in this course starts from the same fact: an LLM feature has two attack
surfaces a normal web app doesn't — the model reads content you didn't write, and it produces
content your system trusts. This course is about the mechanics of holding that line: what a
prompt injection actually does, what a tool call should never be allowed to do alone, what
leaves your building when you call a provider, and how to notice when it's already gone wrong.

### Part 1 — A Different Kind of Input

**1. The threat model of an LLM feature**
*Your web app never used to take instructions from a PDF.*
Opens on a support bot that summarizes an uploaded ticket, and the ticket contains a line
telling the bot to forward the conversation to an external address. Lays out how an LLM feature
adds two new trust boundaries a REST endpoint doesn't have — untrusted content the model reads,
and model output the rest of your system acts on — and why "just validate the input" (the old
web-app instinct) doesn't close either one. Sets up every lesson that follows.

**2. Indirect prompt injection**
*The attacker never talked to your model. Your retriever did.*
Opens on a RAG bot that answers a question correctly, then a week later starts recommending a
competitor's product — because someone edited a page it indexes. Explains the difference from
direct injection (user types the attack) vs. indirect (the attack rides in through a retrieved
document, a tool's API response, a scraped page). Covers why keyword/pattern filtering on
retrieved text doesn't work — the instruction doesn't need to look like an instruction — and
what does: keeping retrieved content labeled as data, not as turns in the conversation.

**3. Output handling**
*The model's answer is untrusted input to the rest of your code.*
Opens on a markdown renderer that let a model's response inject a `<script>` tag into a
dashboard, because the app treated model output as safe HTML. Walks through the pattern once —
model output flowing into a SQL query, a shell command, a rendered page — and why every one of
those sinks needs the same treatment you'd give user-submitted text: escape it, parametrize it,
never `eval` it, never trust a "safe" JSON blob without a schema check.

### Part 2 — What the Model Is Allowed to Do

**4. The trust boundary around tool calls**
*Giving an agent a tool is giving it a decision you didn't review.*
Opens on an agent with file-delete and email-send tools that, told by an injected instruction to
"clean up old tickets," deletes the wrong ones. Distinguishes read tools from write/act tools;
lays out what should never run unsupervised (irreversible actions, anything touching money or
external comms, anything outside the current user's own data) versus what's fine to automate,
and where a human-approval step actually has to sit — before the call, not after.

**5. Tenant isolation and the shared vector store**
*Two customers, one index — and no wall between them by default.*
Opens on a multi-tenant SaaS product where a support query for one customer surfaces a chunk of
another customer's uploaded contract, because both live in the same vector index. Covers why
vector databases have no built-in access control, how a missing or bypassable metadata filter
becomes a leak, and the isolation patterns (separate indexes, namespaces, row-level filters
enforced outside the LLM) that actually hold.

**6. Content moderation and guardrails**
*Not every refusal should cost a full model call.*
Opens on a chatbot that's technically "safe" because the base model refuses obviously bad
requests, but still says something the company can't have said. Explains the guardrail-model
pattern — a small, fast classifier checking input and output around the main model, distinct
from the model's own built-in refusals — and where it earns its cost: PII in output, brand-unsafe
content, jailbreak attempts, not "did the user say something rude."

### Part 3 — What Leaves the Building

**7. PII and what a provider call actually sends**
*Every prompt you build is a payload leaving your network.*
Opens on a support tool that pastes the full customer record into the prompt "for context,"
including a field nobody meant to send anywhere. Covers what typically ends up in a prompt
without anyone deciding it should (full documents, database rows, email chains), how to redact
or minimize before the call, and why "the provider says they don't log it" isn't the same as
"it never left."

**8. Data retention, training, and the contract you actually signed**
*The checkbox that decides if your prompts train someone else's model.*
Opens on a team that assumed their chat data was safe because "it's just the API," then finds
out a teammate is calling the same provider through its consumer product on the side, under a
different retention policy entirely. Explains the practitioner-relevant distinction — API/
enterprise tiers default to no training and short retention; consumer products often default to
training unless you opt out — and where to go read the actual current terms rather than trust a
number that will be stale by next quarter.

**9. Regulation, at the level that changes what you build**
*You don't need a lawyer to know your chatbot has to say it's a chatbot.*
Opens on a company that shipped an AI assistant with no disclosure that it was AI, discovered
after a user assumed they were talking to a person. Covers the handful of obligations that
actually reach an individual engineer's decisions — disclosing AI interaction, labeling
AI-generated content, keeping records of what a system did and why — without pretending to be
a compliance course, and points at where the current, jurisdiction-specific rules live instead
of quoting them.

### Part 4 — Staying Up, Staying Honest

**10. Denial-of-wallet**
*A DDoS that doesn't take you down — it sends you the bill.*
Opens on a startup whose per-minute cost triples overnight, not from more traffic but from a few
users triggering the most expensive tool-calling path over and over. Explains why request-count
rate limits miss this — a cheap cached reply and an expensive multi-step agent run both count as
"one request" — and what a cost-aware limit actually tracks: tokens, tool calls, per-user and
per-tenant budgets, not just requests per second.

**11. Audit logs for a system that talks back**
*When something goes wrong, "what did the model see and do" has to be answerable.*
Opens on an incident review where nobody can reconstruct which retrieved document caused a bad
answer, because only the final response was logged. Covers what an LLM system needs to log
beyond a normal app — the retrieved context, the tool calls made and their arguments, which
guardrail fired — and the tension with lesson 7: logging enough to debug without logging PII
you shouldn't be storing.

## 3. Ordering rationale

Part 1 first because every later lesson assumes the reader already accepts that model input and
output are both untrusted — that's the one idea the whole course rests on, and it has to land
before anything else makes sense. Injection (2) before output handling (3) because the reader
needs to see content go in wrong before they see it come out wrong.

Part 2 moves from "what the model reads" to "what the model does" — tool calls, then the
specific case of a shared retrieval store, then the guardrail layer that watches both. Tenant
isolation sits here rather than in Part 3 because it's an access-control failure (who can reach
what), not a data-handling-policy failure.

Part 3 is the one about your own decisions as an operator — what you send, what happens to it
after, and what the law says about telling people. PII before retention before regulation,
because you can't reason about a retention policy until you know what's actually in the payload.

Part 4 closes on operating the system under adversarial and normal load both — cost abuse, then
the logging that lets you find out what happened when something in Parts 1–3 slips through.
Audit logs go last on purpose: it's the lesson that ties back to everything the reader now knows
to watch for.

## 4. Rejected

- **Jailbreak taxonomy / red-teaming your own model** — real, but it's an offensive-security
  skill (finding the break), not a defensive one (building so it doesn't matter). Out of scope
  per the brief; could be its own course later, written carefully.
- **Model watermarking / AI-content detection** — immature and contested; the EU AI Act's own
  "machine-readable marking" requirement doesn't take effect until December 2026 and the
  detection tech it leans on doesn't reliably work yet. Would date badly within the year.
- **Specific vendor guardrail products (comparing Llama Guard vs. a commercial moderation API)**
  — that's a buyer's guide, not a mechanic, and it's a rankings list wearing a lesson's clothes.
  Lesson 6 teaches the *pattern* (a classifier around the main model) and points at "go compare
  current options" instead.
- **A dedicated "prompt injection defenses" catalog (input sanitization tricks, delimiter
  schemes, etc.)** — every such trick has a known bypass within months; teaching the trust-
  boundary mental model in lesson 2 ages better than teaching this month's mitigation list.
- **GDPR/CCPA article-by-article walkthrough** — that's a lawyer's document, explicitly out of
  scope per the brief. Lesson 9 stays at "here's what changes your code," not "here's Article 22."
- **Model poisoning / supply-chain attacks on training data** (OWASP's LLM04, LLM03) — real
  OWASP categories, but they're a model-builder's problem, not a practitioner building *on top
  of* an API or open-weights model, which is this site's whole reader. Out of scope by audience,
  not by importance.
- **Misinformation / hallucination as a "safety" topic** (OWASP's LLM09) — legitimate OWASP
  entry, but it's better taught as an output-quality problem next to RAG's existing "Citations
  and grounding" lesson than folded into a security course about attackers and leaks.
- **A capstone "build your own threat model" lesson** — tempting to end on an exercise, but the
  site's format is reading, not lab work; lesson 11's audit-log ending already does the "tie it
  together" job without inventing a new lesson shape.

## 5. Sources

- OWASP GenAI, [Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/) — official project page, PDF dated Nov 2024 for the 2025 edition; current as the canonical list.
- Oligo Security, [OWASP Top 10 LLM, Updated 2025](https://www.oligo.security/academy/owasp-top-10-llm-updated-2025-examples-and-mitigation-strategies) — used to confirm the exact 10 category names and order (Prompt Injection, Sensitive Information Disclosure, Supply Chain, Data and Model Poisoning, Improper Output Handling, Excessive Agency, System Prompt Leakage, Vector and Embedding Weaknesses, Misinformation, Unbounded Consumption). Cross-checked against Mend.io and Security Boulevard summaries; consistent.
- Cloud Security Alliance, [Indirect Prompt Injection Goes Operational (2026)](https://labs.cloudsecurityalliance.org/research/csa-research-note-indirect-prompt-injection-in-the-wild-2026/) — cited real 2026 incidents (Cursor agent RCE via injected config) confirming this moved from theoretical to operational this year.
- dev.to, [Indirect Prompt Injection Is a Trust Boundary Problem](https://dev.to/lukaswalter/indirect-prompt-injection-is-a-trust-boundary-problem-13hm) — source of the trust-boundary framing used in lessons 1, 2, 4.
- anarlog.so, [Anthropic Claude Data Retention Policy 2026](https://anarlog.so/blog/anthropic-data-retention-policy/) and offlist.me, [How to Opt Out of AI Training Data (2026)](https://www.offlist.me/how-to-opt-out-of-ai-training-data) — used for lesson 8's API-vs-consumer retention distinction; both dated 2026, treat the specific retention-day numbers as likely to shift and flagged in the lesson design as "go check current terms."
- handsonarchitects.com, [Denial of Wallet: Cost-Aware Rate Limiting (Parts 1–3)](https://handsonarchitects.com/blog/2025/denial-of-wallet-cost-aware-rate-limiting-part-1/) — 2025/2026 series, current framing for lesson 10.
- Truto, [Multi-Tenant RAG Data Isolation: 2026 Enterprise Architecture Guide](https://truto.one/blog/how-to-architect-strict-data-isolation-in-multi-tenant-rag-pipelines/) and OWASP Cheat Sheet Series, [RAG Security](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) — current, used for lesson 5.
- artificialintelligenceact.eu, [Transparency Rules: Article 50 practical guide](https://artificialintelligenceact.eu/transparency-rules-article-50/) and Software Improvement Group, [EU AI Act Summary (August 2026 update)](https://www.softwareimprovementgroup.com/blog/eu-ai-act-summary/) — current as of the Aug 2026 update cited; confirms the Aug 2, 2026 transparency date (already passed at time of writing, Sep 8 2026) and Dec 2, 2026 machine-marking date, used for lesson 9.
- futureagi.com, [The Ultimate Guide to LLM Guardrails (2026)](https://futureagi.com/blog/ultimate-guide-llm-guardrails-2026/) — current, used for lesson 6's guardrail-model pattern (Llama Guard 3, the "rail placement matters more than model choice" framing).
