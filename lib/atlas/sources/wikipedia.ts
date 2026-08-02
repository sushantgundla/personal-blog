// Wikipedia REST summary client.
//
// Note (design spec §3.6): the lead image for a country page is almost
// always its flag, not scenery — landmark photos come from Wikidata's
// UNESCO site query (P18 images) instead, not from here.
import type { SourceResult, WikipediaSummary } from "../types";

const REVALIDATE_DAY = 86400;

interface WikipediaSummaryResponse {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: { source: string; width: number; height: number };
  content_urls?: { desktop?: { page?: string } };
  timestamp?: string;
}

export async function fetchSummary(
  wikiTitle: string
): Promise<SourceResult<WikipediaSummary>> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      wikiTitle
    )}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "AtlasCountryExplorer/1.0 (https://sushantgundla.com/atlas; contact: atlas@sushantgundla.com)",
      },
      next: { revalidate: REVALIDATE_DAY },
    });
    if (!res.ok) {
      return { ok: false, reason: `Wikipedia HTTP ${res.status} for ${wikiTitle}` };
    }
    const body = (await res.json()) as WikipediaSummaryResponse;
    return {
      ok: true,
      data: {
        title: body.title,
        extract: body.extract,
        description: body.description ?? null,
        thumbnailUrl: body.thumbnail?.source ?? null,
        canonicalUrl:
          body.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`,
        revisionTimestamp: body.timestamp ?? null,
      },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
