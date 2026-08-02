// Open-Meteo client — live weather at the capital. No API key.
import type { SourceResult, WeatherNow } from "../types";

const REVALIDATE_HOUR = 3600;

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    wind_speed_10m?: number;
  };
}

export async function fetchCapitalWeather(
  lat: number,
  lng: number
): Promise<SourceResult<WeatherNow>> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_HOUR } });
    if (!res.ok) {
      return { ok: false, reason: `Open-Meteo HTTP ${res.status}` };
    }
    const body = (await res.json()) as OpenMeteoResponse;
    return {
      ok: true,
      data: {
        temperatureC: body.current.temperature_2m,
        windKph: body.current.wind_speed_10m ?? null,
        observedAt: body.current.time,
      },
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
