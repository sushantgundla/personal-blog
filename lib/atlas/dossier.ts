// Composes every Atlas data source into one CountryDossier.
//
// Promise.allSettled, never Promise.all: one dead source must never blank
// the whole page. A country entirely absent from the World Bank (Taiwan,
// Western Sahara, Vatican City) still gets a full dossier here, with
// worldBank/timeSeries as ok:false and everything else populated normally.
//
// Fixed 2026-08-03: a cold page used to wait on every one of the ~11 live
// calls below, and those APIs throttle hard enough that this measured
// 30-95s on a cold /atlas/[iso3] page. getDossier() now reads
// content/atlas/snapshot/countries/{iso3}.json first — a plain file read,
// no network, effectively instant — and only falls back to the live
// composition (fetchLiveDossier, the function this file used to export as
// getDossier) for a country the snapshot doesn't have yet. The snapshot is
// built by scripts/atlas/build-snapshot.mjs and kept fresh per-country by
// the refresh button (app/atlas/api/refresh/[iso3]/route.ts).
//
// Fixed 2026-08-03 (again): the file write above is the only durable path,
// and on a serverless host (Vercel) the deployed filesystem is read-only —
// so a refresh only ever helped the one visitor who clicked it. getDossier()
// now also goes through Next's own Data Cache (unstable_cache, tagged per
// country), which — unlike a plain file write — Vercel genuinely shares
// across every instance and region of a deployment. The refresh route calls
// revalidateTag for this country's tag, so the *next* read recomputes once
// (that recompute is what pays the live-fetch cost, inside the refresh
// route's own request — see loadCachedPart below) and every visitor after
// that gets the fresh copy from the shared cache, not a live call. The file
// write is kept too, purely so local dev / any host with a writable disk
// gets a durable copy on top of that.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { unstable_cache, revalidateTag } from "next/cache";
import { BY_ISO3 } from "./iso-countries";
import { ALL_INDICATOR_CODES, CHART_INDICATOR_CODES } from "./indicators";
import { fetchLatestIndicators, fetchTimeSeries } from "./sources/worldbank";
import { fetchDossierFacts } from "./sources/wikidata";
import { fetchSummary } from "./sources/wikipedia";
import { fetchTradeSummary } from "./sources/comtrade";
import { fetchCapitalWeather } from "./sources/meteo";
import { fetchRate } from "./sources/fx";
import { getOverrides } from "./overrides";
import type {
  CountryDossier,
  Person,
  SourceResult,
  WikidataFacts,
  WikipediaSummary,
} from "./types";

function toResult<T>(settled: PromiseSettledResult<SourceResult<T>>): SourceResult<T> {
  if (settled.status === "fulfilled") return settled.value;
  const reason = settled.reason;
  return { ok: false, reason: reason instanceof Error ? reason.message : String(reason) };
}

function notInIsoTable<T>(iso3: string): Promise<SourceResult<T>> {
  return Promise.resolve({ ok: false, reason: `${iso3} is not in the local ISO table` });
}

/** content/atlas/famous-people.json — generated at build time by
 * scripts/atlas/build-people.mjs because the live SPARQL query takes 26.8s
 * for a country the size of India. Missing file/entry is a normal empty
 * state, not an error. */
async function loadFamousPeople(iso3: string): Promise<SourceResult<Person[]>> {
  try {
    const filePath = path.join(process.cwd(), "content", "atlas", "famous-people.json");
    const raw = await readFile(filePath, "utf-8");
    const all = JSON.parse(raw) as Record<string, Person[]>;
    return { ok: true, data: all[iso3] ?? [] };
  } catch {
    return { ok: true, data: [] };
  }
}

const SNAPSHOT_DIR = path.join(process.cwd(), "content", "atlas", "snapshot", "countries");

function snapshotPath(iso3: string): string {
  return path.join(SNAPSHOT_DIR, `${iso3}.json`);
}

/**
 * Read the committed snapshot for one country. Returns null on a missing
 * file or a file that fails to parse — either way the caller's job is to
 * fall back to fetchLiveDossier, not to throw.
 */
async function readSnapshot(iso3: string): Promise<CountryDossier | null> {
  try {
    const raw = await readFile(snapshotPath(iso3), "utf-8");
    return JSON.parse(raw) as CountryDossier;
  } catch {
    return null;
  }
}

/**
 * Best-effort write — used by the refresh route after a live re-fetch.
 * Wrapped in try/catch because the deployed app's filesystem may be
 * read-only (e.g. Vercel's serverless functions): the write can silently
 * fail there and the freshly-fetched data is still returned to the caller,
 * it just won't durably update what the *next* visitor sees until the
 * snapshot is rebuilt and redeployed. See build-snapshot.mjs's doc comment
 * and the report to team-lead for the full trade-off.
 */
export async function writeSnapshot(iso3: string, dossier: CountryDossier): Promise<boolean> {
  try {
    await mkdir(SNAPSHOT_DIR, { recursive: true });
    await writeFile(snapshotPath(iso3), JSON.stringify(dossier), "utf-8");
    return true;
  } catch {
    return false;
  }
}

/** The Next Data Cache tag for one country's dossier — shared by getDossier's
 * cache accessor below and the refresh route's revalidateTag call, so they
 * agree on exactly what a refresh invalidates. */
export function dossierCacheTag(iso3: string): string {
  return `atlas-dossier-${iso3}`;
}

type CachedDossierPart = Omit<CountryDossier, "overrides" | "famousPeople">;

function withoutLocalFields(dossier: CountryDossier): CachedDossierPart {
  const { overrides: _overrides, famousPeople: _famousPeople, ...rest } = dossier;
  return rest;
}

/**
 * A one-shot, per-process handoff from refreshDossier to the cache recompute
 * it deliberately triggers a few lines later in the same request — see
 * refreshDossier's doc comment for why this exists and why it's still
 * correct on a multi-instance deployment even though this Map itself is not
 * shared across instances.
 */
const pendingFresh = new Map<string, CountryDossier>();

async function loadCachedPart(iso3: string): Promise<CachedDossierPart> {
  const pending = pendingFresh.get(iso3);
  if (pending) {
    pendingFresh.delete(iso3);
    return withoutLocalFields(pending);
  }
  const snapshot = await readSnapshot(iso3);
  return withoutLocalFields(snapshot ?? (await fetchLiveDossier(iso3)));
}

function getCachedPart(iso3: string): Promise<CachedDossierPart> {
  return unstable_cache(() => loadCachedPart(iso3), ["atlas-dossier-v1", iso3], {
    tags: [dossierCacheTag(iso3)],
    revalidate: false, // forever, until revalidateTag(dossierCacheTag(iso3)) — see refreshDossier
  })();
}

/**
 * The fast path: read from Next's Data Cache, which on Vercel is a real,
 * durable store shared across every instance and region of a deployment —
 * not per-process memory. A cache miss (a fresh deploy, or the very first
 * request for a country) falls through to loadCachedPart, which reads the
 * committed snapshot file (still no network) and that becomes the cached
 * value from then on, until a refresh explicitly invalidates it.
 *
 * `overrides` and `famousPeople` are always recomputed fresh here, outside
 * the cached part (both are cheap local reads, no network) rather than
 * trusted from whatever was cached or snapshotted — lib/atlas/overrides.ts
 * is a hand-edited file meant to take effect the moment someone edits it
 * (that's the whole point of it overriding vandalism-prone Wikidata fields),
 * and content/atlas/famous-people.json can likewise be regenerated by
 * build-people.mjs independently of this country's dossier cache. Neither
 * should have to wait for a cache invalidation or a snapshot rebuild.
 */
export async function getDossier(iso3: string): Promise<CountryDossier> {
  const cached = await getCachedPart(iso3);
  return {
    ...cached,
    overrides: getOverrides(iso3),
    famousPeople: await loadFamousPeople(iso3),
  };
}

/**
 * Used only by the refresh route (app/atlas/api/refresh/[iso3]/route.ts).
 * Does the real live fetch, then makes it durable two ways:
 *
 * 1. Best-effort file write, for local dev and any host with a writable
 *    disk — see writeSnapshot's own doc comment.
 * 2. Populates Next's Data Cache with the value directly: `pendingFresh`
 *    hands the already-fetched dossier to the very next recompute so it
 *    doesn't have to re-derive it from a snapshot file that may not have
 *    been writable, `revalidateTag` marks the old cached value stale, and
 *    the immediate `getDossier(iso3)` call right after is what actually
 *    performs that recompute — inside *this* request, not some later
 *    visitor's. Whatever getDossier returns there is what unstable_cache
 *    stores, and on Vercel that store is shared fleet-wide — so every
 *    visitor after this one request gets the fresh copy from the shared
 *    cache, with no live fetch of their own, even though the underlying
 *    filesystem may be read-only. This is the piece a plain file write
 *    alone could never provide on a serverless host.
 */
export async function refreshDossier(
  iso3: string,
  onProgress?: DossierProgress
): Promise<{ dossier: CountryDossier; filePersisted: boolean }> {
  const dossier = await fetchLiveDossier(iso3, onProgress);
  const filePersisted = await writeSnapshot(iso3, dossier);
  pendingFresh.set(iso3, dossier);
  revalidateTag(dossierCacheTag(iso3));
  await getDossier(iso3); // pays the one recompute now, inside this request
  return { dossier, filePersisted };
}

/** Called as each source resolves, live-fetch only — lets the refresh route
 * (app/atlas/api/refresh/[iso3]/route.ts) stream real progress to the button
 * instead of one silent wait. Optional; scripts/atlas/build-snapshot.mjs
 * doesn't pass one. */
export type DossierProgress = (
  source:
    | "worldBank"
    | "timeSeries"
    | "wikidata"
    | "wikipedia"
    | "trade"
    | "famousPeople"
    | "weather"
    | "fx",
  result: SourceResult<unknown>
) => void;

/**
 * The live composition every source client gets fired for one country.
 * Exported for scripts/atlas/build-snapshot.mjs and the refresh route
 * (app/atlas/api/refresh/[iso3]/route.ts) — both need exactly this, not the
 * snapshot-preferring getDossier above.
 */
export async function fetchLiveDossier(
  iso3: string,
  onProgress?: DossierProgress
): Promise<CountryDossier> {
  const iso = BY_ISO3[iso3];
  const name = iso?.name ?? iso3;
  const iso2 = iso?.iso2 ?? "";

  const overrides = getOverrides(iso3);

  // Tap each promise as it resolves, before Promise.allSettled batches them,
  // so onProgress fires per-source in real time rather than only once
  // everything is done — the six calls below still run fully concurrently,
  // this only observes them.
  function tap<T>(
    source: Parameters<DossierProgress>[0],
    promise: Promise<SourceResult<T>>
  ): Promise<SourceResult<T>> {
    return promise.then((result) => {
      onProgress?.(source, result);
      return result;
    });
  }

  const [worldBank, timeSeries, wikidata, wikipedia, trade, famousPeople] =
    await Promise.allSettled([
      tap("worldBank", fetchLatestIndicators(iso3, ALL_INDICATOR_CODES)),
      tap("timeSeries", fetchTimeSeries(iso3, CHART_INDICATOR_CODES)),
      tap("wikidata", iso ? fetchDossierFacts(iso.qid) : notInIsoTable<WikidataFacts>(iso3)),
      tap("wikipedia", iso ? fetchSummary(iso.wikiTitle) : notInIsoTable<WikipediaSummary>(iso3)),
      tap("trade", fetchTradeSummary(iso3)),
      tap("famousPeople", loadFamousPeople(iso3)),
    ]).then(
      ([wb, ts, wd, wp, tr, fp]) =>
        [toResult(wb), toResult(ts), toResult(wd), toResult(wp), toResult(tr), toResult(fp)] as const
    );

  // Weather needs the capital's coordinates, and FX needs the currency code
  // — both already resolved facts on `wikidata`, so these run after it
  // rather than duplicating the SPARQL call.
  const coords = wikidata.ok ? wikidata.data.capitalCoordinates : null;
  const currencyCode = wikidata.ok ? wikidata.data.currencyCode : null;
  const [weather, fx] = await Promise.allSettled([
    tap(
      "weather",
      coords
        ? fetchCapitalWeather(coords.lat, coords.lng)
        : Promise.resolve<SourceResult<never>>({
            ok: false,
            reason: "No capital coordinates available",
          })
    ),
    tap("fx", fetchRate(currencyCode)),
  ]).then(([w, f]) => [toResult(w), toResult(f)] as const);

  return {
    iso3,
    iso2,
    name,
    worldBank,
    timeSeries,
    wikidata,
    wikipedia,
    trade,
    weather,
    fx,
    famousPeople,
    overrides,
    capturedAt: new Date().toISOString(),
  };
}
