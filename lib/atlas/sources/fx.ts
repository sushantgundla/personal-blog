// Frankfurter exchange-rate client.
//
// Trap (design spec §3.6, confirmed live 2026-08-02): the `.app` domain
// redirects to `.dev` with a malformed doubled path
// (`/v1/latest` -> `/v1/v1/latest`), which 404s. Call `api.frankfurter.dev`
// directly, never `.app`.
//
// Frankfurter covers only ~30 currencies. Returning "not available" for
// everything else is a normal result, not an error — do not fake a rate.
import type { FxRate, SourceResult } from "../types";

const REVALIDATE_DAY = 86400;
const QUOTE_CURRENCY = "USD";

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function fetchRate(
  currencyCode: string | null
): Promise<SourceResult<FxRate>> {
  if (!currencyCode) {
    return { ok: false, reason: "No currency code for this country" };
  }
  if (currencyCode === QUOTE_CURRENCY) {
    return {
      ok: true,
      data: { base: currencyCode, quote: QUOTE_CURRENCY, rate: 1, asOf: "n/a" },
    };
  }
  try {
    const url = `https://api.frankfurter.dev/v1/latest?from=${encodeURIComponent(
      currencyCode
    )}&to=${QUOTE_CURRENCY}`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_DAY } });
    if (!res.ok) {
      // A 404 here almost always just means Frankfurter doesn't cover this
      // currency — that is expected for over half of all countries.
      return { ok: false, reason: `${currencyCode} not covered by Frankfurter` };
    }
    const body = (await res.json()) as FrankfurterResponse;
    const rate = body.rates[QUOTE_CURRENCY];
    if (rate === undefined) {
      return { ok: false, reason: `${currencyCode} not covered by Frankfurter` };
    }
    return {
      ok: true,
      data: { base: currencyCode, quote: QUOTE_CURRENCY, rate, asOf: body.date },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
