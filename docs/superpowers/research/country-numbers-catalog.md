# Country Numbers Catalog — World Bank + REST Countries

Research for the country explorer page. Everything here was checked with `curl` / Python on
**2026-08-02** unless the row says ASSUMED.

## Read this first — two findings that change the plan

1. **REST Countries v3.1 is dead.** So are v1, v2 and v4. Every request to
   `https://restcountries.com/v3.1/...` returns HTTP 200 with
   `{"success": false, "data": null, "errors": [{"message": "This API version has been deprecated..."}]}`.
   The replacement is **v5 at a new host** — `https://api.restcountries.com/countries/v5` — and it
   **requires an API key** sent as `Authorization: Bearer <key>`. There is a free plan, but you
   must sign up at `https://restcountries.com/sign-up`. TESTED.

2. **World Bank multi-indicator batching works, and `source=2` is required.** Up to ~40
   indicators in one call, one country, one round trip. This is the whole architecture. TESTED.

---

## 1. Batching — the answer

**Yes, the multi-indicator form works.** Exact URL tested:

```
https://api.worldbank.org/v2/country/IND/indicator/SP.POP.TOTL;NY.GDP.MKTP.CD?source=2&format=json
```

| Question | Answer | Evidence |
|---|---|---|
| Does `;` batching work? | **Yes** | TESTED — returned rows for both indicators |
| Is `source=2` required? | **Yes, mandatory** | TESTED — dropping it returns `{"message":[{"id":"120","key":"Invalid value"}]}` |
| Max indicators per request | **~40 safe. 60 is rejected.** | TESTED — 20, 30 and 40 all returned every indicator; 60 returned `id: 120, Invalid value` |
| Recommended batch size | **25** | Judgement call, see "flakiness" below |

`source=2` is the World Development Indicators database. Every indicator in this document lives
in source 2, so one `source=2` is enough for the whole page. Mixing in an indicator from another
source (e.g. `source=57` for WDI Archives) in the same call will not work.

### Getting only the latest value

Add `mrnev=1` — "most recent non-empty value". Without it you get every year back to 1960.

```
.../indicator/SP.POP.TOTL;NY.GDP.MKTP.CD;NY.GDP.PCAP.CD;NY.GDP.MKTP.KD.ZG?source=2&format=json&mrnev=1&per_page=100
```

TESTED — 4 indicators, 881 bytes, `total: 4`, one row each with its own year. This is exactly
what a dossier page wants: each number carries the year it is from, so the UI can show
"GDP $3.96T (2025)" and "Physicians 0.7 per 1,000 (2022)" honestly.

**`mrnev=1` does NOT work with `country/all`.** That combination returns HTTP 400 every time.
TESTED. Use `mrv=1` or `date=YYYY` instead — see section 4.

### Three gotchas you will hit

- **UTF-8 BOM.** Responses start with the bytes `EF BB BF`. Node's `res.json()` handles it, but
  `JSON.parse(await res.text())` throws `Unexpected token`. If you do your own parsing, strip the
  BOM. TESTED — Python's plain `json.load` failed until I used `encoding='utf-8-sig'`.
- **Default `per_page` is 50.** A batch of 30 indicators without `mrnev=1` silently truncates.
  Always set `per_page` explicitly.
- **Random HTTP 400s.** Identical URLs sometimes fail and then succeed on retry. TESTED — a
  10-indicator call failed three times in a row, then a 20- and a 40-indicator call containing
  those same 10 codes both succeeded on their second attempt. This is throttling wearing a
  400 costume, not a bad request. **Build in a retry with backoff.** Do not treat a 400 as a
  permanent "bad indicator code" without retrying.

### Response shape

```json
[
  {"page":1,"pages":1,"per_page":100,"total":4,"sourceid":null,"lastupdated":"2026-07-13"},
  [
    {"indicator":{"id":"SP.POP.TOTL","value":"Population, total"},
     "country":{"id":"IN","value":"India"},
     "countryiso3code":"IND","date":"2025","value":1463865525,
     "obs_status":"","decimal":0}
  ]
]
```

Note `lastupdated: "2026-07-13"` in the metadata header — use it for a "data as of" line on the
page, and as the natural cue for how long to set `revalidate`.

---

## 2. Requests per country page

**5 requests.** With a conservative batch size, 7.

| Call | What | Notes |
|---|---|---|
| 1–4 | World Bank, ~40 indicators each, `mrnev=1` | Covers 160 indicators |
| 5 | REST Countries v5, one country | Flags, capital, borders, currencies, languages, and much more |

At the safer batch size of 25 that becomes 6 World Bank calls + 1 REST Countries = **7**.

They are all independent — fire them with `Promise.all`. Wall-clock cost is one round trip, not
seven, and with ISR it only happens once per `revalidate` window per country.

Suggested Next.js call:

```ts
fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } })  // one week
```

A week is right for World Bank data. It updates a few times a year, not daily — the response
metadata said `lastupdated: 2026-07-13`.

---

## 3. Time series — the year slider

Use `date=1960:2025`. It composes with multi-indicator batching.

```
https://api.worldbank.org/v2/country/IND/indicator/SP.POP.TOTL;NY.GDP.MKTP.CD;SP.DYN.LE00.IN?source=2&format=json&date=1960:2025&per_page=1000
```

TESTED. **3 indicators × 66 years = 198 rows. 40 KB of JSON, 2.4 KB over the wire gzipped.**

That is tiny. Rough scaling: one indicator's full history for one country is about 13 KB of JSON
(~0.8 KB gzipped). Even 20 charted indicators would be ~800 KB JSON / ~50 KB gzipped — fine for
a server component that renders the chart data down to a small array before it reaches the
browser.

**Set `per_page` high.** 66 years × N indicators easily exceeds the 50-row default. Use 1000.

**Practical advice:** don't fetch full history for all 160 indicators. Fetch `mrnev=1` for the
dossier grid, and full history only for the 10–20 indicators you actually draw as charts.

---

## 4. Rankings and choropleth — one indicator, every country

```
https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?source=2&format=json&date=2024&per_page=400
```

TESTED. **265 rows, 58 KB JSON, 7 KB gzipped, `pages: 1`.** One request paints the whole map.
`mrv=1` in place of `date=2024` gives an identical-size response and is safer when a year is
patchy.

- **`per_page` must be raised.** The default 50 gives you 50 countries out of 265. Use 400.
- **`mrnev=1` is forbidden here** — HTTP 400. TESTED. Use `mrv=1` or `date=YYYY`.
- **247 of 265 rows had a real value** for GDP per capita 2024; 18 were `null`. TESTED. Your map
  needs a "no data" fill colour.

### Full history for every country (animated year slider on the map)

```
https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?source=2&format=json&date=1960:2025&per_page=20000
```

TESTED. **17,490 rows, 3.4 MB JSON, 148 KB gzipped, single page.** Workable server-side, but do
not ship the raw payload to the browser — reshape it to `{iso3: [values...]}` first, which cuts
it by roughly 90%.

### The 265 rows are not 265 countries

`https://api.worldbank.org/v2/country?format=json&per_page=400` returns **295 entries: 217 real
countries and 78 aggregates** ("World", "Arab World", "Euro area", "Low income"). TESTED.

**Filter on `region.value !== "Aggregates"`.** Skip this and your GDP leaderboard is topped by
"World", "High income" and "OECD members". Fetch this list once at build time and cache it — it
is also your source of the country picker, the ISO3 codes and the income-group labels.

---

## 5. Rate limits, licensing, staleness

### Rate limits

| Item | Finding |
|---|---|
| World Bank | **No published limit, no API key.** But it throttles. TESTED — rapid sequential requests started returning HTTP 400 and connection failures; spacing calls 3–6 seconds apart fixed it. |
| Handling | Retry with backoff, 3 attempts. Treat 400 as retryable. |
| ISR | Once cached, a country page makes zero live calls until `revalidate` expires. Throttling only bites during a cold build or a cache stampede. |
| REST Countries v5 | Free plan exists; exact request ceiling is behind the signup wall. UNTESTED — the docs have a "Request limits" and a "Rate limiting" section that I could not read without an account. |

### Licensing

- **World Bank** — CC BY 4.0. Free to use commercially. Attribute: "Source: World Bank, World
  Development Indicators." ASSUMED (standard World Bank Open Data terms; not re-verified today).
- **REST Countries v5** — commercial API with paid tiers, so read their Terms of Service and
  "Acceptable use" before shipping. Data sources are ISO and UN. UNTESTED.

### Staleness — which numbers lag

The `date` on each row tells you the truth per country, so **always render the year next to the
number**. Typical lag, from the values actually returned for India:

| Group | Typical latest year | Lag |
|---|---|---|
| Population, GDP, GDP per capita, growth | 2025 | current — TESTED, `SP.POP.TOTL` returned 2025 |
| Trade, inflation, unemployment | 2023–2024 | 1–2 years |
| Health spend, physicians, hospital beds | 2021–2022 | **3–4 years** |
| Education enrolment, literacy | 2020–2023 | **2–5 years**, very uneven |
| CO2 and greenhouse gas | 2022–2023 | 2–3 years |
| Gini / poverty | irregular, survey-driven | **can be 5+ years, or absent** |
| Military spending | 2024 | 1–2 years |

### Countries commonly missing

TESTED against `/v2/country?format=json&per_page=400`:

| Country | In World Bank? |
|---|---|
| Taiwan (TWN) | **No** — absent entirely |
| Western Sahara (ESH) | **No** — absent entirely |
| Vatican City (VAT) | **No** — absent entirely |
| North Korea (PRK) | Yes, listed — but most indicators are `null` |
| Palestine (PSE) | Yes |
| Kosovo (XKX) | Yes — note the non-standard code |
| South Sudan (SSD) | Yes |

Also expect sparse rows for small island states (Tuvalu, Nauru, San Marino, Monaco, Liechtenstein)
— they are listed but many indicators are `null`. ASSUMED, based on the 18 nulls in a
265-row 2024 GDP-per-capita pull.

**Design consequence:** REST Countries v5 covers Taiwan, Western Sahara and Vatican City;
the World Bank does not. Your country picker should come from REST Countries, and the World Bank
numbers should degrade gracefully to "no data" — not 404 the page.

---

# The catalog

Every row's "Coverage" is a judgement about the ~195 countries unless marked TESTED.
"Example (India)" values marked TESTED came back from a live call today.

Legend: **T** = tested (the code returned a real value for India today). **A** = assumed (a real
World Bank code I am confident in, but not individually verified in this session).

## Economy

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| GDP | `NY.GDP.MKTP.CD` | current US$ | 3,956,067,115,771 (2025) **T** | ~all | Headline number |
| GDP, PPP | `NY.GDP.MKTP.PP.CD` | current int'l $ | **T** | high | Better for comparisons |
| GDP per capita | `NY.GDP.PCAP.CD` | current US$ | ~2,700 (2025) **T** | ~all | |
| GDP per capita, PPP | `NY.GDP.PCAP.PP.CD` | current int'l $ | **T** | high | The fairer per-head figure |
| GDP growth | `NY.GDP.MKTP.KD.ZG` | % per year | **T** | ~all | Real, inflation-adjusted |
| GDP per capita growth | `NY.GDP.PCAP.KD.ZG` | % per year | **T** | ~all | |
| GNI | `NY.GNP.MKTP.CD` | current US$ | **T** | high | |
| GNI per capita | `NY.GNP.PCAP.CD` | current US$ | **T** | ~all | Atlas method; sets income group |
| GNI per capita, PPP | `NY.GNP.PCAP.PP.CD` | current int'l $ | **T** | high | |
| Inflation | `FP.CPI.TOTL.ZG` | % per year | **T** | high | Consumer prices |
| GDP deflator inflation | `NY.GDP.DEFL.KD.ZG` | % per year | **T** | high | Broader than CPI |
| Real interest rate | `FR.INR.RINR` | % | **T** | medium | Missing in many countries |
| Lending interest rate | `FR.INR.LEND` | % | **T** | medium | |
| Government debt | `GC.DOD.TOTL.GD.ZS` | % of GDP | **T** | **low–medium** | Central govt only; patchy |
| Government revenue | `GC.REV.XGRT.GD.ZS` | % of GDP | **T** | medium | |
| Government expense | `GC.XPN.TOTL.GD.ZS` | % of GDP | **T** | medium | |
| Govt consumption | `NE.CON.GOVT.ZS` | % of GDP | **T** | high | |
| Household consumption | `NE.CON.PRVT.ZS` | % of GDP | **T** | high | |
| Gross capital formation | `NE.GDI.TOTL.ZS` | % of GDP | **T** | high | Investment rate |
| Gross fixed capital formation | `NE.GDI.FTOT.ZS` | % of GDP | **T** | high | |
| Gross savings | `NY.GNS.ICTR.ZS` | % of GDP | **T** | high | |
| FDI net inflows | `BX.KLT.DINV.CD.WD` | current US$ | **T** | high | Volatile year to year |
| FDI inflows | `BX.KLT.DINV.WD.GD.ZS` | % of GDP | **T** | high | Better for comparison |
| FDI outflows | `BM.KLT.DINV.WD.GD.ZS` | % of GDP | **T** | medium | |
| Current account balance | `BN.CAB.XOKA.GD.ZS` | % of GDP | **T** | high | Negative = deficit |
| Reserves | `FI.RES.TOTL.CD` | current US$ | **T** | high | Includes gold |
| External debt stock | `DT.DOD.DECT.CD` | current US$ | **T** | **low-income only** | Not reported for rich countries |
| Gini index | `SI.POV.GINI` | 0–100 | **T** | **low, irregular** | Survey-driven; long gaps |
| Poverty headcount $2.15/day | `SI.POV.DDAY` | % of population | **T** | low, irregular | |
| Income share, top 10% | `SI.DST.10TH.10` | % | — **A** | low | |
| Income share, bottom 10% | `SI.DST.FRST.10` | % | — **A** | low | |
| Market cap of listed firms | `CM.MKT.LCAP.GD.ZS` | % of GDP | — **A** | medium | Only where there's an exchange |
| Personal remittances received | `BX.TRF.PWKR.CD.DT` | current US$ | — **A** | high | Big for India, Philippines, Mexico |
| Net ODA received | `DT.ODA.ODAT.GN.ZS` | % of GNI | — **A** | recipients only | |
| Exchange rate | `PA.NUS.FCRF` | local currency per US$ | — **A** | high | Period average |

## Sectors

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Agriculture value added | `NV.AGR.TOTL.ZS` | % of GDP | **T** | high | |
| Industry value added | `NV.IND.TOTL.ZS` | % of GDP | **T** | high | Includes construction |
| Manufacturing value added | `NV.IND.MANF.ZS` | % of GDP | — **A** | high | |
| Services value added | `NV.SRV.TOTL.ZS` | % of GDP | **T** | high | |

These four make a natural stacked bar. They will not sum to exactly 100 — taxes less subsidies
are excluded. Say so, or normalise.

## Trade

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Exports of goods & services | `NE.EXP.GNFS.ZS` | % of GDP | **T** | ~all | |
| Imports of goods & services | `NE.IMP.GNFS.ZS` | % of GDP | **T** | ~all | |
| Trade balance | `NE.RSB.GNFS.ZS` | % of GDP | — **A** | high | |
| Total trade | `TG.VAL.TOTL.GD.ZS` | % of GDP | — **A** | high | Openness measure |
| Merchandise exports | `TX.VAL.MRCH.CD.WT` | current US$ | — **A** | high | Goods only |
| Merchandise imports | `TM.VAL.MRCH.CD.WT` | current US$ | — **A** | high | Goods only |
| Service exports | `BX.GSR.NFSV.CD` | current US$ | — **A** | high | India's strength |
| Service imports | `BM.GSR.NFSV.CD` | current US$ | — **A** | high | |
| Exports of goods & services | `BX.GSR.GNFS.CD` | current US$ | — **A** | high | Dollar version |
| Imports of goods & services | `BM.GSR.GNFS.CD` | current US$ | — **A** | high | |
| High-tech exports | `TX.VAL.TECH.MF.ZS` | % of manuf. exports | — **A** | medium | |
| Terms of trade | `TT.PRI.MRCH.XD.WD` | index | — **A** | medium | |

## People

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Population | `SP.POP.TOTL` | people | 1,463,865,525 (2025) **T** | ~all | Most current indicator |
| Population growth | `SP.POP.GROW` | % per year | **T** | ~all | |
| Population density | `EN.POP.DNST` | people per km² | **T** | ~all | |
| Urban population | `SP.URB.TOTL.IN.ZS` | % of total | **T** | ~all | |
| Urban population growth | `SP.URB.GROW` | % per year | — **A** | high | |
| Rural population | `SP.RUR.TOTL.ZS` | % of total | — **A** | high | |
| Population aged 0–14 | `SP.POP.0014.TO.ZS` | % of total | — **A** | ~all | Age pyramid |
| Population aged 15–64 | `SP.POP.1564.TO.ZS` | % of total | — **A** | ~all | Age pyramid |
| Population aged 65+ | `SP.POP.65UP.TO.ZS` | % of total | — **A** | ~all | Age pyramid |
| Age dependency ratio | `SP.POP.DPND` | % of working-age | — **A** | ~all | |
| Female population | `SP.POP.TOTL.FE.ZS` | % of total | — **A** | ~all | |
| Fertility rate | `SP.DYN.TFRT.IN` | births per woman | **T** | ~all | 2.1 = replacement |
| Birth rate | `SP.DYN.CBRT.IN` | per 1,000 people | — **A** | ~all | |
| Death rate | `SP.DYN.CDRT.IN` | per 1,000 people | — **A** | ~all | |
| Net migration | `SM.POP.NETM` | people, 5-yr totals | — **A** | high | **Reported every 5 years, not annually** |
| International migrant stock | `SM.POP.TOTL.ZS` | % of population | — **A** | high | Also 5-yearly |

## Health

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Life expectancy | `SP.DYN.LE00.IN` | years | **T** | ~all | |
| Life expectancy, female | `SP.DYN.LE00.FE.IN` | years | — **A** | ~all | Pairs well with male |
| Life expectancy, male | `SP.DYN.LE00.MA.IN` | years | — **A** | ~all | |
| Infant mortality | `SP.DYN.IMRT.IN` | per 1,000 live births | **T** | ~all | |
| Under-5 mortality | `SH.DYN.MORT` | per 1,000 live births | — **A** | ~all | |
| Maternal mortality | `SH.STA.MMRT` | per 100,000 live births | — **A** | high | Lags ~3 years |
| Health spending | `SH.XPD.CHEX.GD.ZS` | % of GDP | **T** | high | **Lags ~3–4 years** |
| Health spending per capita | `SH.XPD.CHEX.PC.CD` | current US$ | — **A** | high | Same lag |
| Physicians | `SH.MED.PHYS.ZS` | per 1,000 people | **T** | medium | Irregular reporting |
| Nurses & midwives | `SH.MED.NUMW.P3` | per 1,000 people | — **A** | medium | |
| Hospital beds | `SH.MED.BEDS.ZS` | per 1,000 people | — **A** | **low, stale** | Often 2015 or older |
| Basic drinking water | `SH.H2O.BASW.ZS` | % of population | — **A** | high | |
| Basic sanitation | `SH.STA.BASS.ZS` | % of population | — **A** | high | |
| Suicide rate | `SH.STA.SUIC.P5` | per 100,000 | — **A** | medium | Handle with care in UI |
| Smoking prevalence | `SH.PRV.SMOK` | % of adults | — **A** | medium | |
| HIV prevalence | `SH.DYN.AIDS.ZS` | % aged 15–49 | — **A** | medium | |
| Tuberculosis incidence | `SH.TBS.INCD` | per 100,000 | — **A** | high | |
| Undernourishment | `SN.ITK.DEFC.ZS` | % of population | — **A** | high | |
| Obesity | `SH.STA.OWAD.ZS` | % of adults | — **A** | medium | |
| Measles immunisation | `SH.IMM.MEAS` | % of children 12–23m | — **A** | high | |

## Education

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Education spending | `SE.XPD.TOTL.GD.ZS` | % of GDP | **T** | medium | **Patchy and stale** |
| Education spending | `SE.XPD.TOTL.GB.ZS` | % of govt spending | — **A** | medium | |
| Adult literacy | `SE.ADT.LITR.ZS` | % aged 15+ | **T** | **low, very stale** | Some values 10+ years old |
| Youth literacy | `SE.ADT.1524.LT.ZS` | % aged 15–24 | — **A** | low | |
| Primary enrolment | `SE.PRM.ENRR` | % gross | **T** | high | Gross ratios can exceed 100 |
| Secondary enrolment | `SE.SEC.ENRR` | % gross | — **A** | high | |
| Tertiary enrolment | `SE.TER.ENRR` | % gross | **T** | high | |
| Primary completion | `SE.PRM.CMPT.ZS` | % of relevant age | — **A** | high | |
| Pupil–teacher ratio, primary | `SE.PRM.ENRL.TC.ZS` | pupils per teacher | — **A** | medium | |
| Compulsory education | `SE.COM.DURS` | years | — **A** | high | Nearly static |

Gross enrolment above 100% is normal — it counts pupils outside the official age band. Don't cap
the bar at 100 or it will look like a bug.

## Work

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Unemployment | `SL.UEM.TOTL.ZS` | % of labour force | **T** | high | ILO modelled estimate |
| Youth unemployment | `SL.UEM.1524.ZS` | % of labour force 15–24 | — **A** | high | |
| Labour force participation | `SL.TLF.CACT.ZS` | % aged 15+ | — **A** | high | ILO modelled |
| Female participation | `SL.TLF.CACT.FE.ZS` | % of females 15+ | **T** | high | Striking country spread |
| Male participation | `SL.TLF.CACT.MA.ZS` | % of males 15+ | — **A** | high | |
| Labour force | `SL.TLF.TOTL.IN` | people | — **A** | high | |
| Employment in agriculture | `SL.AGR.EMPL.ZS` | % of employment | — **A** | high | |
| Employment in industry | `SL.IND.EMPL.ZS` | % of employment | — **A** | high | |
| Employment in services | `SL.SRV.EMPL.ZS` | % of employment | — **A** | high | |
| Self-employed | `SL.EMP.SELF.ZS` | % of employment | — **A** | high | |
| Labour force with advanced education | `SL.TLF.ADVN.ZS` | % of labour force | — **A** | medium | |
| Employment-to-population ratio | `SL.EMP.TOTL.SP.ZS` | % aged 15+ | — **A** | high | |

Most labour numbers are **ILO modelled estimates**, not national surveys. Say so in a footnote —
they will not match a country's own published unemployment rate.

## Infrastructure and tech

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Internet users | `IT.NET.USER.ZS` | % of population | **T** | high | |
| Mobile subscriptions | `IT.CEL.SETS.P2` | per 100 people | **T** | ~all | Routinely exceeds 100 |
| Fixed broadband | `IT.NET.BBND.P2` | per 100 people | — **A** | high | |
| Fixed telephone lines | `IT.MLT.MAIN.P2` | per 100 people | — **A** | high | Declining everywhere |
| Access to electricity | `EG.ELC.ACCS.ZS` | % of population | **T** | high | |
| Clean cooking fuel access | `EG.CFT.ACCS.ZS` | % of population | — **A** | high | |
| Electric power consumption | `EG.USE.ELEC.KH.PC` | kWh per capita | — **A** | **discontinued ~2014** | Old but widely cited |
| Energy use | `EG.USE.PCAP.KG.OE` | kg oil equiv. per capita | — **A** | discontinued ~2015 | |
| Air passengers | `IS.AIR.PSGR` | passengers carried | **T** | high | Registered carriers only |
| Air freight | `IS.AIR.GOOD.MT.K1` | million tonne-km | — **A** | high | |
| Rail lines | `IS.RRS.TOTL.KM` | route-km | — **A** | **medium, stale** | |
| Rail passengers | `IS.RRS.PASG.KM` | million passenger-km | — **A** | medium, stale | |
| Container port traffic | `IS.SHP.GOOD.TU` | TEU | — **A** | coastal only | |
| R&D spending | `GB.XPD.RSDV.GD.ZS` | % of GDP | — **A** | medium | |
| Patent applications, residents | `IP.PAT.RESD` | count | — **A** | medium | |
| Scientific articles | `IP.JRN.ARTC.SC` | count | — **A** | high | |
| International tourist arrivals | `ST.INT.ARVL` | count | — **A** | medium | **2020–21 collapse; explain it** |
| Tourism receipts | `ST.INT.RCPT.CD` | current US$ | — **A** | medium | |

## Environment

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| CO2 per capita | `EN.GHG.CO2.PC.CE.AR5` | tonnes per person | **T** | high | **New AR5 code — the old `EN.ATM.CO2E.PC` is retired** |
| CO2 total | `EN.GHG.CO2.MT.CE.AR5` | Mt CO2 | — **A** | high | |
| Total greenhouse gases | `EN.GHG.TOTL.MT.CE.AR5` | Mt CO2-equiv | — **A** | high | |
| Forest area | `AG.LND.FRST.ZS` | % of land area | **T** | ~all | |
| Forest area | `AG.LND.FRST.K2` | km² | — **A** | ~all | |
| Agricultural land | `AG.LND.AGRI.ZS` | % of land area | — **A** | ~all | |
| Arable land | `AG.LND.ARBL.ZS` | % of land area | — **A** | ~all | |
| Surface area | `AG.SRF.TOTL.K2` | km² | — **A** | ~all | Cross-check vs REST Countries |
| Protected land | `ER.LND.PTLD.ZS` | % of land area | **T** | high | |
| Protected marine areas | `ER.MRN.PTMR.ZS` | % of territorial waters | — **A** | coastal only | |
| Freshwater withdrawal | `ER.H2O.FWTL.ZS` | % of internal resources | — **A** | medium | |
| Renewable water per capita | `ER.H2O.INTR.PC` | m³ per person | — **A** | high | |
| Renewable energy consumption | `EG.FEC.RNEW.ZS` | % of final energy | **T** | high | |
| Renewable electricity output | `EG.ELC.RNEW.ZS` | % of total | — **A** | high | |
| Electricity from fossil fuels | `EG.ELC.FOSL.ZS` | % of total | — **A** | high | |
| Electricity from nuclear | `EG.ELC.NUCL.ZS` | % of total | — **A** | ~30 countries | Zero or null for most |
| Energy imports | `EG.IMP.CONS.ZS` | % of energy use | — **A** | medium | Negative = net exporter |

**Do not use `EN.ATM.CO2E.PC`.** The World Bank retired the old CDIAC series and replaced it with
the AR5 family shown above. TESTED — `EN.GHG.CO2.PC.CE.AR5` returns data.

## Government and military

| Field | Indicator code | Units | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Military spending | `MS.MIL.XPND.GD.ZS` | % of GDP | **T** | high | SIPRI data |
| Military spending | `MS.MIL.XPND.CD` | current US$ | — **A** | high | |
| Military spending | `MS.MIL.XPND.ZS` | % of govt spending | — **A** | medium | |
| Armed forces personnel | `MS.MIL.TOTL.P1` | people | **T** | high | |
| Armed forces | `MS.MIL.TOTL.TF.ZS` | % of labour force | — **A** | high | |
| Tax revenue | `GC.TAX.TOTL.GD.ZS` | % of GDP | **T** | **low–medium** | Central govt only |
| Total tax rate on business | `IC.TAX.TOTL.CP.ZS` | % of profit | — **A** | medium | Doing Business, **discontinued 2019** |
| Ease of doing business | `IC.BUS.EASE.XQ` | rank | — **A** | **discontinued 2020** | Report was withdrawn |
| Legal rights index | `IC.LGL.CRED.XQ` | 0–12 | — **A** | discontinued 2019 | |
| Intentional homicides | `VC.IHR.PSRC.P5` | per 100,000 | — **A** | medium | Irregular |

The Doing Business indicators were **discontinued after the 2020 data-manipulation scandal**. The
codes still resolve and return old values. If you show them, label the year loudly or leave them
out.

---

# REST Countries v5

**Base URL:** `https://api.restcountries.com/countries/v5`
**Auth:** `Authorization: Bearer <key>` on every request. Sign up at
`https://restcountries.com/sign-up`.
**Demo key:** `rc_live_demo` — works without an account but **always returns Canada**, plus a
`data._demo` notice. Good for shaping code, useless for real data. TESTED.

Response shape is JSON:API-flavoured: `{"data": {"objects": [ ... ]}}`. Note the nesting — this is
**not** the bare array v3.1 returned, so existing code needs a mapping pass.

### Fetch one country

```
GET /countries/v5/codes.alpha_3/IND
```
TESTED (with the demo key, returned a valid 21 KB record).

### Trim the payload

`response_fields` (allowlist) and `response_fields_omit` (blocklist), both comma-separated
dot-paths. Omit wins on conflict.

```
GET /countries/v5/codes.alpha_3/IND?response_fields_omit=names.translations,leaders
```

**Use this.** The full record is ~21 KB, and `names.translations` (26 languages) plus `leaders`
(with nested image renditions) are most of it.

### Pagination

`limit` (default 25, **max 100 on the free plan**, 500 paid) and `offset`. Building a full
country picker needs **3 requests** at `limit=100`. Cache the result — this data barely changes.

### Field reference

Verified against a live v5 record. Every path below was present in the response. TESTED.

| Field | JSON path | Units / type | Example (Canada, from live demo) | Coverage | Notes |
|---|---|---|---|---|---|
| Common name | `names.common` | string | `"Canada"` | all | |
| Official name | `names.official` | string | `"Canada"` | all | |
| Native names | `names.native.{iso639_3}.{common,official}` | object | `native.fra.common = "Canada"` | all | Keyed by language |
| Translations | `names.translations.{lang}.{common,official}` | object | 26 languages | all | **Heavy — omit it** |
| Alternate names | `names.alternates` | array | `[]` | all | |
| ISO alpha-2 | `codes.alpha_2` | string | `"CA"` | all | |
| ISO alpha-3 | `codes.alpha_3` | string | `"CAN"` | all | **Join key to World Bank** |
| ISO numeric | `codes.ccn3` | string | `"124"` | all | |
| Olympic code | `codes.cioc` | string | `"CAN"` | most | |
| FIFA code | `codes.fifa` | string | `"CAN"` | most | |
| FIPS code | `codes.fips` | string | `"CA"` | most | |
| GEC code | `codes.gec` | string | `"CA"` | most | |
| Capital(s) | `capitals[]` | array of objects | with `attributes` flags | ~all | Handles multi-capital countries properly |
| Flag PNG | `flag.url_png` | URL | `https://flags.restcountries.com/v5/w640/ca.png` | all | |
| Flag SVG | `flag.url_svg` | URL | `.../svg/ca.svg` | all | Prefer SVG |
| Flag emoji | `flag.emoji` | string | 🇨🇦 | all | |
| Flag unicode | `flag.unicode` | string | `"U+1F1E8 U+1F1E6"` | all | |
| Flag HTML entity | `flag.html_entity` | string | `"&#127464;&#127462;"` | all | |
| Flag description | `flag.description` | string | long prose | all | Nice for a caption |
| **Flag colours** | `flag.colors.palette[]` | `{hex, proportion}` | `#fcfaf5` at 0.359 | all | **Use this to theme the page per country** |
| Dominant flag colour | `flag.colors.dominant` | hex | `"#fcfaf5"` | all | Largest area |
| Prominent flag colour | `flag.colors.prominent` | hex | `"#ff181b"` | all | Most eye-catching |
| Colour swatches | `flag.colors.swatches.{vibrant,muted,dark_vibrant,dark_muted,light_vibrant,light_muted}` | hex or null | `vibrant = "#ff181b"` | all | **Any can be null — always have a fallback** |
| Region | `region` | string | `"Americas"` | all | |
| Subregion | `subregion` | string | `"North America"` | all | |
| Continents | `continents[]` | array | `["North America"]` | all | |
| Area | `area.kilometers` | km² | 9,984,670 | all | |
| Area | `area.miles` | mi² | 3,855,101.1 | all | Pre-converted |
| Borders | `borders[]` | array of alpha-3 | `["USA"]` | all | Empty for islands — great for a "neighbours" strip |
| Landlocked | `landlocked` | boolean | `false` | all | |
| Coordinates | `coordinates.lat` / `.lng` | degrees | 60 / −95 | all | Map centring |
| Population | `population` | people | 41,417,056 | all | Syncs every 4 hours — **fresher than the World Bank** |
| Calling codes | `calling_codes[]` | array | `["1"]` | all | Already split, no `idd` assembly needed |
| Currencies | `currencies[]` | `{code, name, symbol}` | `CAD / Canadian dollar / $` | all | Flat array, easier than v3.1's object |
| Languages | `languages[]` | `{bcp47, iso639_1, iso639_2b, iso639_2t, iso639_3, name}` | `en / eng / English` | all | Richer than v3.1 |
| Driving side | `cars.driving_side` | `"left"` / `"right"` | `"right"` | all | |
| Car signs | `cars.signs[]` | array | `["CDN"]` | most | |
| Timezones | `timezones[]` | array | 6 entries UTC−08:00 … −03:30 | all | |
| TLDs | `tlds[]` | array | `[".ca"]` | all | |
| Start of week | `date.start_of_week` | string | `"sunday"` | all | |
| Fiscal year start | `date.fiscal_year_start.{government,corporate,personal}.{day,month}` | ints | govt: 1 April | all | Three separate years — nicely detailed |
| Academic year start | `date.academic_year_start.{day,month}` | ints | 1 September | all | |
| Demonyms | `demonyms.{lang}.{m,f}` | strings | `Canadian / Canadienne` | all | Gendered forms |
| Government type | `government_type` | string | `"Federal parliamentary constitutional monarchy"` | all | **Not in v3.1 — a genuinely new field** |
| UN member | `classification.un_member` | boolean | `true` | all | |
| UN observer | `classification.un_observer` | boolean | `false` | all | |
| Sovereign | `classification.sovereign` | boolean | `true` | all | |
| Dependency | `classification.dependency` / `.dependency_type` | boolean / string | `false` / `""` | all | Filter territories out |
| Disputed | `classification.disputed` | boolean | `false` | all | Taiwan, Kosovo, Western Sahara |
| ISO status | `classification.iso_status` | string | `"official"` | all | |
| Parent country | `parent.alpha_2` / `.alpha_3` | string | `""` | all | Set for territories |
| **Memberships** | `memberships.{un,eu,eurozone,schengen,nato,g7,g20,brics,oecd,opec,commonwealth,african_union,arab_league,asean}` | booleans | `g7 = true`, `nato = true` | all | **14 flags — an excellent "belongs to" badge row** |
| Postal code format | `postal_code.format` | string | `"@#@ #@#"` | most | |
| Postal code regex | `postal_code.regex` | string | full regex | most | |
| Number format | `number_format.{decimal_separator,thousands_separator}` | strings | `.` / `,` | all | **Format the dossier numbers the local way** |
| Measurement system | `units.measurement_system` | `"metric"` / `"imperial"` | `"metric"` | all | Offer a unit toggle |
| Temperature scale | `units.temperature_scale` | string | `"Celsius"` | all | |
| Gini by year | `economy.gini_coefficient.{year}` | number | 2018–2022, 5 years | medium | **Better than the World Bank's — a ready-made mini series** |
| Wikipedia | `links.wikipedia` | URL | `en.wikipedia.org/wiki/Canada` | all | |
| Official site | `links.official` | URL | `www.canada.ca` | most | |
| Google Maps | `links.google_maps` | URL | | all | |
| OpenStreetMap | `links.open_street_maps` | URL | | all | |
| Leaders | `leaders[]` | array of objects | with photos | paid plan | **Heavy — omit unless you pay** |
| Assets | `assets[]` | array | `[]` | varies | Coat of arms likely lives here |
| Last updated | `_meta.lastUpdatedTimestamp` | unix seconds | 1784526832 | all | Show a "data as of" line |
| Record UUID | `uuid` | string | | all | |

**Coat of arms:** v3.1 had `coatOfArms.{png,svg}`. In v5 I did not see a `coat_of_arms` path in
the demo record — `assets` was an empty array for Canada. **UNVERIFIED.** Check against a real
key before promising it in the UI.

---

# Recommended architecture

1. **Build time / long ISR:** fetch `/v2/country?format=json&per_page=400` once, filter
   `region.value !== "Aggregates"` → 217 countries. This is your route manifest and picker.
2. **Per country page** (`revalidate: 604800`, one week):
   - 4–6 World Bank calls, ~25–40 indicators each, `source=2&format=json&mrnev=1&per_page=200`
   - 1 REST Countries v5 call with `response_fields_omit=names.translations,leaders`
   - All in one `Promise.all`
3. **Charts:** add `date=1960:2025&per_page=1000` for the 10–20 indicators you actually plot.
   ~13 KB JSON per indicator per country.
4. **Map / leaderboards:** one call per indicator,
   `country/all/indicator/X?source=2&format=json&mrv=1&per_page=400` → 265 rows, 7 KB gzipped.
   Cache hard and share across all pages.
5. **Retry every World Bank call** — 3 attempts, backoff, treat 400 as retryable.
6. **Strip the BOM** if you parse the text yourself.
7. **Join on ISO alpha-3.** Handle Taiwan, Western Sahara and Vatican City having no World Bank
   row at all, and Kosovo using the non-standard `XKX`.

---

# What was tested vs assumed

**TESTED with live requests (11 endpoint calls):**
- Multi-indicator batching with and without `source=2`
- Indicator-count limits: 20, 30, 40 pass; 60 rejected
- `mrnev=1` on a single country (works) and on `country/all` (HTTP 400)
- Time series `date=1960:2025`, one country, 3 indicators — 198 rows, 40 KB / 2.4 KB gzipped
- Time series `date=1960:2025`, all countries, 1 indicator — 17,490 rows, 3.4 MB / 148 KB gzipped
- Rankings `country/all` with `date=2024` and with `mrv=1` — 265 rows, 58 KB / 7 KB gzipped
- Country list — 295 entries, 217 countries, 78 aggregates; TWN/ESH/VAT absent
- REST Countries v3.1 deprecation (all versions dead)
- REST Countries v5 live call with the demo key — full field shape captured
- **60 individual indicator codes** confirmed to return data for India (marked **T**). Zero came
  back empty.

**ASSUMED — not individually verified today:**
- The ~100 indicator codes marked **A**. These are real World Bank codes, but I did not confirm
  each returns a value for India. A validation sweep of the remaining codes was started and
  **stopped by throttling after the first batch of 20** — 5 batches never got a response.
  Finish it before shipping: one batch call per 20 codes with 10+ seconds between calls, and drop
  anything that comes back empty. Nothing failed validation; it simply never ran.
- Coverage percentages in the tables
- World Bank CC BY 4.0 licensing
- REST Countries v5 rate limits and terms (behind the signup wall)
- Whether coat of arms exists in v5
