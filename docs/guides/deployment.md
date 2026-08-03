# Deployment

How this site ships, and the one thing that looks like a broken deploy but isn't.

## Where things live

| What | Where |
|---|---|
| Live site | https://sushantgundla.com |
| Vercel project | https://vercel.com/sushantgundlas-projects/personal-blog |
| Repo | https://github.com/sushantgundla/personal-blog |

## How a deploy happens

Push to `main`. Vercel watches that branch and auto-deploys — no manual step, no Vercel
CLI used in this project. A deploy takes roughly 45–90 seconds from push to live.

**"Shipped" means pushed to `main` and verified on the live domain** — not just working
on `localhost`, and not just a green build log. Confirm the change on
https://sushantgundla.com itself before calling it done.

## Before you push

1. Check the current branch — confirm you're pushing what you mean to push.
2. Run `git status`. If there's work in progress from another session mixed into your
   working tree, stage deliberately (`git add <specific files>`), not `git add -A` — you
   don't want to sweep someone else's unfinished changes into your commit.
3. Confirm `npm run build` exits 0 before pushing. A build that fails on Vercel fails the
   same way locally — catch it before the push, not after.

## Gotcha: hammering the live site trips bot mitigation

If you script repeated requests at https://sushantgundla.com (a loop of `curl`, an
automated crawler, etc.), Vercel's bot mitigation kicks in and **every route starts
returning 403**, with the response header `x-vercel-mitigated: challenge`.

**This is not a broken deploy.** It's Vercel blocking what looks like a bot. A real
browser solves the JS challenge automatically and sees the site normally. To verify a
deploy, open the site in a real browser — don't verify with a loop of `curl` requests,
that's exactly what triggers the block.
