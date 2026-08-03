# Documentation

Docs for `sushantgundla.com` — a personal site built on Next.js App Router, with a home page
(`/`) that can swap between thirty different visual designs at runtime.

## Start here

New to this repo? Read [`docs/architecture/overview.md`](architecture/overview.md) first — it
explains how the app is put together. Then skim
[`docs/history/redesign-2026-08.md`](history/redesign-2026-08.md) for how it got this way.

## Common tasks

| I want to... | Go to |
|---|---|
| Publish a new article | [`docs/guides/writing-content.md`](guides/writing-content.md) |
| Add a new design ("dimension") | [`docs/guides/adding-a-dimension.md`](guides/adding-a-dimension.md) |
| Run the site locally | [`docs/guides/local-development.md`](guides/local-development.md) |
| Ship a change to production | [`docs/guides/deployment.md`](guides/deployment.md) |

## Architecture

How the app is built.

| Doc | Answers |
|---|---|
| [`architecture/overview.md`](architecture/overview.md) | How the app is structured — routing, route groups, where pages and components live |
| [`architecture/design-system.md`](architecture/design-system.md) | The `/v2` design token and class vocabulary contract — what every dimension must follow |
| [`architecture/routing.md`](architecture/routing.md) | How routes map to files, and how `app/(main)` differs from `/old` |

## Atlas

The country-explorer feature (`/atlas`).

| Doc | Answers |
|---|---|
| [`atlas/overview.md`](atlas/overview.md) | What Atlas is and how its pieces fit together |
| [`atlas/design.md`](atlas/design.md) | Atlas's own visual design |
| [`atlas/data-sources.md`](atlas/data-sources.md) | Where Atlas's country data comes from |
| [`atlas/story-catalog.md`](atlas/story-catalog.md) | The country stories/content catalog |
| [`atlas/build-pipeline.md`](atlas/build-pipeline.md) | How Atlas data is built and refreshed |

## Guides

Step-by-step instructions for common changes.

| Doc | Answers |
|---|---|
| [`guides/writing-content.md`](guides/writing-content.md) | How to write and publish an article |
| [`guides/adding-a-dimension.md`](guides/adding-a-dimension.md) | How to add a new `/v2` theme (dimension) |
| [`guides/local-development.md`](guides/local-development.md) | How to run the site on your machine |
| [`guides/deployment.md`](guides/deployment.md) | How changes get to production |

## History

Why things are the way they are.

| Doc | Answers |
|---|---|
| [`history/redesign-2026-08.md`](history/redesign-2026-08.md) | The story of the August 2026 redesign — what changed, why, and what got fixed after shipping |
| [`history/decisions.md`](history/decisions.md) | Durable engineering decisions and the traps behind each one |
