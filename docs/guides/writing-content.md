# Writing Content

How to publish an article, a radar pulse, a radar pick, or a project. All content except
projects is a file on disk, read at build time — there is no CMS and no database.

## Articles

Long-form posts, listed at `/articles`.

- **Where**: `content/articles/<slug>.mdx` (or `.md`)
- **Read by**: `lib/articles.ts`, function `getAllArticles()` / `getArticleBySlug()`
- **Slug**: the filename minus its extension. `context-is-the-product.mdx` → slug
  `context-is-the-product` → URL `/articles/context-is-the-product`.
- **Reading time**: computed automatically from the body — word count / 200 words per
  minute, rounded up (`calculateReadingTime` in `lib/articles.ts`). You don't set it.
- **Sort order**: newest `date` first.

Frontmatter fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Falls back to the slug if missing. |
| `date` | string | yes | `"YYYY-MM-DD"`. Drives sort order. |
| `description` | string | yes | Shown in the article list and as the meta description. |
| `tags` | string[] | yes | Feeds the tag filter on `/articles`. See **Tags** below. |

Template — copy this into `content/articles/<your-slug>.mdx`:

```mdx
---
title: "Your Title Here"
date: "2026-08-03"
description: "One or two sentences for the article listing."
tags: ["AI", "Engineering"]
---

Your content starts here. Standard MDX — headings, code fences, lists all work.
```

Then: `git add . && git commit -m "new post: <title>" && git push`. Vercel deploys in
roughly 45–90 seconds. See `docs/guides/deployment.md`.

## Radar pulses

Short-form takes, listed on `/radar`.

- **Where**: `content/radar/posts/<slug>.mdx`
- **Read by**: `lib/radar.ts`, function `getAllRadarPosts()`
- **Slug**: filename minus extension, same rule as articles.
- **Sort order**: newest `date` first.

Frontmatter fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Falls back to the slug if missing. |
| `date` | string | yes | `"YYYY-MM-DD"`. |
| `tags` | string[] | yes | Displayed as chips. Only the first tag shows on the radar list card. |

There is no `description` field for pulses — the body itself is the short take.

Template:

```mdx
---
title: "Your Pulse Title"
date: "2026-08-03"
tags: ["AI", "Dev Tools"]
---

The take, a paragraph or two.
```

## Radar picks

Curated links (tools, models, papers, repos), also part of `/radar`.

- **Where**: `content/radar/picks/<slug>.mdx`
- **Read by**: `lib/radar.ts`, function `getAllRadarPicks()`
- **Slug**: filename minus extension.
- **Sort order**: newest `date` first.

Frontmatter fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Falls back to the slug if missing. |
| `date` | string | yes | `"YYYY-MM-DD"`. |
| `description` | string | yes | One or two sentences on why the pick matters. |
| `url` | string | yes | Link target for the pick. |
| `type` | string | yes | See **`type` values** below. Falls back to `"resource"` if missing or invalid. |
| `tags` | string[] | yes | Displayed as chips. |

**`type` values** — the `PickType` union in `lib/radar.ts`, exactly:

```ts
'blog' | 'repo' | 'tool' | 'model' | 'paper' | 'resource'
```

Use whichever matches: a GitHub project is `repo`, a hosted product is `tool`, a model
release is `model`, an arXiv paper is `paper`, a blog post is `blog`, anything else is
`resource`.

A pick's body (the MDX content below the frontmatter) is not read by `getAllRadarPicks()` —
only the frontmatter fields are used. Keep the body empty or use it as your own notes.

Template:

```mdx
---
title: "Tool Name"
date: "2026-08-03"
description: "What it is and why it's worth a look."
url: "https://example.com"
type: "tool"
tags: ["AI", "Dev Tools"]
---
```

## Projects

Not files — entries in the `projects` array in `lib/projects.ts`, shown on `/projects`.
Edit the array directly and push.

`Project` interface (`lib/projects.ts`):

```ts
interface Project {
  slug: string
  title: string
  organization: string
  period: string
  description: string
  impact?: string       // optional
  tags: string[]
  status: ProjectStatus
  link?: string          // optional — internal path or external URL
}
```

`ProjectStatus` values, exactly:

```ts
type ProjectStatus = 'production' | 'confidential' | 'open-source' | 'experiment'
```

Add a new project by appending an object to the `projects` array, matching the shape and
style of the existing entries.

## Tags — reuse the existing vocabulary

Tags are free-text strings, not a fixed list, but treat them as one. On `/articles`, tags
drive a real filter (checkbox chips built from every unique tag across all articles — see
`app/(main)/articles/page.tsx`). On `/radar`, tags are display-only chips, no filter.

Either way, a near-duplicate tag ("LLM" next to "LLMs") splits one topic into two and
weakens the filter. Reuse an existing tag whenever one fits. Tags currently in use across
articles and radar content:

```
Agent Frameworks, Agents, AI, Anthropic, Automation, Benchmarks, Chatbot, Coding Agents,
Context Engineering, DeepSeek, Design, Dev Tools, Edge AI, Engineering, Essays, Evals,
Evaluation, Google, Industry, LLMs, Local AI, Math, ML Research, Models, Open Source,
Python, RAG, Reasoning, Research, Web Scraping, WebGPU
```

`AI` is on nearly every piece — keep using it as the umbrella tag, then add one or two more
specific tags from the list above (or a genuinely new one if nothing fits).
