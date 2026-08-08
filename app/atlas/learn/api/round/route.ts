// One batch of ready-made questions for the training floor — see §7 of
// docs/superpowers/specs/2026-08-03-atlas-learn-design.md.
//
//   GET /atlas/learn/api/round?game=forgery&count=10&seed=abc
//
// The whole design rests on this handler being roughly a millisecond. The
// deck (content/atlas/learn/deck.json) is read once per server process and
// held in module scope by lib/atlas/learn/deck.ts, exactly the way
// lib/atlas/rankings.ts already caches the snapshot. So after the first
// request in a process, answering one is pure CPU over an in-memory object:
// no fetch, no file read, no database. Do not add I/O here — PlayScreen
// fires the next batch mid-run and a slow response would show up as a stall
// between questions.
//
// force-dynamic + no-store are not belt-and-braces. A cached round would
// hand every visitor the same ten questions for as long as the cache lived,
// which is the one failure mode a quiz cannot survive.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// isGameId comes from the generators rather than being re-listed here, so
// there is exactly one place in the codebase that decides what a game is.
// `surprise` is deliberately not one of them — it is a single card for the
// front door, not a round — and is handled on its own below.
import { buildRound, buildSurprise, isGameId } from '@/lib/atlas/learn/questions'
import type { Round, SurpriseCard } from '@/lib/atlas/learn/types'

export const dynamic = 'force-dynamic'

const DEFAULT_COUNT = 10
const MIN_COUNT = 1
const MAX_COUNT = 20

/** Long enough for any seed a caller sensibly sends, short enough that a
 *  1 MB query string can't be turned into work for the generator. */
const MAX_SEED_LENGTH = 64

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const

/** Only used when the caller didn't supply one. Any string works as a seed;
 *  randomUUID is simply the cheapest source of a distinct one. */
function makeSeed(): string {
  return `r${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`
}

function readCount(raw: string | null): number {
  if (raw === null || raw.trim() === '') return DEFAULT_COUNT
  const parsed = Number.parseInt(raw, 10)
  // A garbage count is not worth a 400 — the parameter is optional and the
  // documented behaviour is "defaults to 10".
  if (!Number.isFinite(parsed)) return DEFAULT_COUNT
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, parsed))
}

function readSeed(raw: string | null): string {
  const trimmed = raw?.trim() ?? ''
  if (trimmed === '') return makeSeed()
  return trimmed.slice(0, MAX_SEED_LENGTH)
}

/**
 * The last gate before a round leaves the building. The generators enforce
 * every correctness rule in §6 themselves; this only catches a round that
 * came back structurally unusable — an empty batch, or an `answer` that
 * doesn't index into `options`, either of which would render as a question
 * the player cannot possibly get right. Better a 500 the play screen can
 * offer a retry for than a broken question.
 */
function roundIsWellFormed(round: Round, count: number): boolean {
  if (!Array.isArray(round.questions) || round.questions.length === 0) return false
  if (round.questions.length > count) return false
  return round.questions.every(
    (q) =>
      Array.isArray(q.options) &&
      q.options.length > 0 &&
      Number.isInteger(q.answer) &&
      q.answer >= 0 &&
      q.answer < q.options.length
  )
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const game = params.get('game')?.trim() ?? ''
  const count = readCount(params.get('count'))
  const seed = readSeed(params.get('seed'))

  if (game === '') {
    return NextResponse.json(
      {
        error:
          'Name a game: game=forgery, higher-lower, flags, guess-country, where-in-the-world or surprise.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  // "Surprise me" on the floor: one remarkable fact about one country, not a
  // round. Same route because it draws on the same in-memory deck.
  if (game === 'surprise') {
    try {
      const card: SurpriseCard = await buildSurprise(seed)
      if (!card || !card.iso3 || !card.headline) {
        return NextResponse.json(
          { error: 'Could not deal a card just now. Try again.' },
          { status: 500, headers: NO_STORE_HEADERS }
        )
      }
      return NextResponse.json(card, { headers: NO_STORE_HEADERS })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not deal a card just now.' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }
  }

  if (!isGameId(game)) {
    return NextResponse.json(
      {
        error: `"${game}" is not a game here. Try forgery, higher-lower, flags, guess-country or where-in-the-world.`,
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const round: Round = await buildRound(game, count, seed)
    if (!roundIsWellFormed(round, count)) {
      return NextResponse.json(
        { error: 'Could not build a full round from the deck. Try again.' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }
    return NextResponse.json(round, { headers: NO_STORE_HEADERS })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not build a round.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
