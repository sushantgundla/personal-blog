// Refresh one country's dossier live and make it durable for everyone, not
// just the visitor who clicked — the button on /atlas/[iso3] shown in
// RefreshButton.tsx.
//
// POST only — see the exported GET below, which just answers "use POST"
// instead of silently doing a refresh. That plus the cooldown below is the
// guard against a refresh being triggered in a loop or by a crawler
// (crawlers issue GET, never POST, and don't hold cookies/state across
// requests that a cooldown keyed only on iso3 needs anyway).
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

// Keyed by ISO3. Per-server-instance only — see the doc comment above on
// why that's an acceptable, not a complete, guard on serverless.
const lastRefreshAt = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes — a whole live fetch already takes many seconds

export async function GET() {
  return NextResponse.json(
    { error: "Refresh a country with POST, not GET." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(_request: NextRequest, { params }: { params: { iso3: string } }) {
  const iso3 = params.iso3.toUpperCase();
  if (!BY_ISO3[iso3]) {
    return NextResponse.json({ error: `${iso3} is not a known country.` }, { status: 404 });
  }

  const now = Date.now();
  const last = lastRefreshAt.get(iso3);
  if (last !== undefined && now - last < COOLDOWN_MS) {
    const retryAfterSec = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    return NextResponse.json(
      { error: `${BY_ISO3[iso3].name} was refreshed recently. Try again in ${retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }
  lastRefreshAt.set(iso3, now);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      try {
        send({ stage: "start", message: `Fetching live data for ${BY_ISO3[iso3].name}…` });

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
        send({
          stage: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
