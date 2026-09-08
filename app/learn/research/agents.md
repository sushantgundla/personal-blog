# Proposal: Agents and Tool Use

## 1. Verdict

One course. Twelve lessons is the right size — the topic has enough distinct
mechanics (tool schemas, the loop itself, memory, MCP, sandboxing, multi-agent,
cost, debugging) to fill a course without padding, and it doesn't split cleanly
into two courses without one half being thin. It's the natural fourth course
alongside LLMs, Prompt Engineering, and RAG — those three cover "the model,"
"talking to the model," and "getting it facts"; this one covers "letting it act."

## 2. Proposed course

**Title:** Agents and Tool Use
**Subtitle:** Giving a model hands, and keeping them on a leash.
**Blurb:** An agent is a model, a `while` loop, and a set of functions it's
allowed to call. This course is about the loop: how a model decides which tool
to reach for, what happens when a tool call fails at 2am, what an agent should
and shouldn't be allowed to touch, and why the bill on a bad run is 40x a bad
prompt.

### Part 1 — The Shape of an Agent

**1. A loop, not a brain**
*What actually makes something an agent, and what doesn't.*
Opens with the reader who bolted a `while` loop around a chat completion call
and is now calling it an agent in a design doc. Teaches the real distinction
(Anthropic's own framing): a workflow's path is fixed code, an agent's path is
decided by the model at each step. Explains why most "agents" in production
are workflows wearing an agent costume, and why that's usually the right call.

**2. How a model picks a tool**
*The mechanics under function calling — not magic, not a plugin system.*
Opens with a tool that "should obviously" have been called and wasn't. Walks
through how tool definitions get serialized into the prompt, how the model
scores tool-vs-no-tool and tool-vs-tool, and why the description field is doing
more work than the parameter types.

**3. Designing a tool a model can actually use**
*Schema design: the difference between a tool a human would use and one a
model can use correctly on the first try.*
Opens with an agent that calls `search(query)` with a query no human would
type. Covers strict JSON Schema, `additionalProperties: false`, narrow
enums over free text, naming things for what they do, and why fewer,
better-scoped tools beat a large toolbox.

### Part 2 — Running the Loop

**4. Planning a run, and knowing when to stop**
*The loop itself: reason, act, observe, repeat — and the failure mode where
it doesn't stop.*
Opens with an agent still "working" ten minutes and forty tool calls after the
task was done. Covers step budgets, explicit termination conditions, and the
difference between the model deciding it's done and the harness deciding for it.

**5. When a tool call goes wrong**
*Error handling built for a loop, not for one round-trip.*
Opens with an agent that got a malformed-argument error back from a tool and
confidently made up an answer instead of retrying. This is not the Prompt
Engineering course's "Retries and fallbacks" — that lesson is about one prompt
call failing; this is about deciding, mid-loop, whether to retry the same
call, rewrite the arguments, try a different tool, or give up and say so.

**6. What the loop remembers within one run**
*Working memory: scratchpads, running state, and why a long run needs
compaction.*
Opens with an agent forty tool calls deep that has forgotten the constraint it
was given at step 2. Covers keeping state outside the model's context (a
scratchpad, a task list) versus relying on the transcript, and compaction —
summarizing the run so far into a fresh window instead of dragging the whole
history along.

**7. What sticks around after the run ends**
*Memory across sessions — and why it's a different, riskier problem than
memory within one.*
Opens with an agent that "remembered" a preference the user never actually
set. Covers persistent memory stores, when to write to them, and memory
poisoning — a bad or manipulated memory silently steering every future run.

### Part 3 — Reaching Outside

**8. One protocol instead of forty integrations**
*MCP: what it actually standardizes, and what it's silent about.*
Opens with a team that wrote the same tool three times for three different
agent frameworks. Explains MCP as a common interface for tools, resources,
and prompts between an app and a model, where it removes real duplication,
and what it deliberately leaves to you (auth policy, sandboxing, tool quality).

**9. Letting an agent touch the real world**
*Sandboxing and permissions: the difference between a tool that reads and one
that acts.*
Opens with a coding agent that ran `rm -rf` on the wrong directory because it
had the same filesystem access as the human it was helping. Covers scoped
permissions, isolating tool execution (containers, microVMs), default-deny
network and filesystem access, and human-in-the-loop gates for anything
irreversible. Cross-references the Prompt Engineering course's prompt
injection lesson — injection is where the attack comes from; this lesson is
about limiting the blast radius once it lands.

### Part 4 — Running It at Scale

**10. When one agent becomes five**
*Multi-agent patterns, and the tax you pay for them.*
Opens with a team that split one agent into five specialized ones and watched
the token bill jump far more than the accuracy did. Covers the real patterns
(orchestrator-worker, parallel fan-out for independent subtasks) and a plain
rule of thumb: coordinate only when the subtasks are genuinely independent or
the task is big enough to be worth the overhead.

**11. Why the bill exploded**
*Cost and latency failure modes that only happen inside a loop.*
Opens with a five-cent task that cost four dollars. Covers runaway tool-call
loops, re-sending the full growing transcript on every step, redundant tool
calls the model didn't need to make, and where caching and step limits earn
their keep.

**12. Reading a trace after it breaks**
*Debugging a run that produced a wrong answer with no visible error.*
Opens with an agent that returned a confident, wrong result — no exception,
no red text, just a bad answer. Covers reading a tool-call trace end to end,
telling a tool-selection mistake from a bad tool result from a reasoning
mistake, and the logging a loop needs from the start so this is answerable
later instead of guessed at.

## 3. Ordering rationale

Part 1 has to come first because "is this even an agent" and "can the model
call this tool correctly" are prerequisites for everything after — a reader
who hasn't seen tool-call mechanics can't follow a lesson on error handling
inside one. Part 2 stays in-run start to finish (plan → error → memory) because
those three compound in the order they'd actually hit a reader debugging a
live loop. MCP and sandboxing sit together in Part 3 because both are about
the boundary between the loop and the outside world — protocol first, then
permission, mirrors the order a reader wires them up. Part 4 is last on
purpose: multi-agent, cost, and debugging are what you hit only once a single
agent is working and you're trying to make it bigger, cheaper, or trustworthy
— exactly the order a working engineer runs into them.

**Overlap with Prompt Engineering, and how it's kept distinct:** both courses
touch retries, validation, and decomposition. Prompt Engineering treats each
as a property of *one prompt call* — does this response match the contract,
should this one call be retried. This course treats the same words as
properties of *a running loop* — a tool call that failed mid-plan, a partial
result that changes what the next step should be, state that has to survive
many calls. Lesson 5 and lesson 3 say this explicitly rather than leaving the
reader to notice the seam themselves.

## 4. Rejected

- **Named frameworks (LangGraph, CrewAI, AutoGPT, OpenAI Agents SDK) as
  lesson topics** — these are products, not mechanics; the course teaches the
  loop underneath them so it outlives whichever framework is popular.
- **Computer-use / browser-control agents as a dedicated lesson** — real and
  current, but it's a specific capability of specific vendors (Claude computer
  use, OpenAI Operator) evolving too fast to write mechanics for; gets a
  further-reading link off lesson 9 instead.
- **Other agent interop protocols (A2A, ACP, ANP)** — mentioned in passing in
  lesson 8 as landscape, not a lesson each; MCP is the one a reader will
  actually touch, and a "protocol zoo" lesson ages into a spec sheet.
- **Agent benchmarks (SWE-bench, tau-bench, leaderboards)** — explicitly out
  of scope per the site's no-benchmark-numbers rule, and they date within
  weeks anyway.
- **Reasoning models / chain-of-thought as agent planning** — already owned by
  the LLMs course's "Base, instruct, and reasoning models"; repeating it here
  would be the same lesson with a different opener.
- **Prompt injection as its own lesson** — already a full lesson in Prompt
  Engineering; this course references it once, at the point (sandboxing) where
  an agent's tool access is what turns an injected instruction into real
  damage.
- **Fine-tuning or RL-training an agent's tool use** — a model-building
  concern, not an integration mechanic; out of scope for a practitioner site
  that doesn't build models.
- **A "what is an AI agent" hype/definitions-debate lesson** — collapsed into
  lesson 1's opener instead of given its own lesson; the definition matters
  only as a gate to the mechanics, not as a topic on its own.

## 5. Sources

- [MCP 2026-07-28 specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/) — current as of this month; the spec version live today.
- [The 2026 MCP Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — current, official roadmap.
- [MCP Adoption Statistics 2026](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol) — May 2026 registry numbers; used only for "widely adopted," no figures will go in the lesson.
- [Anthropic — Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — the source of the workflow-vs-agent framing used in lesson 1; still the standard reference, unlikely to date.
- [Context engineering: memory, compaction, and tool clearing — Claude Cookbook](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools) — current, direct source for lesson 6.
- [Context Engineering in 2026 — Louis Bouchard](https://www.louisbouchard.ai/context-engineering-2026/) — Sept 2026-era piece; used for the "compaction isn't always the answer" nuance, not for numbers.
- [Northflank — How to sandbox AI agents in 2026](https://northflank.com/blog/how-to-sandbox-ai-agents) — current, for the microVM/gVisor/container landscape in lesson 9.
- [NVIDIA — Practical Security Guidance for Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/) — current, vendor-neutral enough to trust for mechanics.
- [Single-Agent vs Multi-Agent Systems — Medium](https://medium.com/@mjgmario/single-agent-vs-multi-agent-systems-when-coordination-helps-hurts-and-pays-off-57735ee7916d) — used only for the qualitative "multi-agent costs several times the tokens" point; no specific multiplier will be quoted in the lesson since it varies by source.
- [Tracing AI Agent Failures — getmaxim.ai](https://www.getmaxim.ai/articles/tracing-ai-agent-failures-debugging-multi-step-tool-workflows/) — current, for lesson 12's failure taxonomy (silent-wrong-answer vs visible error).
- Function-calling best-practice pieces (Medium/FutureAGI/Adaline, all 2026) — consistent with each other on schema strictness and description quality; used to confirm lesson 3's advice isn't stale, none quoted directly.
