# sushantgundla.com

Personal blog built with Next.js, Tailwind CSS, and MDX.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Writing a New Post

1. Create a file in `content/articles/your-post-slug.mdx`
2. Add frontmatter:

```mdx
---
title: "Your Post Title"
date: "2026-03-20"
description: "A short description that appears in the article listing."
tags: ["AI", "Engineering"]
---

Your content here. Supports **bold**, *italic*, `code`, 
## headings, lists, blockquotes, and code blocks.
```

3. `git add . && git commit -m "new post" && git push`
4. Vercel auto-deploys in ~45 seconds.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout (header, footer, fonts)
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Design system + typography
│   ├── articles/
│   │   ├── page.tsx        # Articles listing
│   │   └── [slug]/page.tsx # Individual article
│   └── about/page.tsx      # About page
├── components/
│   ├── Header.tsx          # Nav + dark mode toggle
│   ├── Footer.tsx
│   ├── ArticleCard.tsx     # Article preview card
│   └── ThemeProvider.tsx   # Dark mode provider
├── content/
│   └── articles/           # Your MDX blog posts go here
├── lib/
│   ├── articles.ts         # MDX reading utilities
│   └── config.ts           # Site configuration (edit this!)
└── public/                 # Static assets (favicon, images)
```

## Customization

Edit `lib/config.ts` to update your name, bio, social links, and work history.

## Deploy

Push to GitHub. Connect to [Vercel](https://vercel.com). Done.

## Domain

Connect `sushantgundla.com` via Vercel project settings > Domains.
