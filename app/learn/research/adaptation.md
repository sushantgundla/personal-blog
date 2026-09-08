# Adapting a Model & Beyond Plain Text — course proposal

## 1. Verdict

- **B, "Beyond Plain Text" (retitled "Multimodal"): full course, build first.** Every sub-topic in the brief is a distinct mechanic this audience hits while shipping ordinary features — parsing JSON out of a model, reading a screenshot, building a voice feature, searching scanned documents. It slots naturally after RAG (RAG already taught retrieval and embeddings for text; this extends both to other input types) and stays entirely in "you call an API," which matches a reader who has never built on an LLM.
- **A, "Adapting a Model" (retitled "Fine-Tuning"): also a full course, build second.** The topic list is coherent and deep enough for 11 lessons without padding. But it is a genuine step up in operational complexity — GPUs, training sets, eval harnesses — that most readers in this audience will never personally do. That does not disqualify it: the course's real job is literacy (know what "we fine-tuned it" means, know when a vendor's one-click fine-tune button is worth pressing, know why a training project should not be started), not hands-on training. Framed that way it earns its place, but it is the less urgent build.
- Neither collapses into "a few lessons bolted onto an existing course" — both have enough distinct mechanics and a natural teaching order to stand alone.

## 2. Proposed courses

### Course B — Multimodal
**Subtitle:** Getting a model to read, hear, and see — not just talk back in text.
**Blurb:** Everything so far assumed the model only sees words. Real systems have to read a screenshot, transcribe a call, or search a folder of scanned PDFs. This course is the mechanics of every input and output that isn't plain text — what actually happens to an image or a sound wave on the way into the model, where it still fails, and when to reach for a much smaller, much cheaper tool instead.

**Part 1 — Text, Just More of It**

1. **Structured Output and Constrained Decoding** — *Why "always respond in JSON" isn't the same as JSON that parses.*
   Teaches the difference between prompting for a format (best-effort, fails sometimes) and constrained decoding, where invalid tokens are masked out at generation time so only valid JSON or grammar can come out — and the "constraint tax" of forcing a strict schema on a model mid-reasoning. Opens on a reader whose "just ask nicely for JSON" pipeline breaks on maybe 1 response in 50, non-deterministically, and can't figure out why.

2. **Long Documents: Context at Scale, Revisited** — *When the whole document fits in the window — and when it still shouldn't.*
   Teaches how long-context models behave differently on a 100-page input than chunked retrieval does (positional degradation, "lost in the middle"), and when to hand over the whole document versus retrieve from it. Opens on a reader who dumped a 300-page PDF into the prompt because the context window said it would fit, and got answers that ignored the middle third.

3. **Code as Its Own Modality** — *Why a model that writes good prose can still write broken code.*
   Teaches why code has different statistics than prose — long-range structural dependencies, syntax that must be exactly right — and how code-aware tooling uses repo-level context differently than a plain chat prompt. Opens on a reader whose model-generated refactor compiles cleanly but silently changes behavior three files away.

**Part 2 — Seeing**

4. **Vision: Reading Documents and Screenshots** — *Feeding a model a picture of the problem instead of transcribing it.*
   Teaches how vision-language models actually consume an image (patches, not pixels), and why a UI screenshot or scanned form behaves differently from an ordinary photo. Opens on a reader manually retyping data out of a screenshot into a prompt, not realizing they could just send the image.

5. **Vision: Charts, Diagrams, and Where OCR Still Wins** — *A model can describe a chart. Can it read the exact number off it?*
   Teaches the gap between "understanding" a chart and extracting a precise value from it, and why dedicated OCR/table extraction still beats a vision model on dense structured documents. Opens on a reader who trusted a model's read of a bar chart and shipped a subtly wrong number.

**Part 3 — Hearing and Moving Pictures**

6. **Audio In: Speech-to-Text and Streaming Transcription** — *Turning a live microphone into tokens a model can use.*
   Teaches batch transcription versus streaming ASR, partial-versus-final transcripts, and how a transcription error quietly becomes a model error downstream. Opens on a reader whose voice feature works perfectly on their own test audio and falls apart the first time a real user has an accent or background noise.

7. **Audio Out and Realtime Voice: What Latency Does to the Design** — *The three-way race between hearing, thinking, and speaking.*
   Teaches the STT-then-LLM-then-TTS pipeline versus native speech-to-speech models, why every extra hop adds a latency tax, and how interruption handling ("barge-in") reshapes the architecture. Opens on a reader whose voice-assistant demo felt magical, and whose real users hung up because it paused half a second too long.

8. **Video: Sampling, Temporal Context, and Token Cost** — *A video is not a very long image.*
   Teaches why models sample frames instead of watching continuously, how reasoning about what changed between frames differs from single-frame vision, and why video is the most expensive thing you can send a model. Opens on a reader who sent a ten-minute video expecting frame-by-frame understanding and got a vague summary that missed the one moment that mattered.

**Part 4 — Across Modalities**

9. **Embeddings Across Modalities and Multimodal Retrieval** — *Putting a picture and a sentence in the same space.*
   Teaches how multimodal embedding models map images, text, and audio into a shared vector space, and the newer approach of embedding a whole document page directly instead of running OCR first. Opens on a reader trying to search scanned invoices with text embeddings and getting nothing back because OCR mangled the numbers.

10. **When a Small Specialized Model Beats a General One** — *You don't always need the model that can also write poetry.*
    Teaches why a narrow, well-labeled task — classification, extraction, a fixed visual check — often does better and cheaper on a small specialized model than a frontier multimodal one, and how to tell if a task is narrow enough. Opens on a reader running every image through the biggest available vision model for a yes/no check that a much smaller model would nail for a fraction of the cost.

11. **Choosing a Modality Stack** — *The decision, laid out plainly, before you build.*
    A checklist lesson tying the course together: matching the modality to the actual failure mode, and flagging combinations that fight each other. Mirrors "Picking a Model" as the LLMs course's capstone. Opens on a reader staring at five different APIs for five modalities, unsure where to even start.

---

### Course A — Fine-Tuning
**Subtitle:** Changing what the model does, not what it knows.
**Blurb:** Prompting and retrieval solve almost everything. This course is for the narrow, real case where they don't — and for reading a vendor's "fine-tuned for you" pitch without being sold on it. It covers what training actually changes, where the real month of work goes, and the honest bill once the model you built on updates out from under you.

**Part 1 — Deciding, and How It Works**

1. **When Fine-Tuning Beats Prompting and RAG** — *The three questions to ask before you touch a training script.*
   Teaches that fine-tuning changes behavior and form (schema, voice, narrow style) but doesn't inject facts — that's what RAG is for — so it's the last resort, not the first. Opens on a reader who spent a month fine-tuning a model to "know" pricing data that goes stale next quarter, when a lookup would have taken an afternoon.

2. **What Supervised Fine-Tuning Actually Changes** — *Same architecture, different weights — what "training" means here.*
   Teaches SFT as continuing the same next-token training loop on your own examples, and why that reshapes format and style, not facts. Opens on a reader confused why their newly fine-tuned model still hallucinates the exact same facts it did before.

3. **LoRA and the Parameter-Efficient Family** — *Training a tiny patch instead of the whole model.*
   Teaches why full fine-tuning means rewriting billions of weights, and how LoRA-style methods freeze the base model and train small inserted matrices instead — with rank as the main knob. Opens on a reader who priced out full fine-tuning and assumed it was out of reach on their hardware.

**Part 2 — The Data (the Real Cost Center)**

4. **Building a Training Set** — *Where the actual month of work goes.*
   Teaches sourcing examples that match the exact task boundary you want, not general chat, and why "how many examples is enough" is answered by your eval, not a fixed number. Opens on a reader with forty example conversations and no idea if that's ten times too few or plenty.

5. **Cleaning and Grading a Training Set** — *Garbage in, confidently wrong out.*
   Teaches deduplication, label noise, and how conflicting examples cancel each other's training signal — plus why one bad batch can hurt more than skipping fine-tuning entirely. Opens on a reader whose model got worse after they added "more" training data.

**Part 3 — Beyond Supervised: Preference and Compression**

6. **Preference Tuning: DPO and What Came After** — *Teaching a model "this one, not that one," without a reward model.*
   Teaches RLHF's reward-model-plus-PPO loop versus DPO's direct optimization on preference pairs, and why DPO became the practical default. Opens on a reader who wants the model to reliably stop being verbose in one direction, not just sometimes.

7. **Distilling a Big Model Into a Small One** — *Training a small model to imitate a big one, on your narrow job.*
   Teaches the teacher-student setup, why matching the teacher's full output distribution transfers more than copying just its final answers, and the honest limit — the student won't generalize past what the teacher covered. Opens on a reader whose narrow extraction task is stuck paying frontier-model prices for work a much smaller model could do.

**Part 4 — Living With an Adapted Model**

8. **Catastrophic Forgetting: What Fine-Tuning Breaks** — *Fixing the thing you trained for, and quietly breaking three others.*
   Teaches why narrow fine-tuning degrades capabilities the training set never touched, and the mitigations — mixing in general data, lower rank, fewer epochs. Opens on a reader whose support-bot fine-tune got great at ticket formatting and terrible at arithmetic it used to handle fine.

9. **Evaluating an Adapted Model** — *"It feels better" is not an evaluation.*
   Teaches building a held-out eval set before training, not after, and regression-testing against the base model's old behavior. Opens on a reader who shipped a fine-tune that looked great in the demo and got complaints within a week.

10. **Serving an Adapter: Multi-LoRA and Adapters at Request Time** — *One base model, many personalities, one GPU.*
    Teaches hot-swapping adapters per request instead of deploying a full model per task, and how that changes the economics of running several fine-tunes at once. Opens on a reader who assumed every fine-tuned variant needs its own deployed model and is stunned by the bill.

11. **The Cost-and-Effort Picture: Fine-Tuning vs Staying on an API** — *The bill doesn't stop when training finishes.*
    Teaches the recurring cost of retraining every time the base model updates, and the hidden cost of maintaining the data and eval pipeline — set against just prompting a newer model for free. Opens on a reader planning a fine-tuning project who forgot that next quarter's model update means redoing all of it.

## 3. Ordering rationale

- **Multimodal before Fine-Tuning.** The reader profile — codes well, never built on an LLM — is far more likely to hit "my JSON parsing broke" or "how do I feed it a screenshot" in the next month than to fine-tune anything. Multimodal also stays inside the skill the first three courses already built (calling an API well); fine-tuning adds a genuinely new skill (managing training data and eval like an ML project). Put the lower-barrier, higher-frequency course first.
- **Within Multimodal:** Part 1 opens with text-shaped problems (structured output, long context, code) because they're the shortest hop from the RAG course the reader just finished. Vision, then audio/video, escalate in unfamiliarity. The course closes with retrieval-across-modalities and a "when not to" lesson, mirroring how the RAG course closed with "when RAG is the wrong tool" and the LLMs course closed with "picking a model."
- **Within Fine-Tuning:** the decision lesson comes first on purpose — most readers who arrive here should leave after lesson 1 having decided *not* to fine-tune, and that's a win, not an attrition problem. Data lessons come before methods (DPO, distillation) because the brief and the sources agree: the data is the actual cost, methods are comparatively mechanical. Forgetting, eval, serving, and cost close the course as the "so you did it, now what" arc, ending on the same honest cost framing the course opened with.
- **Relative to the existing three courses:** both new courses assume LLMs, Prompt Engineering, and RAG are already read. Multimodal explicitly revisits and extends RAG's embeddings/retrieval lesson (lesson 9) and Prompt Engineering's "output contracts" lesson (lesson 1, at a lower mechanical level — token masking, not contract design) rather than repeating them.

## 4. Rejected

- **Full RLHF pipeline (reward modeling + PPO) as its own lesson** — too deep and rare for an app-building audience; covered by contrast inside the DPO lesson instead.
- **GRPO / RL-for-reasoning training** — a model-builder concern, not a practitioner one; also moving fast enough in September 2026 to date badly within a month.
- **On-policy / self-distillation (e.g., Cursor-style "hint becomes the teacher")** — genuinely new as of mid-2026, not yet a stable mechanic; further-reading link only, not a lesson.
- **"Which fine-tuning provider / framework is best"** — a rankings question, banned by the site's own rule.
- **Text-to-image and text-to-video generation** — a different product category (generating media, not understanding it); also the fastest-moving, most hype-prone corner of multimodal AI and not in the brief's scope.
- **Function/tool calling as a Multimodal lesson** — already owned by Prompt Engineering's "Output contracts"; would duplicate rather than extend.
- **Full agent frameworks orchestrating multiple modalities** — a framework/product layer, belongs to a future agents course, not a mechanic of one modality.
- **Vendor-specific realtime voice API walkthroughs (e.g., one company's Realtime API)** — that's vendor docs, not a mechanic; the latency lesson teaches the STT/LLM/TTS tradeoff qualitatively instead of any one vendor's numbers, since the site bans figures that go stale.

## 5. Sources

- [bigdataboutique.com — Fine-Tuning LLMs in 2026: When RAG Isn't Enough](https://bigdataboutique.com/blog/fine-tuning-llms-when-rag-isnt-enough) — current 2026 practitioner framing of the prompt → RAG → fine-tune → distill sequence.
- [futureagi.com — Fine-Tuning LLMs in 2026: LoRA, QLoRA, DPO, GRPO Compared](https://futureagi.com/blog/fine-tuning-llms-unlocking-peak-performance/) — 2026 method landscape; used for the LoRA/QLoRA sizing mechanic.
- [together.ai — Direct Preference Optimization: A Technical Deep Dive](https://www.together.ai/blog/direct-preference-optimization) — foundational DPO mechanic, still accurate.
- [mercor.com — DPO vs RLHF: Comparison and When to Use Each](https://www.mercor.com/resources/experts/dpo-vs-rlhf/) — current comparison, confirms DPO as the practical default.
- [letsdatascience.com — How Structured Outputs and Constrained Decoding Work](https://letsdatascience.com/blog/structured-outputs-making-llms-return-reliable-json) — mechanic of token masking vs. prompting for format.
- [medium.com/@emrekaratas-ai — Structured Output Generation: JSON Schema and Grammar-Based Decoding](https://medium.com/@emrekaratas-ai/structured-output-generation-in-llms-json-schema-and-grammar-based-decoding-6a5c58b698a6) — confirms XGrammar/llguidance as current (March 2026) backends; used for the "constraint tax" framing.
- [bigdataboutique.com — Multimodal RAG in 2026](https://bigdataboutique.com/blog/multimodal-rag-retrieval-over-images-pdfs-and-text) — current mechanic for treating page images as first-class retrieval objects.
- [mixpeek.com — Best Multimodal Embedding Models in 2026](https://mixpeek.com/curated-lists/best-multimodal-embedding-models) — checked for mechanic only (multi-vector/late-interaction, ColPali-style page embedding), not for rankings, which the lesson must not cite.
- [retellai.com — How Real-Time Voice AI Actually Works](https://www.retellai.com/blog/how-real-time-voice-ai-works-stt-llm-tts) — current pipeline-vs-native-speech-to-speech mechanic.
- [forasoft.com — OpenAI Realtime API: Production Voice Agents (2026)](https://www.forasoft.com/blog/article/openai-realtime-api-voice-agent-production-guide-2026) — checked for the latency-stacking concept only; specific millisecond figures deliberately excluded from lesson content since they'll date.
- [medium.com/@kiranvutukuri — Knowledge Distillation: Teaching Smaller Models from Larger Ones](https://medium.com/@kiranvutukuri/74-knowledge-distillation-teaching-smaller-models-from-larger-ones-bfe08d408041) — core teacher/student mechanic.
- [huggingface.co/blog/sergiopaniego — Distillation in 2026](https://huggingface.co/blog/sergiopaniego/distillation-2026) — current state of the art; used only to identify self-distillation as too new to teach as settled mechanic.
- [tianpan.co — LoRA Adapter Composition in Production](https://tianpan.co/blog/2026-04-19-lora-adapter-composition-production) — current (April 2026) multi-LoRA serving mechanic.
- [docs.vllm.ai — LoRA Adapters](https://docs.vllm.ai/en/stable/features/lora/) — stable reference for how adapter hot-swapping works.
- [dontpaniclabs.com — Specialized Models Beat General LLMs (Sometimes)](https://dontpaniclabs.com/blog/post/2026/02/24/specialized-models-beat-general-llms-sometimes/) — current (Feb 2026), grounds the "small specialized model" lesson without citing specific benchmark scores.
