// UN Comtrade public preview client — trade partners, no API key.
//
// Traps handled (design spec §3.6, confirmed live 2026-08-02):
// - `reporterCode` is M49, not ISO numeric (India is 699, not 356).
// - The response always has `partnerDesc: null` — partner names are joined
//   locally against BY_M49 from lib/atlas/iso-countries.ts.
// - Each real partner appears twice: once with `partner2Code=0` (no
//   re-export breakdown) and again with a non-zero `partner2Code`. Keeping
//   only `partner2Code === 0` and `partnerCode !== 0` (0 is the "World"
//   aggregate row) gives exactly one row per partner.
// - The endpoint throttles: a call with no partner filter can return
//   HTTP 429 back-to-back with an identical prior call. Retried once.
import { BY_M49 } from "../iso-countries";
import type { SourceResult, TradePartner, TradeSummary } from "../types";

const REVALIDATE_WEEK = 604800;

interface ComtradeRow {
  refYear: number;
  period: string;
  partnerCode: number;
  partner2Code: number;
  primaryValue: number;
  isAggregate: boolean;
}

interface ComtradeResponse {
  count: number;
  data: ComtradeRow[];
}

async function fetchFlow(
  m49: string,
  year: number,
  flow: "X" | "M"
): Promise<ComtradeRow[]> {
  const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${m49}&period=${year}&cmdCode=TOTAL&flowCode=${flow}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "AtlasCountryExplorer/1.0 (https://sushantgundla.com/atlas)" },
      next: { revalidate: REVALIDATE_WEEK },
    });
    if (res.ok) {
      const body = (await res.json()) as ComtradeResponse;
      return body.data ?? [];
    }
    if (res.status !== 429 || attempt === 1) {
      throw new Error(`Comtrade HTTP ${res.status} for reporter ${m49} flow ${flow}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return [];
}

function toPartners(rows: ComtradeRow[], year: string): TradePartner[] {
  const real = rows.filter((r) => r.partner2Code === 0 && r.partnerCode !== 0);
  const total = rows.find((r) => r.partnerCode === 0 && r.partner2Code === 0)?.primaryValue ?? null;
  return real
    .sort((a, b) => b.primaryValue - a.primaryValue)
    .map((r) => {
      const iso = BY_M49[String(r.partnerCode).padStart(3, "0")];
      return {
        iso3: iso?.iso3 ?? null,
        name: iso?.name ?? `Partner ${r.partnerCode}`,
        value: r.primaryValue,
        year,
        share: total ? r.primaryValue / total : null,
      };
    });
}

/**
 * Top export and import partners for one country in the most recent
 * available year. Comtrade's annual data lags, so this walks back from the
 * current year until it finds a year with rows (up to 3 years).
 */
export async function fetchTradeSummary(
  iso3: string,
  m49: string | undefined
): Promise<SourceResult<TradeSummary>> {
  if (!m49) {
    return { ok: false, reason: `No M49 code for ${iso3}` };
  }
  try {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 1; year >= currentYear - 4; year--) {
      const [exportRows, importRows] = await Promise.all([
        fetchFlow(m49, year, "X"),
        fetchFlow(m49, year, "M"),
      ]);
      if (exportRows.length > 0 || importRows.length > 0) {
        return {
          ok: true,
          data: {
            reporterIso3: iso3,
            year: String(year),
            exports: toPartners(exportRows, String(year)).slice(0, 15),
            imports: toPartners(importRows, String(year)).slice(0, 15),
          },
        };
      }
    }
    return {
      ok: true,
      data: { reporterIso3: iso3, year: null, exports: [], imports: [] },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
