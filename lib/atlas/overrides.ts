// Hand-written corrections — the ONLY source for head of state and head of
// government. Wikidata is vandalised for these two fields (India's P35
// returned "Ganesh rajput" on 2026-08-02) so they must never render live.
// Every other Wikidata fact is fine to show live with an "as of" line.
//
// This is necessarily a small, hand-curated list, not a full 195-country
// table: these facts change on elections and cabinet reshuffles, so a wrong
// or stale entry is worse than no entry. Only add a country here once you
// (a human, or an agent with live web access) have actually verified the
// name against a current source — do not guess or extrapolate. An ISO3 with
// no entry renders nothing for these two fields; that is the correct,
// designed-for empty state, not a bug.
//
// Populated 2026-08-02 for the G20 plus a couple of others, verified via
// live web search that day (see docs/superpowers/research — the process
// this file's initial entries came from). Re-verify before relying on this
// for anything beyond the Atlas demo, and re-check periodically: several of
// these (France, Japan, South Korea, Canada, Germany) have changed more
// than once in the last two years.
import type { CountryOverrides } from "./types";

export const OVERRIDES: Readonly<Record<string, CountryOverrides>> = {
  ARG: { headOfState: "Javier Milei", headOfGovernment: "Javier Milei" },
  AUS: { headOfState: "King Charles III", headOfGovernment: "Anthony Albanese" },
  BRA: { headOfState: "Luiz Inácio Lula da Silva", headOfGovernment: "Luiz Inácio Lula da Silva" },
  CAN: { headOfState: "King Charles III", headOfGovernment: "Mark Carney" },
  CHN: { headOfState: "Xi Jinping", headOfGovernment: "Li Qiang" },
  DEU: { headOfState: "Frank-Walter Steinmeier", headOfGovernment: "Friedrich Merz" },
  FRA: { headOfState: "Emmanuel Macron", headOfGovernment: "Sébastien Lecornu" },
  GBR: { headOfState: "King Charles III", headOfGovernment: "Keir Starmer" },
  IDN: { headOfState: "Prabowo Subianto", headOfGovernment: "Prabowo Subianto" },
  IND: { headOfState: "Droupadi Murmu", headOfGovernment: "Narendra Modi" },
  ITA: { headOfState: "Sergio Mattarella", headOfGovernment: "Giorgia Meloni" },
  JPN: { headOfState: "Emperor Naruhito", headOfGovernment: "Sanae Takaichi" },
  KOR: { headOfState: "Lee Jae-myung", headOfGovernment: "Lee Jae-myung" },
  MEX: { headOfState: "Claudia Sheinbaum", headOfGovernment: "Claudia Sheinbaum" },
  RUS: { headOfState: "Vladimir Putin", headOfGovernment: "Mikhail Mishustin" },
  SAU: { headOfState: "King Salman bin Abdulaziz Al Saud", headOfGovernment: "Mohammed bin Salman" },
  ZAF: { headOfState: "Cyril Ramaphosa", headOfGovernment: "Cyril Ramaphosa" },
  TUR: { headOfState: "Recep Tayyip Erdoğan", headOfGovernment: "Recep Tayyip Erdoğan" },
  USA: { headOfState: "Donald Trump", headOfGovernment: "Donald Trump" },
};

/** Corrections for one country, or an empty object if none exist yet — the
 * designed-for "nothing to show" case, not an error. */
export function getOverrides(iso3: string): CountryOverrides {
  return OVERRIDES[iso3] ?? {};
}
