// Refresh one country's dossier live and make it durable for everyone, not
// just the visitor who clicked — the button on /atlas/[iso3] shown in
// RefreshButton.tsx.
//
// POST only — see the exported GET below, which just answers "use POST"
// instead of silently doing a refresh. That plus the guards below is the
// defence against a refresh being triggered in a loop, by a crawler
// (crawlers issue GET, never POST), or by another site:
//
//   - Same-origin only. A bodiless POST is a "simple" request, so any page on
//     the web could otherwise make its visitors' browsers fire refreshes here
//     with no preflight. The browser's own Sec-Fetch-Site / Origin headers
//     say where the request came from; anything cross-site gets a 403.
//   - A per-country cooldown, so one country can't be re-fetched in a loop.
//   - A per-instance ceiling on refreshes in flight and per hour, across all
//     countries — the cooldown alone would still let a script walk all ~250
//     countries back to back, each one ~11 calls to APIs that throttle hard.
//
// All three are per server instance (module-scope memory), so on a
// multi-instance serverless host they bound the damage rather than make it
// impossible. That is the trade-off for having no database or KV store.
//
// dossier.ts's refreshDossier does the real work: a live fetch, a
// best-effort write to content/atlas/snapshot/countries/{iso3}.json (works
// on any host with a writable disk, silently a no-op on Vercel's read-only
// deployed filesystem), and — the part that makes it durable even when that
// write fails — populates Next's own Data Cache for this country's tag,
// which Vercel shares across every instance and region of a deployment.
// revalidatePath below additionally busts the page's own ISR HTML cache, a
// separate layer, so the next request re-renders instead of serving an
// already-cached page.
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { BY_ISO3 } from "@/lib/atlas/iso-countries";
import { refreshDossier } from "@/lib/atlas/dossier";
import type { DossierProgress } from "@/lib/atlas/dossier";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes — a whole live fetch already takes many seconds
/** Refreshes running at once on this instance, across all countries. */
const MAX_IN_FLIGHT = 2;
/** Refreshes started on this instance in any rolling hour. */
const MAX_PER_HOUR = 30;
const HOUR_MS = 60 * 60 * 1000;

// Keyed by ISO3.
const lastRefreshAt = new Map<string, number>();
/** Start times of recent refreshes, oldest first, pruned to the last hour. */
const recentStarts: number[] = [];
let inFlight = 0;

function json(body: Record<string, unknown>, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/**
 * True when the browser says the request came from this site. Sec-Fetch-Site
 * is set by every current browser and can't be forged by page script; Origin
 * is the fallback for older ones. A request with neither (curl, a server)
 * isn't a browser being used against its will, so it is let through to the
 * rate limits rather than refused here.
 */
function isSameOrigin(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function GET() {
  return json({ error: "Refresh a country with POST, not GET." }, 405, { Allow: "POST" });
}

export async function POST(request: NextRequest, { params }: { params: { iso3: string } }) {
  if (!isSameOrigin(request)) {
    return json({ error: "Refreshes can only be started from this site." }, 403);
  }

  // Checked before the lookup so an arbitrary path segment is never echoed
  // back or used as a key.
  if (!/^[a-z]{3}$/i.test(params.iso3)) {
    return json({ error: "That is not an ISO3 country code." }, 404);
  }
  const iso3 = params.iso3.toUpperCase();
  const country = BY_ISO3[iso3];
  if (!country) {
    return json({ error: `${iso3} is not a known country.` }, 404);
  }

  const now = Date.now();
  const last = lastRefreshAt.get(iso3);
  if (last !== undefined && now - last < COOLDOWN_MS) {
    const retryAfterSec = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    return json(
      { error: `${country.name} was refreshed recently. Try again in ${retryAfterSec}s.` },
      429,
      { "Retry-After": String(retryAfterSec) }
    );
  }

  while (recentStarts.length > 0 && now - recentStarts[0] >= HOUR_MS) recentStarts.shift();
  if (inFlight >= MAX_IN_FLIGHT || recentStarts.length >= MAX_PER_HOUR) {
    const retryAfterSec =
      inFlight >= MAX_IN_FLIGHT ? 60 : Math.ceil((HOUR_MS - (now - recentStarts[0])) / 1000);
    return json(
      { error: `Too many refreshes right now. Try again in ${retryAfterSec}s.` },
      429,
      { "Retry-After": String(retryAfterSec) }
    );
  }

  lastRefreshAt.set(iso3, now);
  recentStarts.push(now);
  inFlight += 1;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The visitor can close the tab mid-refresh. The refresh itself still
      // finishes (it is what writes the shared cache), but enqueue/close on a
      // cancelled stream throw, and that must not turn into an unhandled
      // rejection or skip the inFlight release below.
      let open = true;
      const send = (event: Record<string, unknown>) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          open = false;
        }
      };
      try {
        send({ stage: "start", message: `Fetching live data for ${country.name}…` });

        const onProgress: DossierProgress = (source, result) => {
          send({ stage: "source", source, ok: result.ok });
        };

        const { dossier, filePersisted } = await refreshDossier(iso3, onProgress);
        revalidatePath(`/atlas/${iso3.toLowerCase()}`, "page");

        send({
          stage: "done",
          filePersisted,
          capturedAt: dossier.capturedAt,
          message: filePersisted
            ? "Refreshed and saved for everyone."
            : "Refreshed and saved for everyone (the on-disk snapshot file itself couldn't be " +
              "updated — this filesystem is read-only — but the shared cache was, which is what every visitor reads from).",
        });
      } catch (err) {
        // The raw error can carry server file paths or upstream URLs; log it
        // here and give the visitor a plain sentence instead.
        console.error(`[atlas refresh] ${iso3} failed:`, err);
        send({ stage: "error", message: "The refresh failed. The page still shows the last saved data." });
      } finally {
        inFlight -= 1;
        if (open) {
          try {
            controller.close();
          } catch {
            // already cancelled by the client
          }
        }
      }
    },
    cancel() {
      // Nothing to abort: the refresh keeps running so the shared cache still
      // gets the fresh copy. start()'s send() notices the closed stream.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      ...NO_STORE,
    },
  });
}
