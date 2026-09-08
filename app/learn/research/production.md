# Running LLM Features in Production — proposal

## 1. Verdict

**One course.** The topic is genuinely one story — "the model call is a slow, flaky,
metered network dependency, and your service has to be built around that fact" —
told through streaming, latency, caching, concurrency, and failure handling. Splitting
it (e.g. "Reliability" vs "Performance") would force artificial lesson boundaries and
duplicate the failover/circuit-breaker material twice. 11 lessons, 4 parts, matches the
site's existing course size (10–12).

## 2. Proposed course

**Title:** Production
**Subtitle:** What changes when the model call has to survive real traffic.
**Blurb:** A prototype calls the API once and prints the answer. A product calls it
a million times a day, from users who refresh when it's slow and get angry when it's
down. This course is everything that sits between your code and the model once that
happens — the queue, the cache, the retry, the fallback — and why each one exists.

### Part 1 — The call is slow

1. **Why streaming changes everything**
   *Subtitle:* The response isn't a value, it's a pipe.
   Opens with: a developer builds a working `/chat` endpoint that returns JSON, ships
   it, and users bail before the 8-second answer arrives. Teaches that streaming isn't
   a UI nicety — it inverts your API shape (SSE / chunked transfer instead of
   request-response), forces your frontend into an incremental-render model, and
   changes what "the request succeeded" even means when it fails halfway through a
   sentence.

2. **Time to first token vs. total time**
   *Subtitle:* Users forgive slow endings. They don't forgive slow starts.
   Opens with: a team ships a "faster model" and latency complaints don't drop,
   because they optimized total time, not the 4-second silent wait before anything
   appears. Teaches TTFT vs. inter-token latency as separate metrics with separate
   levers — prompt length and prefix/cache hits move TTFT; output length and decoding
   speed move the rest — and why you measure and alert on them separately.

3. **Caching: prompt, semantic, and the difference**
   *Subtitle:* Two caches with the same name, solving different problems.
   Opens with: a team turns on "caching," costs don't move, because they built a
   semantic cache (matches similar *questions*) when they needed prompt caching
   (reuses a repeated prefix, billed by the provider at a steep discount). Teaches
   both, with a comparison table on what each catches, the accuracy risk semantic
   caching carries (confidently wrong on a near-miss), and cache-key/TTL design so a
   system-prompt change doesn't serve stale answers forever.
   *Overlap note:* the LLMs course's "What you actually pay for" explains the
   provider's price table; this lesson is about the caching layer you build, not the
   discount you get.

### Part 2 — The call is a queue, not a function

4. **Batching and concurrency**
   *Subtitle:* One request at a time doesn't scale, and neither does infinite parallel.
   Opens with: a background job that calls the API in a loop, one document at a time,
   and takes six hours because it never overlaps requests. Teaches request-level
   concurrency (fan out with a worker pool and a concurrency cap so you don't trip
   rate limits) versus provider batch APIs (async, ~24h turnaround, real discount, for
   work that isn't waiting on a human).

5. **Queues and long-running jobs**
   *Subtitle:* Don't make an HTTP request hold a socket open for a job that takes
   minutes.
   Opens with: an endpoint that calls the model synchronously, times out at 30
   seconds because a proxy in front of it has an opinion, and drops a job that was
   actually still running. Teaches decoupling the trigger (submit) from the result
   (poll or webhook) with a queue in between, and what to put in the job record
   (status, partial output, attempt count) so a client can recover from a restart of
   your own service, not just the model's.

6. **Timeouts, retries and circuit breakers**
   *Subtitle:* When the provider is having a bad day, stop asking it politely, faster.
   Opens with: a provider outage where every request in the fleet retries at the same
   backoff interval, turning a partial outage into a full one — a retry storm. Teaches
   per-call timeouts, exponential backoff with jitter, which status codes are worth
   retrying (429/5xx) versus never (4xx), and the circuit breaker that stops sending
   requests to a service that's already down instead of queueing up failures.
   *Overlap note:* Prompt Engineering's "Retries and fallbacks" is about retrying a
   *bad answer* (validation failed, try a different prompt). This lesson is about
   retrying a *failed call* (the network or the provider failed). Cross-link, don't
   repeat.

7. **Multi-provider failover and routing**
   *Subtitle:* Your one provider's outage is not your outage, if you built for it.
   Opens with: a single-provider app going fully dark during a well-publicized
   provider incident, while a competitor with a fallback chain stayed up on a second
   vendor. Teaches the failover chain (same task, ranked providers, automatic
   fallback on error or timeout), why this needs a shared request/response shape
   across providers, and where a gateway (LiteLLM, Portkey, or a thin one you write)
   earns its place versus being one more thing to operate.
   *Overlap note:* LLMs' "Switching models safely" is about a deliberate, tested
   upgrade you choose. This lesson is about an automatic, in-request fallback you
   didn't choose — different trigger, different blast radius.

### Part 3 — The call has to fit your service

8. **Where the call sits in your architecture**
   *Subtitle:* An LLM call is a dependency, and it should look like one on your
   diagram.
   Opens with: an on-call engineer paged for a "database" incident that was actually
   the LLM call inside a request handler blocking the whole request path, taking
   unrelated features down with it. Teaches isolating the call behind its own service
   boundary or async path, giving it its own error budget and timeout, and designing
   a fallback *feature* behavior (cached answer, degraded mode, "try again") — not
   just a fallback *request*.

9. **Idempotency: retries that have side effects**
   *Subtitle:* Retrying a read is free. Retrying a charge is not.
   Opens with: an agent's tool call times out, the orchestrator retries the step, and
   a customer gets emailed twice — the model didn't know its first attempt actually
   succeeded, it just didn't hear back. Teaches idempotency keys scoped to the side
   effect (the charge, the email, the write) rather than the inference call, so a
   retried thought doesn't become a repeated action, plus where that key belongs (the
   tool wrapper, not the model).

10. **Cost control as architecture**
    *Subtitle:* The cheapest fix isn't always a cheaper model.
    Opens with: a team facing a runaway bill switches to a smaller model, quality
    drops, and the bill barely moves because the real cost driver was an
    uncapped conversation history growing every turn. Teaches architectural levers —
    truncating/summarizing context, routing easy requests to a cheap tier and hard
    ones to an expensive one, batching non-interactive work, and hard per-request and
    per-tenant spend caps — as the first response, before ever touching model choice.
    *Overlap note:* LLMs' "What you actually pay for" explains the unit economics;
    this lesson is what you build so those units don't multiply unchecked.

11. **Keys, secrets and multi-tenant isolation**
    *Subtitle:* One leaked key is one incident. One shared key across customers is a
    design flaw.
    Opens with: a support ticket reveals that customer A's usage is throttling
    customer B, because the whole product shares one provider API key with no
    per-tenant accounting. Teaches per-tenant virtual keys (via a gateway or your own
    layer) for budget and rate-limit isolation, secret storage and rotation for
    provider keys, and why "it's just an API key" undersells what it can do to your
    bill and your blast radius if it leaks.

## 3. Ordering rationale

Part 1 stays inside a single request — a reader can apply it without touching
infrastructure, which matches how they arrive (mid-search, wanting one fast fix).
Part 2 widens from one call to many, introducing the queueing and failure-handling
machinery a real volume of traffic demands. Part 3 zooms out to where the call sits
in the surrounding system and organization — architecture, safety of retries, cost,
and tenancy — the concerns that only bite once the feature is actually live and
someone else depends on it. Circuit breakers (6) come before failover (7) because
failover only works once you can detect a provider is down, which the circuit
breaker gives you. Cost control (10) comes after batching/caching (3, 4) so it can
point back at levers already taught instead of re-deriving them.

## 4. Rejected

- **Fine-tuning / LoRA in production** — that's a training-time decision, not a
  serving-time one; belongs nearer the LLMs course if anywhere, not here.
- **Specific gateway product tutorial (LiteLLM config, Portkey setup)** — naming and
  ranking vendors is banned by the site's own rule; taught the *pattern* (a gateway
  centralizes routing/keys/budgets) and let the reader pick a tool.
- **Observability / tracing dashboards (LangSmith, Langfuse, etc.)** — real and
  useful, but it's tooling choice more than mechanics, and dates fast as products
  churn; a line pointing at it belongs inside lesson 8, not its own lesson.
- **Guardrails / content moderation pipelines** — closer to safety/product policy
  than to serving infrastructure; would dilute this course's spine.
- **Specific model speed numbers or TTFT benchmarks** — banned by the brief and stale
  within weeks; lesson 2 teaches the metric and how to measure it yourself instead.
- **Kubernetes/autoscaling specifics for self-hosted inference** — real, but it's
  general infra ops with an LLM label on it, not something specific to LLM calls;
  "Running a model yourself" in the LLMs course is the better home if it's ever
  covered.
- **Prompt injection / output validation under load** — already owned by Prompt
  Engineering's "Prompt injection" and "Validating what comes back"; repeating it
  here just because it happens "in production" would be padding.
- **Vector DB scaling at production volume** — that's RAG's territory (RAG already
  has "Vector databases", "Indexes and the trade you are making"); this course
  should not re-teach retrieval infra.

## 5. Sources

- [neuraltrust.ai — LLM Caching Strategies](https://neuraltrust.ai/blog/llm-caching-strategies) — 2026 vendor blog, consistent with other results; used for prompt vs. semantic cache distinction.
- [digitalapplied.com — Prompt Caching in 2026](https://www.digitalapplied.com/blog/prompt-caching-2026-cut-llm-costs-engineering-guide) — dated 2026, current on prefix-caching mechanics and ordering advice.
- [portkey.ai — Retries, fallbacks, and circuit breakers in LLM apps](https://portkey.ai/blog/retries-fallbacks-and-circuit-breakers-in-llm-apps/) — vendor blog but pattern-level, not product-specific; matches independent sources on backoff/jitter and per-endpoint breakers.
- [dev.to — Circuit breaker for LLM provider failure](https://dev.to/sandhu93/circuit-breaker-for-llm-provider-failure-53f6) — corroborates 429-is-not-a-failure and per-model breaker isolation.
- [tianpan.co — The Idempotency Problem in Agentic Tool Calling](https://tianpan.co/blog/2026/04/19/idempotency-agentic-tool-calling-saga-deduplication) — April 2026, current; source for "key the side effect, not the inference."
- [tianpan.co — The Idempotency Key Your Agent Forgot to Send](https://tianpan.co/blog/2026/07/05/the-idempotency-key-your-agent-forgot-to-send) — July 2026, most recent of the set; corroborates tool-wrapper placement of the key.
- [Requesty — Best LLM Gateway and Router in 2026](https://www.requesty.ai/blog/litellm-vs-portkey-vs-openrouter-best-llm-gateway-2026) — comparison piece dated 2026; used only to confirm what a gateway does generically (routing/budgets/failover), not to endorse a product — no vendor named in the lesson.
- [finout.io — Anthropic API Pricing in 2026](https://www.finout.io/blog/anthropic-api-pricing) — confirms batch APIs (Anthropic and OpenAI) are both ~50% off, async, ~24h SLA; used only to describe the *mechanic* (async batch discount exists), no dollar figures went into the lesson text per the no-prices rule.
- General latency/TTFT pieces (Redis blog, Medium posts on streaming UX) — consistent across sources on TTFT vs. total-time distinction and prefix-cache impact on TTFT; directionally current, no hard numbers used in lesson content.
