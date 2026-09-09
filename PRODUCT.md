# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Working software engineers who can already code well but have never built
anything on top of a large language model. They arrive mid-course from a search
result — "what is reranking", "HNSW vs IVF", "why does my prompt get ignored" —
land on one lesson, and have to work out within seconds where they are and
whether this is worth reading. A smaller second audience browses the index
deliberately: peers and recruiters looking at what the author knows.

Secondary surface: the same person's personal site, `sushantgundla.com`, from
which some readers arrive.

## Product Purpose

A free reading site that teaches the mechanics of building with LLMs, one short
lesson at a time. Success is a reader finishing a lesson able to do something
they could not do before, and answering the recall quiz without scrolling back
up.

## Positioning

Practitioner mechanics, not tutorials and not theory. Every lesson explains what
the machine is actually doing and stops short of the spec sheet — no prices,
model rankings or benchmark numbers that will be wrong in a month, and a pointer
to look the current figure up instead. Written by one named engineer, with a
point of view, rather than assembled as vendor documentation.

## Operating Context

- Read on a laptop, usually alongside an editor and the reader's own failing
  code. Frequently on a phone.
- Cold entry is the normal case: most sessions start on a lesson page, not the
  index.
- No account, no sign-in, no email capture. Progress lives in `localStorage`
  under `learn:progress:v1` and never leaves the browser.
- Sessions are short and repeat: a lesson is 5–8 minutes and readers come back
  for another.

## Capabilities and Constraints

- Next.js 14 App Router, TypeScript strict, Tailwind v3. Content is MDX read
  from `content/learn/` at build time by `lib/learn.ts`; every page is static.
- Four courses, forty-eight lessons. Structure per course: a `course.json` with
  named parts, then numbered lesson files.
- Each lesson has a fixed anatomy: part, course, minutes, title, subtitle, a
  "why this, for you" opener, three numbered sections of prose with comparison
  tables and one code block, a five-line summary, a five-question recall quiz
  with instant feedback, further-reading links, and previous/next.
- Comparison tables are the workhorse of the writing and appear in almost every
  lesson. They must stay readable on a phone.
- Served at `learn.sushantgundla.com`; `sushantgundla.com/learn/...` permanently
  redirects there. Both are the same static build.
- Dark and light must both work, driven by `next-themes` and the tokens in
  `app/globals.css`.
- **Never a fixed pixel max-width.** The layout is fluid at every size; grey
  bars either side of the content are a defect.

## Brand Commitments

- Author: Sushant Gundla. The site is recognisably an extension of
  `sushantgundla.com` — a reader arriving from there should feel continuity —
  while being far more specific than a neutral reading template.
- The site's accent and token family come from `app/globals.css`
  (`--primary` #FF6B2B and the `--surface-*` ramp).
- The written voice is fixed and not up for redesign: short sentences, everyday
  words, exact names for real things, no hype, no emoji.

## Evidence on Hand

- Forty-eight written lessons in `content/learn/`, all real, all the author's.
- No testimonials, no student numbers, no completion statistics, no logos, no
  press. None of these may be invented or implied.
- No photography or illustration assets exist for this site today.

## Product Principles

1. The cold reader is the design's first customer. Any lesson page must place
   itself — which course, which part, how long — before the reader decides to
   stay.
2. Prose is the product. Everything on the page serves the reading column or
   gets out of its way.
3. Recall over completion. The quiz exists to make the reader retrieve, not to
   score them; there is no achievement, streak, badge or percentage anywhere.
4. Honest about what is not known. Where a number would date, the lesson says
   where to look it up rather than inventing one.
5. No account, ever. Nothing about the reader is stored anywhere but their own
   browser.

## Accessibility & Inclusion

Body text meets 4.5:1 in both themes. The quiz is operable by keyboard, its
options are real buttons, and its result is announced in a live region — right
and wrong are never signalled by colour alone. Motion is minimal by intent and
respects `prefers-reduced-motion`.
