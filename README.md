# sushantgundla.com

Sushant Gundla's personal site: articles, projects, and a home page that can swap between
thirty different visual designs ("dimensions") at runtime. Built with Next.js App Router,
hand-written CSS, and MDX content.

**Live:** [sushantgundla.com](https://sushantgundla.com)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Full setup notes:
[`docs/guides/local-development.md`](docs/guides/local-development.md).

## Documentation

Start at [`docs/README.md`](docs/README.md) — it indexes everything: architecture, the Atlas
country-explorer feature, how-to guides, and project history. Common starting points:

- Publish an article → [`docs/guides/writing-content.md`](docs/guides/writing-content.md)
- Add a new design → [`docs/guides/adding-a-dimension.md`](docs/guides/adding-a-dimension.md)
- Ship to production → [`docs/guides/deployment.md`](docs/guides/deployment.md)
- Why the site looks the way it does → [`docs/history/redesign-2026-08.md`](docs/history/redesign-2026-08.md)

## Directory layout

```
├── app/
│   ├── (main)/            # Current site — home, /about, /articles, /projects, /radar
│   │   ├── prism.css         # Design token + shared class vocabulary (the "dimension" contract)
│   │   ├── _components/    # Shared page sections (Hero, Signal, RadarView, Writing, ...)
│   │   └── _lib/           # Route-group-local helpers
│   ├── atlas/              # Country-explorer feature (/atlas)
│   ├── old/                # Previous home page design, kept at /old, noindex'd
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Base global styles
├── components/              # Shared components (SiteFrame, etc.)
├── content/
│   ├── articles/            # Blog post MDX
│   ├── radar/                # Radar (Pulses/Picks) MDX
│   └── atlas/                 # Atlas content
├── lib/
│   ├── config.ts             # Site metadata, bio, social links, skills, work history
│   ├── articles.ts           # MDX reading + frontmatter parsing
│   ├── projects.ts           # Project data
│   ├── radar.ts              # Radar data
│   └── atlas/                 # Atlas data layer
├── public/prism/themes/         # The 30 design theme stylesheets
└── docs/                     # All documentation — start at docs/README.md
```

## Dev commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Deploy

Push to GitHub → Vercel auto-deploys, usually within a minute. Domain
`sushantgundla.com` is connected via Vercel project settings > Domains. Details:
[`docs/guides/deployment.md`](docs/guides/deployment.md).
