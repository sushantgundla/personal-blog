# Agents and Tool Use — expansion research

## 1. Verdict

This course is close to complete. Two lessons are genuinely missing, ranked:

1. **Testing an agent without the model in the loop.** Lesson 1 explicitly names the
   gap ("asserting on a trajectory is a much harder problem") and never resolves it.
   Real, current, teachable without hype or frameworks. Highest value.
2. **When nobody is watching: agents on a schedule.** The whole course assumes a
   human is present to gate the irreversible step (lesson 9) or read a trace after a
   run (lesson 12). A cron-triggered or event-triggered agent breaks both assumptions
   and needs different termination and failure-detection design. Real and distinct,
   slightly lower value than testing because it touches production.md's territory at
   the edges.

Everything else I checked either already exists in the course, is better owned by
another course, or does not hold up as a full lesson. Full detail below.

## 2. Proposed lessons

### Lesson: Testing an agent without the model in the loop

- **Title:** Testing an agent without the model in the loop
- **Subtitle:** The model's wording never repeats exactly twice. The loop around it
  is ordinary code, and ordinary code can be pinned down and checked.
- **Joins:** Part 2 (Running the loop), inserted after lesson 5 ("When a tool call
  goes wrong") and before lesson 6 ("What the loop remembers within one run").
  Renumbers 6→7 through 12→13. It needs lessons 3–5 already read (schemas, budgets,
  retry classification are exactly what gets tested) and fits before memory/MCP/
  scale, which don't change the argument.
- **Why opener:** an engineer fixes the "retries forever" bug from lesson 5, writes
  a test that calls the real model and the real failing tool, asserts on the
  response, and it passes five times running. The sixth run fails on a differently
  worded but equally correct response, and now a red build means nothing — could be
  a real regression, could be the model rephrasing itself. The fix was fine; testing
  the one part of the loop nobody can pin down was the mistake.
- **Sections:**
  1. *What your code owns, and what the model owns* — table splitting the four
     moving parts (lesson 1) into "the model decides" (wording, which of two valid
     tools, phrasing) vs. "your code decides" (schema checks, retry ladder, budgets,
     stuck-loop detection) — and the point that only the first column is actually
     untestable.
  2. *Freeze a real run, then replay it* — cassette-style recording: call the real
     model once, save the response including tool calls, replay it in a stub client
     so the harness runs unchanged against frozen input. Three levels of assertion —
     tool selection, argument validity, trajectory — in order of what they catch.
  3. *What a fixture can never tell you* — fixtures answer "does this exact input
     still behave the same," not "is this a good answer" (that's the evals course)
     or "which of two valid tools should it pick" (run N times, assert a pass rate,
     keep it in a separate probabilistic suite). Closes on: every production bug
     becomes a permanent fixture before the ticket closes.
- **Table:** three-level assertion table (tool selection / argument validity /
  trajectory) — what each checks, what it catches.
- **Code block:** a `RecordedClient` stub that replays a fixture and raises if the
  loop asks for a step nobody recorded, plus a test asserting on the tool-call
  trajectory and the final outcome — not on exact text.
- **Wins, quiz, deeper:** written in full in the draft MDX (below).

### Lesson: When nobody is watching — agents that run on a schedule

- **Subtitle:** A synchronous agent has a human to ask when something's wrong. A
  scheduled one has to decide everything in advance, because nobody is there to ask.
- **Joins:** Part 3 (Reaching outside), directly after lesson 9 ("Letting an agent
  touch the real world"). Lesson 9's human-gate section assumes someone is watching
  the run; this lesson is what happens when that assumption is false. Renumbers
  10→11 onward.
- **Why opener:** a reconciliation agent runs at 2am, an upstream API rate-limits it
  partway through, the run "completes" with a 200-equivalent outcome, and nobody
  notices until the ledger is visibly wrong twelve hours later. No error dashboard
  fired because nothing raised — the run just did less than it should have, silently,
  with no one watching it happen.
- **Sections:**
  1. *The human-gate assumption breaks first* — lesson 9's gate on irreversible
     actions requires someone to approve in real time; a scheduled run has no one
     online. The fix is not "skip the gate," it's deciding, in code, in advance,
     which actions this run is simply never allowed to take, versus which get queued
     for async approval before anything real happens.
  2. *Absence is the failure mode, not an error* — a scheduled agent can "succeed"
     by every technical measure (ran, returned, no exception) while producing
     nothing or the wrong thing; the fix is a heartbeat/liveness check ("did this run
     at all") plus outcome checks against the world (lesson 4's termination
     condition, reused), not just checking `stop_reason`.
  3. *Idempotency stops being optional* — schedule and event triggers commonly
     redeliver (at-least-once), so a run can start twice for the same trigger; every
     side-effecting tool call needs the idempotency key from lesson 5, and the run
     itself needs a lock so two triggers can't execute the same window concurrently.
- **Table comparing** interactive vs. scheduled agents: who approves an irreversible
  action, how a failure is noticed, what "done" means, retry/redelivery risk, and
  what happens to a stuck run.
- **Code block:** a scheduler wrapper that takes a distributed lock keyed on the
  run's time window, checks a dedupe key before executing, and writes a heartbeat
  record so a missing run is detectable, not just a failed one.
- **Deeper:** TianPan's proactive-agents piece, the AI-agent-cron dev.to guide, plus
  a cross-reference back to lesson 9 rather than repeating its permission table.

## 3. Expansions to existing lessons

- **`09-touching-the-real-world.mdx`, section 3** — add a short passage on approval
  UX beyond synchronous blocking: async/queued approval, batching similar approvals
  instead of asking once per call, and what happens when a timeout elapses with no
  answer (the request is denied by default, never auto-approved). This is a
  deepening of the existing "spend the interruptions" point, not a new topic, and
  should link forward to the new scheduled-agents lesson for the case where there's
  no one to ask at all.
- **`08-one-protocol-not-forty.mdx` or `10-when-one-agent-becomes-five.mdx`** — one
  paragraph updating the A2A mention. It was rejected as a lesson topic in the
  original proposal ("protocol zoo," ages fast) — still right, don't overturn that —
  but A2A has since reached v1.0, Linux Foundation Growth Stage, 150+ supporting
  organizations, and GA support in Copilot Studio, Azure AI Foundry, and Bedrock
  AgentCore. The current text undersells how settled it's become; a sentence is
  due, a lesson still isn't.
- **`01-a-loop-not-a-brain.mdx`** — once the testing lesson ships, the line "Easy
  tests. Asserting on a trajectory is a much harder problem" can get a forward
  pointer to it. Cosmetic, low priority.

## 4. Rejected

- **Evaluating an agent's trajectory/tool-choice accuracy at scale** — this is a
  real gap, but it's the evals/observability course's gap, not this course's. Their
  lesson 10 ("Tracing a multi-step run") is adjacent but is about post-hoc pipeline
  debugging, not pre-ship trajectory scoring — flagging for that team, not writing
  it here.
- **Long-running / resumable agents (checkpoint across a process restart)** — real
  problem, but it overlaps too much with production.md's "Queues and long-running
  jobs" (job records, resuming after a service restart) and this course's own
  lesson 4 (`budget_exhausted` carrying enough state to resume) and lesson 6
  (state outside the transcript). Not distinct enough to earn a 13th–14th lesson on
  top of the two above.
- **Human-in-the-loop approval UX as its own lesson** — the core mechanics are
  already in lesson 9; deepened as an expansion instead of duplicated as a lesson.
- **Agent-to-agent communication via A2A as a full lesson** — explicitly rejected in
  the original proposal, and I'm not overturning it: A2A matured a lot in 2026, but
  what a reader of this course needs is "the landscape moved," not new mechanics to
  learn, since this course teaches building your own tools, not consuming a
  cross-vendor agent marketplace. Expansion, not a lesson (see above).
- **Testing frameworks/products (Promptfoo, Langfuse, specific eval SDKs) as the
  subject** — same reason named frameworks were rejected originally; taught the
  cassette-recording *pattern* using stdlib only, no product named as the answer.

## 5. Sources

Fetched and read directly:
- [TianPan — Deterministic Replay: How to Debug AI Agents That Never Run the Same Way Twice](https://tianpan.co/blog/2026-04-12-deterministic-replay-debugging-non-deterministic-ai-agents) — Apr 2026, current; source for the cassette/replay mechanic and "substitute deterministic stubs" framing in lesson section 2.
- [Angie Jones — Test Pyramid for AI Agents](https://angiejones.tech/test-pyramid-for-ai-agents/) — current; source for splitting deterministic vs. probabilistic testing layers, used for the course's own table.
- [Confident AI — AI Agent Testing: tool calling, regressions, failure handling](https://www.confident-ai.com/knowledge-base/guides/ai-agent-testing) — current; source for the three-level assertion model (tool selection / argument validity / trajectory) used verbatim as a table.
- [vcrpy documentation — Usage](https://vcrpy.readthedocs.io/en/latest/usage.html) — current; confirms the "cassette" recording pattern is an established one in Python testing generally, not invented for agents.
- [Python docs — unittest.mock](https://docs.python.org/3/library/unittest.mock.html) — stable stdlib reference for the stub client pattern in the draft's code block.
- [TianPan — Proactive Agents: Event-Driven and Scheduled Automation for Background AI](https://tianpan.co/blog/2026-04-16-proactive-agents-event-driven-scheduled-automation) — Apr 2026, current; source for the heartbeat/absence-detection framing, idempotency-key-on-redelivery point, and "guardrails as prohibitions" for the scheduled-agents lesson.
- [dev.to — The Complete Guide to AI Agent Cron Jobs and Scheduling](https://dev.to/toji_openclaw_fd3ff67586a/the-complete-guide-to-ai-agent-cron-jobs-and-scheduling-2c3f) — current; corroborates cron-vs-event-trigger framing.
- [MindStudio — How to Build an AI Agent That Runs While You Sleep](https://www.mindstudio.ai/blog/ai-agent-runs-while-you-sleep-scheduled-automations-claude) — current; corroborates per-run budget caps as the standard guardrail for unattended agents.
- [Linux Foundation — A2A Protocol Surpasses 150 Organizations](https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year) — current; confirms A2A's 2026 production maturity for the expansion note.
- [a2a-protocol.org — 2026 blog archive](https://a2a-protocol.org/latest/blog/archive/2026/) — current; corroborates the v1.0 stable release timeline.

Could not retrieve:
- [Autonoma AI — How to Test AI Agents That Take Actions (Tool Calls)](https://getautonoma.com/blog/testing-ai-agent-tool-calls) — HTTP 402 Payment Required on fetch; not used or cited.

Not fetched, mentioned only in search-result summaries and therefore not cited
anywhere above: dev.to's 2026 QA playbook, QA Wolf's testing-tools roundup,
zylos.ai's replayable-runtimes piece, and the arXiv structural-testing paper —
none were opened directly, so none appear as sources.
