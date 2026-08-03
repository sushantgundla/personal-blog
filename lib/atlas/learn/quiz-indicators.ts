// Which of the ~150 measures in the deck actually make a good question, and
// how a measure reads to a human once it is in one.
//
// ------------------------------------------------------------------ why
// `lib/atlas/indicators.ts` is a *dossier* catalogue. Every entry in it earns
// its place there by being a true, sourced fact about a country. That is a
// much lower bar than being a good quiz question, and the difference is the
// whole reason this file exists.
//
// "Real interest rate" (FR.INR.RINR) is a perfectly good dossier line and a
// terrible quiz question: almost nobody has an intuition for whether Ghana's
// real interest rate should be 4% or 14%, so the player is not reasoning, they
// are guessing, and a wrong answer teaches them nothing they can carry to the
// next question. The same goes for "Terms of trade" (an index with no units a
// reader can picture), "Exchange rate" (a number that says more about how a
// currency was denominated at independence than about the country), and
// "GDP deflator inflation" (which is the same idea as the inflation line right
// above it, phrased for economists).
//
// What is left after that cut is the set of measures where a curious person
// has *some* prior — population, life expectancy, forest cover, people online,
// carbon per person — so that being wrong is informative rather than arbitrary.
// Those are PRIMARY_CODES below.
//
// The rest of the deck is not thrown away. `pickIndicator` draws from
// PRIMARY_CODES about three times in four and from everything else the other
// quarter, so a long session still turns up "Container port traffic" now and
// then. All-primary would get repetitive within two runs; all-deck would be
// unanswerable. Three in four is the compromise.
//
// One deliberate omission: where the catalogue has several codes sharing one
// label — "Military spending" appears three times (% of GDP, US$, % of
// government spending), "Education spending" twice — only one of each is
// primary. Two options reading "Military spending" in the same forgery card
// would look like a bug even though both figures are true.
import type { Deck, DeckCountry, DeckIndicator, DeckValue } from "./types";
import type { Rng } from "./rng";
import { formatValue } from "../format";

/**
 * The measures a non-specialist can reason about. Codes are copied from
 * lib/atlas/indicators.ts and must exist there; anything that fails the
 * deck's >= 30-reporting-countries bar simply never appears, because
 * `pickIndicator` only ever selects from indicators the deck actually kept.
 */
export const PRIMARY_CODES: readonly string[] = [
  // MONEY — the size of an economy and how it is shared out. Growth and
  // inflation are in because everyone has heard of them; debt, savings and
  // investment ratios are out because their "normal" range is not common
  // knowledge.
  "NY.GDP.MKTP.CD", // GDP
  "NY.GDP.PCAP.CD", // GDP per person
  "NY.GDP.MKTP.KD.ZG", // GDP growth
  "FP.CPI.TOTL.ZG", // Inflation
  "SI.POV.GINI", // Income inequality (Gini)
  "SI.POV.DDAY", // People below the poverty line

  // TRADE — shares of GDP are intuitive (Singapore trades a lot, the US
  // trades relatively little); absolute goods exported anchors the big ones.
  "NE.EXP.GNFS.ZS", // Exports, % of GDP
  "NE.IMP.GNFS.ZS", // Imports, % of GDP
  "TX.VAL.MRCH.CD.WT", // Goods exported

  // PEOPLE — the most guessable section in the whole catalogue.
  "SP.POP.TOTL", // Population
  "SP.POP.GROW", // Population growth
  "EN.POP.DNST", // Population density
  "SP.URB.TOTL.IN.ZS", // People living in cities
  "SP.POP.0014.TO.ZS", // Population aged 0-14
  "SP.POP.65UP.TO.ZS", // Population aged 65+
  "SP.DYN.TFRT.IN", // Births per woman
  "SM.POP.TOTL.ZS", // Migrants living in the country

  // HEALTH — lags 3-5 years, which is exactly why every question prints its
  // year. Included anyway: these are the numbers people most want to know.
  "SP.DYN.LE00.IN", // Life expectancy
  "SP.DYN.IMRT.IN", // Infant deaths
  "SH.XPD.CHEX.GD.ZS", // Health spending, % of GDP
  "SH.MED.PHYS.ZS", // Physicians
  "SH.H2O.BASW.ZS", // Access to clean drinking water
  "SH.STA.BASS.ZS", // Access to basic sanitation
  "SN.ITK.DEFC.ZS", // Undernourishment
  "SH.IMM.MEAS", // Children vaccinated against measles

  // LEARNING — literacy and enrolment. "Years of compulsory education" is
  // left out: it is a legal fact, not a measurement, and it clusters on 9-12.
  "SE.XPD.TOTL.GD.ZS", // Education spending, % of GDP
  "SE.ADT.LITR.ZS", // Adult literacy
  "SE.TER.ENRR", // University enrolment
  "SE.PRM.ENRL.TC.ZS", // Pupils per teacher, primary school

  // WORK — unemployment and the shape of the workforce.
  "SL.UEM.TOTL.ZS", // Unemployment
  "SL.UEM.1524.ZS", // Youth unemployment
  "SL.AGR.EMPL.ZS", // Working in agriculture
  "SL.SRV.EMPL.ZS", // Working in services

  // CONNECTED — infrastructure a reader can picture.
  "IT.NET.USER.ZS", // People online
  "IT.CEL.SETS.P2", // Mobile phone subscriptions
  "EG.ELC.ACCS.ZS", // Access to electricity
  "ST.INT.ARVL", // Tourists arriving

  // LAND
  "AG.LND.FRST.ZS", // Land covered by forest
  "AG.LND.AGRI.ZS", // Agricultural land
  "AG.SRF.TOTL.K2", // Land area

  // NATURE
  "EN.GHG.CO2.PC.CE.AR5", // Carbon emissions per person
  "ER.LND.PTLD.ZS", // Protected land
  "EG.FEC.RNEW.ZS", // Renewable energy use
  "EG.ELC.RNEW.ZS", // Electricity from renewables

  // STATE — one military line (of the three that share the label) and one
  // crime line.
  "MS.MIL.XPND.GD.ZS", // Military spending, % of GDP
  "VC.IHR.PSRC.P5", // Homicides
];

const PRIMARY_SET: Readonly<Record<string, true>> = Object.freeze(
  PRIMARY_CODES.reduce<Record<string, true>>((acc, code) => {
    acc[code] = true;
    return acc;
  }, {})
);

/** True if this measure is one of the hand-picked, guessable ones. */
export function isPrimary(code: string): boolean {
  return PRIMARY_SET[code] === true;
}

/** How often `pickIndicator` reaches for a primary measure rather than the rest. */
const PRIMARY_SHARE = 0.75;

/**
 * Draw one measure, weighted towards the guessable ones.
 *
 * `pool` narrows the universe — a forgery generator passes only the measures
 * the chosen country actually reports — and defaults to every indicator the
 * deck kept. Returns `null` rather than throwing when the pool is empty, so a
 * generator can move on to another country instead of failing a whole round.
 */
export function pickIndicator(
  rng: Rng,
  deck: Deck,
  pool?: readonly DeckIndicator[]
): DeckIndicator | null {
  const candidates = pool ?? deck.indicators;
  if (candidates.length === 0) return null;

  const primary = candidates.filter((i) => isPrimary(i.code));
  const rest = candidates.filter((i) => !isPrimary(i.code));

  // If one side is empty the weighting is moot — take whatever there is,
  // rather than returning null and pretending the pool was empty.
  if (primary.length === 0) return rng.pick(rest);
  if (rest.length === 0) return rng.pick(primary);

  return rng.next() < PRIMARY_SHARE ? rng.pick(primary) : rng.pick(rest);
}

/**
 * Cached per deck object. The deck is read once per server process and never
 * mutated, so the filtered list is computed once too — a `WeakMap` rather than
 * a module-level variable so a second deck (a test fixture, say) cannot be
 * served the first one's answer.
 */
const sovereignCache = new WeakMap<Deck, DeckCountry[]>();

/**
 * The only countries any question may be built from: the 193 UN member states
 * plus Vatican City and Palestine.
 *
 * This is a hard filter in all four generators, not a preference, and it is
 * about correctness rather than politics. The deck holds all 250 ISO entries,
 * and among them:
 *
 *   - Bouvet Island's flag **is** Norway's flag. Heard Island and McDonald
 *     Islands' **is** Australia's. United States Minor Outlying Islands' **is**
 *     the USA's. Offer any of those as a distractor and the flag question has
 *     two identical pictures and no correct answer.
 *   - Antarctica has no flag at all.
 *   - Around thirty entries are territories — Tokelau, the Cocos (Keeling)
 *     Islands — that nobody can fairly be asked to name, or to rank by GDP.
 *
 * See scripts/atlas/build-deck.mjs for how `sovereign` is decided.
 */
export function sovereignCountries(deck: Deck): DeckCountry[] {
  const cached = sovereignCache.get(deck);
  if (cached) return cached;
  const list = deck.countries.filter((c) => c.sovereign);
  sovereignCache.set(deck, list);
  return list;
}

/**
 * One country's reading for one measure, or `null` if it has none.
 *
 * `values` is keyed `[indicatorCode][iso3]`, so a missing measure and a
 * missing country look the same from here — both are simply absent, and §6 is
 * explicit that a missing value is never a question. No zero stands in for it.
 */
export function deckValue(deck: Deck, code: string, iso3: string): DeckValue | null {
  const byCountry = deck.values[code];
  if (!byCountry) return null;
  return byCountry[iso3] ?? null;
}

/** Every measure this country actually reports. The pool a forgery draws from. */
export function indicatorsForCountry(deck: Deck, iso3: string): DeckIndicator[] {
  return deck.indicators.filter((i) => deckValue(deck, i.code, iso3) !== null);
}

/**
 * Units that are already spelled out by the label, or that mean nothing on
 * their own. "Patent applications by residents — 61,616 count" is worse than
 * "Patent applications by residents — 61,616"; a Gini of "35 0-100" is
 * nonsense.
 */
const BARE_UNITS: Readonly<Record<string, true>> = Object.freeze({
  count: true,
  index: true,
  "0-100": true,
});

/**
 * Decimal places for a plain number, chosen by magnitude.
 *
 * `formatValue(v, 'number')` defaults to zero decimals, which is right for a
 * population and wrong for "Births per woman": 2.0 and 2.3 would both print
 * as "2", and higher-or-lower would ship a question whose two options look
 * identical on screen. Anything at or above a million is left alone so
 * formatValue's own T/B/M compaction handles it.
 */
function decimalsForNumber(value: number): number | undefined {
  const abs = Math.abs(value);
  if (abs >= 1e6) return undefined;
  if (abs >= 100) return 0;
  if (abs >= 10) return 1;
  return 2;
}

/**
 * One measurement, written the way it appears on a card:
 * `"31.2% of land area"`, `"1.42B people"`, `"$3.55T"`, `"72.4 yrs"`,
 * `"3.2 per 1,000 live births"`.
 *
 * Every number goes through `formatValue` from lib/atlas/format.ts — the same
 * function the dossier uses — so a figure on a quiz card and the same figure
 * on `/atlas/ind` are formatted by one implementation and can never disagree.
 * All this adds is the unit tail, which formatValue deliberately does not know
 * about ("%" it can do; "% of land area" is catalogue knowledge).
 */
export function formatMeasure(indicator: DeckIndicator, value: number): string {
  const { format, unit } = indicator;
  switch (format) {
    case "percent": {
      const n = formatValue(value, "percent");
      // Units here read "% of land area", "% per year", "% aged 15+".
      // formatValue already printed the "%", so append the rest of the phrase.
      return unit.startsWith("%") ? `${n}${unit.slice(1)}` : n;
    }
    case "currency":
      // "current US$" / "current int'l $" are provenance, not a unit a reader
      // needs on the face of the card; formatValue's "$" prefix carries it.
      return formatValue(value, "currency");
    case "years":
      return formatValue(value, "years");
    case "per1000":
      // formatValue's own " /1,000" suffix is too terse here — the catalogue
      // distinguishes "per 1,000 people" from "per 1,000 live births", and
      // that difference matters on a question.
      return `${formatValue(value, "number", { compact: false, decimals: 1 })} ${unit}`;
    case "number":
    default: {
      const n = formatValue(value, "number", { decimals: decimalsForNumber(value) });
      return BARE_UNITS[unit] === true ? n : `${n} ${unit}`;
    }
  }
}

/**
 * The size of the smallest change `formatMeasure` can actually show for a
 * value of this magnitude — the "last printed digit".
 *
 * This exists because a rule about numbers is only meaningful if the numbers
 * survive being printed. The Isle of Man's population growth is -0.0499% per
 * year; a forgery of -0.0724% is a legitimate 45% away from the truth and
 * obeys every rule in §6, and then the card prints "-0.1% per year" beside a
 * real figure of "-0.0% per year" and asks a human to spot the fake. Nobody
 * can. The generator uses this to refuse to build on a value that small in the
 * first place, and scripts/atlas/learn-selfcheck.mjs uses the same idea in
 * reverse to read a printed figure back with a known error bound.
 */
export function printResolution(indicator: DeckIndicator, value: number): number {
  const abs = Math.abs(value);
  switch (indicator.format) {
    case "percent":
    case "years":
    case "per1000":
      // Always one decimal place, never compacted.
      return 0.1;
    case "currency":
    case "number":
    default: {
      // Mirrors formatValue's compaction thresholds and decimal defaults, and
      // decimalsForNumber above.
      if (abs >= 1e12) return 1e10; // "3.55T" — two decimals of a trillion
      if (abs >= 1e9) return 1e7; //   "1.43B"
      if (abs >= 1e6) return 1e5; //   "142.5M" — one decimal of a million
      if (indicator.format === "currency") return 1; // no decimals below a million
      if (abs >= 100) return 1;
      if (abs >= 10) return 0.1;
      return 0.01;
    }
  }
}

/** The dossier this fact is drawn from: `"IND"` -> `"/atlas/ind"`. */
export function dossierHref(iso3: string): string {
  return `/atlas/${iso3.toLowerCase()}`;
}
