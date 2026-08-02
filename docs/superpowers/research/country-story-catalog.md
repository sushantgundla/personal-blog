# Country Story Catalog

Non-economic data for the "every country is a banknote" explorer page. Server-fetched with
Next.js ISR (`fetch(url, { next: { revalidate: N } })`), no API keys unless stated.

Every claim below is marked **TESTED** (I ran it on 2026-08-02 and saw the response) or
**ASSUMED** (from docs / prior knowledge, not run here).

> ### Correction, 2026-08-02
>
> An earlier draft of this file listed wrong property IDs for the national-symbol fields.
> `atlas-data` caught it and was right. Verified against `wbgetentities` — **TESTED**:
>
> | I claimed it was | What `P…` actually means |
> |---|---|
> | `P2352` national animal | **applies to taxon** |
> | `P2444` national bird | **homoglyph** |
> | `P2450` national flower | **Encyclopædia Britannica contributor ID** |
> | `P991` national sport | **successful candidate** |
> | `P868` patron saint | **foods traditionally associated** — and it points *from* a food *to* a place, so binding it with the country as subject never matches |
>
> I originally read "India returned empty for national animal" as a coverage gap. It was
> not. Those fields could never have matched anything, for any country.
>
> **TESTED** via `wbsearchentities` with `type=property`: there is **no** Wikidata property
> for national animal, national bird, national flower, national dish, or national sport.
> They do not exist. Those five belong in `lib/atlas/overrides.ts`, not in a query.
>
> **One real find:** patron saint *is* a real property — **`P417`**, direction
> country → saint. **TESTED**: Poland → Adalbert of Prague + Stanislaus of Szczepanów,
> Italy → Catherine of Siena + Francis of Assisi, Mexico → Our Lady of Guadalupe.
> France and India return nothing, as expected.

---

## 0. The headline: one SPARQL query gets most of the dossier

**TESTED.** Returned in ~1 second. One HTTP GET. Change `wd:Q668` to any country's Q-id.

```
GET https://query.wikidata.org/sparql?format=json&query=<urlencoded query below>
User-Agent: CountryExplorer/1.0 (https://sushantgundla.com; contact@…)
```

```sparql
SELECT ?mottoLabel ?anthemLabel ?anthem_audio ?flag ?coa
       ?highLabel ?lowLabel ?hosLabel ?hogLabel ?capLabel ?capCoord
       ?indep ?sideLabel ?plate
       (GROUP_CONCAT(DISTINCT ?patronLabel; separator=", ") AS ?patrons)
       (GROUP_CONCAT(DISTINCT ?langLabel;   separator=", ") AS ?languages)
       (GROUP_CONCAT(DISTINCT ?curLabel;    separator=", ") AS ?currencies)
WHERE {
  BIND(wd:Q668 AS ?c)
  OPTIONAL { ?c wdt:P1546 ?motto }
  OPTIONAL { ?c wdt:P85 ?anthem . OPTIONAL { ?anthem wdt:P51 ?anthem_audio } }
  OPTIONAL { ?c wdt:P41  ?flag }
  OPTIONAL { ?c wdt:P94  ?coa }
  OPTIONAL { ?c wdt:P610 ?high }
  OPTIONAL { ?c wdt:P1589 ?low }
  OPTIONAL { ?c wdt:P36  ?cap . OPTIONAL { ?cap wdt:P625 ?capCoord } }
  OPTIONAL { ?c wdt:P35  ?hos }
  OPTIONAL { ?c wdt:P6   ?hog }
  OPTIONAL { ?c wdt:P571 ?indep }
  OPTIONAL { ?c wdt:P1622 ?side }
  OPTIONAL { ?c wdt:P395 ?plate }
  OPTIONAL { ?c wdt:P417 ?patron . ?patron rdfs:label ?patronLabel FILTER(lang(?patronLabel)="en") }
  OPTIONAL { ?c wdt:P37 ?lang . ?lang rdfs:label ?langLabel FILTER(lang(?langLabel)="en") }
  OPTIONAL { ?c wdt:P38 ?cur  . ?cur  rdfs:label ?curLabel  FILTER(lang(?curLabel)="en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
GROUP BY ?mottoLabel ?anthemLabel ?anthem_audio ?flag ?coa ?highLabel ?lowLabel
         ?hosLabel ?hogLabel ?capLabel ?capCoord ?indep ?sideLabel ?plate
```

Note: the `?patrons` line is my fix after the correction above. The rest of the query is
exactly what I ran. **The `P417` clause specifically is ASSUMED inside this combined query
— I tested `P417` on its own and it worked, but I did not re-run the whole query with it
folded in.**

Real response for India (**TESTED**, trimmed):

```
mottoLabel   = Satyameva Jayate
anthemLabel  = Jana Gana Mana
anthem_audio = …/Special:FilePath/Jana%20Gana%20Mana%20instrumental.ogg
flag         = …/Special:FilePath/Flag%20of%20India.svg
coa          = …/Special:FilePath/Emblem%20of%20India.svg
highLabel    = Kanchenjunga
lowLabel     = Kuttanad
hogLabel     = Narendra Modi
hosLabel     = Ganesh rajput          <-- WRONG. See the vandalism warning below.
capLabel     = New Delhi
capCoord     = Point(77.208888888 28.613888888)
indep        = 1947-08-15T00:00:00Z
sideLabel    = left
plate        = IND
languages    = English, Hindi
currencies   = Indian rupee
```

Build the page so any panel can be absent — plenty of countries are missing a motto, a
lowest point, or an anthem recording.

### Vandalism warning — read this before shipping

`hosLabel` returned **"Ganesh rajput"**. India's head of state is the President
(Droupadi Murmu at time of writing). Wikidata is openly editable and P35 on a
high-traffic item was showing junk at the moment I queried. **TESTED — this is a real
observed result, not a hypothetical.**

Practical consequences:

- Never present a live person's name as authoritative without a sanity check.
- Filter to statements with no end date and preferred rank, e.g. add
  `?c p:P35 ?st . ?st wikibase:rank wikibase:PreferredRank ; ps:P35 ?hos .
   FILTER NOT EXISTS { ?st pq:P582 ?end }`. **ASSUMED** — improves things, does not fix
  vandalism.
- Better: cache a hand-checked override map for the ~20 countries you expect traffic on,
  and let Wikidata fill the rest.
- Use a long `revalidate` (24h) so a vandalised value is not fetched constantly, but
  understand a long cache also means a *wrong* value sticks around for a day.

---

## 1. Wikidata property IDs

Source for all rows: Wikidata, `https://query.wikidata.org/sparql`. No key.
Coverage percentages are **ASSUMED** (my estimate from how commonly these properties are
filled), except where a row is marked TESTED against India.

| Field | Property ID | Example (India) | Coverage of ~195 countries | Notes |
|---|---|---|---|---|
| Head of state | `P35` | "Ganesh rajput" (vandalised; should be the President) | ~95% | TESTED. Untrustworthy — see warning above |
| Head of government | `P6` | Narendra Modi | ~90% | TESTED, correct |
| National anthem | `P85` | Jana Gana Mana | ~95% | TESTED. Label confirmed via `wbgetentities` |
| Anthem audio file | `P51` on the anthem item | `Jana Gana Mana instrumental.ogg` | ~70% | TESTED. `.ogg`, needs a fallback for Safari |
| Motto | `P1546` | Satyameva Jayate | ~70% | TESTED. Label confirmed. Often only in the local language |
| Flag image | `P41` | `Flag of India.svg` | ~100% | TESTED |
| Coat of arms | `P94` | `Emblem of India.svg` | ~95% | TESTED |
| Capital | `P36` | New Delhi | ~100% | TESTED |
| Capital coordinates | `P625` on the capital | `Point(77.2089 28.6139)` — note lon,lat order | ~100% | TESTED. SPARQL gives **longitude first** |
| Country coordinates | `P625` on the country | — | ~100% | ASSUMED |
| Date of independence / inception | `P571` (inception) | 1947-08-15 | ~85% | TESTED. `P571` is "inception"; some items use a "significant event" instead |
| Official language | `P37` | English, Hindi | ~95% | TESTED |
| Currency | `P38` | Indian rupee | ~100% | TESTED |
| Drives on side | `P1622` | left | ~95% | TESTED |
| Licence plate code | `P395` | IND | ~90% | TESTED |
| Highest point | `P610` | Kanchenjunga | ~90% | TESTED. Label confirmed |
| Lowest point | `P1589` | Kuttanad | ~50% | TESTED. Label confirmed |
| **Patron saint** | **`P417`** | *none* | ~25% | **TESTED** — Poland, Italy, Mexico all return values; India and France do not. Mostly Catholic countries |
| ISO 3166-1 alpha-3 | `P298` | IND | 100% | ASSUMED. Your join key to every other source |
| ISO alpha-2 | `P297` | IN | 100% | ASSUMED |
| Calling code | `P474` | +91 | ~95% | ASSUMED |
| Top-level domain | `P78` | .in | ~98% | ASSUMED |
| UNESCO World Heritage sites | items with `P1435` = `wd:Q9259` and `P17` = the country | — | good (~170 countries have ≥1) | ASSUMED. Needs a **second** query — see below |
| Notable people born there | `P27` (citizenship) or `P19` (birthplace) | see §3 | good but slow | TESTED, 26s. See §3 |
| National animal | **no such property** | — | — | **TESTED** via `wbsearchentities`. Does not exist. Use overrides |
| National bird | **no such property** | — | — | **TESTED**. Does not exist |
| National flower | **no such property** | — | — | **TESTED**. Does not exist |
| National dish | **no such property** | — | — | **TESTED**. Does not exist |
| National sport | **no such property** | — | — | **TESTED**. Does not exist |

### Q-ids you need

Get the country's Q-id from the Wikipedia summary response — it contains
`"wikibase_item":"Q668"` (**TESTED**). That saves a lookup round trip.

### A note on trusting property IDs

The correction at the top of this file happened because I guessed P-numbers from memory and
they *looked* plausible when the query ran — SPARQL `OPTIONAL` does not error on a wrong
property, it just returns nothing. An empty result and a wrong property ID are
indistinguishable from the outside.

If you add a property to any query here, verify the label first — it's one call:

```
https://www.wikidata.org/w/api.php?action=wbgetentities&ids=P417&format=json&props=labels&languages=en
```

### Second query: UNESCO sites (**ASSUMED**, not run here)

```sparql
SELECT ?siteLabel ?img ?coord WHERE {
  ?site wdt:P1435 wd:Q9259 ; wdt:P17 wd:Q668 .
  OPTIONAL { ?site wdt:P18 ?img }
  OPTIONAL { ?site wdt:P625 ?coord }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 30
```

`atlas-data` reports this working in `lib/atlas/sources/wikidata.ts`. Treat as confirmed by
them, not by me.

You could fold this into the main query with a subquery, but keeping it separate is easier
to cache on a different schedule and easier to let fail on its own.

### `wbgetentities` — the alternative

`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q668&format=json&props=claims|labels`
returns the whole item as JSON. **ASSUMED.** It is one request and never times out, but the
India item is roughly 1–2 MB and gives you raw Q-ids with no labels, so you would need a
second request to turn `Q1058` into "Narendra Modi". Prefer SPARQL.

---

## 2. Wikipedia REST API

Base: `https://en.wikipedia.org/api/rest_v1/`. No key. Send a real `User-Agent`.

| Field | Source | Exact endpoint | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Intro paragraph | Wikipedia REST | `/page/summary/India` → `extract` | "India, officially the Republic of India, is a country in South Asia…" | 100% | TESTED, HTTP 200 |
| Short description | same | → `description` | "Country in South Asia" | ~100% | TESTED. Perfect one-line subtitle for a banknote |
| Lead image | same | → `originalimage.source` / `thumbnail.source` | `…/Flag_of_India.svg/960px-Flag_of_India.svg.png` | ~100% | TESTED. **Caution:** for countries the lead image is usually the *flag*, not scenery |
| Coordinates | same | → `coordinates` `{lat, lon}` | `{lat: 21, lon: 78}` | ~95% | TESTED. Centroid, quite rough |
| Q-id | same | → `wikibase_item` | `Q668` | 100% | TESTED. Free join to Wikidata |
| Canonical URL | same | → `content_urls.desktop.page` | `https://en.wikipedia.org/wiki/India` | 100% | TESTED. Use for the attribution link |
| Revision timestamp | same | → `timestamp` | `2026-08-02T03:44:29Z` | 100% | TESTED. Show as "as of" |

### Getting a history section

Three options, worst to best:

1. `/page/mobile-sections/India` — returns every section as HTML, including "History".
   **ASSUMED.** Section numbering is not stable across articles, so you must match on the
   section *title*, and article structure varies a lot ("History" vs "Ancient India" vs
   "Etymology and history"). Response is large (several hundred KB).
2. `action=parse` with `&prop=wikitext&section=N` on `w/api.php` — same numbering problem.
3. **Recommended:** don't. Use the `extract` from `/page/summary/` for the intro and
   hand-write or LLM-write a short history line per country into a local file. The intro
   paragraph already covers the country's founding for most countries.

**Reliability, plainly:** the summary endpoint is solid and consistent. Section extraction
is not — expect it to produce something odd for maybe a quarter of countries, with headings
that don't match and inline citation markers, tables, and infoboxes mixed into the HTML.

Redirect handling: the endpoint follows redirects, so `/page/summary/Republic_of_India`
works. **ASSUMED.** Safer to build titles from Wikidata's English sitelink rather than
guessing.

---

## 3. Famous people

**TESTED.** Ranked by Wikipedia sitelink count — how many language editions have an article
about that person. It is a good proxy for fame and it is free.

```sparql
SELECT ?personLabel ?img (COUNT(?sl) AS ?n) WHERE {
  ?person wdt:P31 wd:Q5 ; wdt:P27 wd:Q668 .
  OPTIONAL { ?person wdt:P18 ?img }
  ?sl schema:about ?person .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
GROUP BY ?personLabel ?img ORDER BY DESC(?n) LIMIT 12
```

Real result for India (**TESTED**), all 12 with a portrait:

| # | Person | Sitelinks |
|---|---|---|
| 1 | Mahatma Gandhi | 283 |
| 2 | Mother Teresa | 198 |
| 3 | Jawaharlal Nehru | 190 |
| 4 | Narendra Modi | 172 |
| 5 | Indira Gandhi | 171 |
| 6 | B. R. Ambedkar | 148 |
| 7 | Satyajit Ray | 141 |
| 8 | Shah Rukh Khan | 136 |
| 9 | Salman Rushdie | 129 |
| 10 | Amitabh Bachchan | 125 |
| 11 | Chandrasekhara Venkata Raman | 116 |
| 12 | Aishwarya Rai | 116 |

Portrait URL: `?img` is a Commons `Special:FilePath` URL. Add `?width=400` to get a resized
version — `…/Special:FilePath/Mahatma%20Gandhi.jpg?width=400`. **ASSUMED.**

### The catch — say this out loud

**This query took 26.8 seconds for India. TESTED.** Wikidata's SPARQL timeout is 60 seconds
(**ASSUMED**), so India is already at 45% of the budget. It will be worse for the US, UK,
France, Germany, Italy, Russia, China, Japan — countries with hundreds of thousands of
people items. Expect timeouts for several of them.

Mitigations, in order of how much I'd trust them:

1. **Precompute.** Run this once per country offline, commit the 12 names + image URLs.
   Boring and it always works. My recommendation despite the ISR brief — this one field is
   the exception.
2. Add `?person wikibase:sitelinks ?n` instead of counting `schema:about` triples.
   **ASSUMED** — this is a precomputed value on the item and should be dramatically faster.
   Try this first; it may remove the problem entirely.

```sparql
SELECT ?personLabel ?img ?n WHERE {
  ?person wdt:P31 wd:Q5 ; wdt:P27 wd:Q668 ; wikibase:sitelinks ?n .
  OPTIONAL { ?person wdt:P18 ?img }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} ORDER BY DESC(?n) LIMIT 12
```

### Where it works badly

- **Big countries** — timeout risk, as above. Maybe 10–15 countries.
- **Countries that changed name or shape** — USSR, Yugoslavia, Czechoslovakia successors.
  People are tagged to the historical entity, so Serbia and Slovakia look thin.
- **Small states** — Nauru, Tuvalu, San Marino, Liechtenstein may return fewer than 12
  people, some with no portrait. Handle a short list gracefully.
- **Portraits are missing more often than names.** For low-traffic countries expect roughly
  half the top 12 to have no `P18` image. **ASSUMED.**
- **Photo licensing skew** — modern living people from countries with no free-photo culture
  often have no usable image, so your "famous people" wall skews to dead politicians.
  **ASSUMED.**
- Rough estimate: gives 12 good people-with-portraits for ~120 of 195 countries; thin
  results for ~50; near-empty for ~25. **ASSUMED.**

---

## 4. Trade partners — the honest answer

**UN Comtrade's public preview endpoint works with no API key. TESTED.** But it does not
give you partner *names*.

| Field | Source | Exact endpoint | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Total exports | UN Comtrade preview | `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=699&period=2022&partnerCode=0&cmdCode=TOTAL&flowCode=X` | $452.7 B | good | TESTED, HTTP 200, no key |
| Exports by partner | same, drop `partnerCode` | …`?reporterCode=699&period=2022&cmdCode=TOTAL&flowCode=X` | 224 rows, one per partner | good | TESTED |
| Imports by partner | same, `flowCode=M` | — | — | good | ASSUMED (only `X` tested) |
| By product | same, `cmdCode=01…99` and `aggrLevel` | — | — | good | ASSUMED |

### Top 10 export partners of India in **one** request — yes

**TESTED.** The one call above returns all 224 partners; sort by `primaryValue` client-side.
Top values I got for 2022:

| partnerCode (M49) | Value |
|---|---|
| 842 | $80.2 B |
| 784 | $31.3 B |
| 528 | $18.5 B |
| 156 | $15.1 B |
| 50 | $13.8 B |
| 702 | $11.8 B |
| 826 | $11.2 B |
| 276 | $10.4 B |
| 682 | $10.2 B |
| 792 | $10.0 B |

### The catch — **`partnerDesc` and `partnerISO` are `null`**

**TESTED.** The public preview endpoint returns numeric M49 codes only. Every descriptive
field is null: `reporterISO`, `reporterDesc`, `partnerISO`, `partnerDesc`, `cmdDesc`,
`flowDesc`, `motDesc`. So the row above reads `842 → $80.2B`, not `United States → $80.2B`.

Fix: ship a small static M49 → country name/ISO3 map (~250 entries) in the repo and join
locally. It never changes. That is one small file, no extra request. For reference the codes
above are 842 United States, 784 United Arab Emirates, 528 Netherlands, 156 China, 50
Bangladesh, 702 Singapore, 826 United Kingdom, 276 Germany, 682 Saudi Arabia, 792 Türkiye.
**ASSUMED** — standard M49 codes, I did not verify each against the API.

Also note `reporterCode=699` is India in M49, not `356`. You need the same map to build the
request. And the "preview" endpoint is explicitly a limited public tier — **ASSUMED** it may
cap rows or be withdrawn; the full `/data/` path needs a free subscription key.

### The other two

| Source | Key needed? | Verdict |
|---|---|---|
| World Bank WITS | No key. `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade/reporter/ind/year/2020/partner/all/product/all/indicator/MPRT-TRD-VL` returned **HTTP 200 — TESTED** | Works key-less, but returns **SDMX XML**, not JSON. Verbose and awkward to parse in a Next.js route. Data also lags several years. Use only as a fallback |
| OEC (oec.world) | **Yes, a key** for the current API | ASSUMED. Their older open endpoints have been progressively closed off. Do not build on it |

**Bottom line:** use UN Comtrade preview + a local M49 name map. It is the only clean
key-less path and it does get you "top 10 export partners of India" in one request.

---

## 5. Images, flags, and anthem audio

All from Wikimedia Commons. No key.

| Asset | How to get it | Example (India) | Coverage | Notes |
|---|---|---|---|---|
| Flag | Wikidata `P41` → `Special:FilePath` | `…/Special:FilePath/Flag%20of%20India.svg` | ~100% | TESTED. SVG — scales perfectly for a banknote |
| Coat of arms | Wikidata `P94` | `…/Special:FilePath/Emblem%20of%20India.svg` | ~95% | TESTED |
| Anthem audio | Wikidata `P51` on the anthem item | `…/Special:FilePath/Jana%20Gana%20Mana%20instrumental.ogg` | ~70% | TESTED. `.ogg` Vorbis |
| Resized image | append `?width=N` to any `Special:FilePath` URL | `…/Flag%20of%20India.svg?width=600` | — | ASSUMED |
| Landmark photos | Wikidata `P18` on UNESCO/landmark items | — | good | ASSUMED |
| File metadata + licence | `https://commons.wikimedia.org/w/api.php?action=query&titles=File:Flag%20of%20India.svg&prop=imageinfo&iiprop=extmetadata&format=json` | — | 100% | ASSUMED — not run. Gives `LicenseShortName`, `Artist`, `Credit` |

### Hotlinking

**ASSUMED.** Wikimedia's terms permit hotlinking `upload.wikimedia.org` but ask that you not
hammer it, send a real `User-Agent`, and not treat it as your CDN. For a low-traffic personal
blog this is fine. Next.js `<Image>` needs `upload.wikimedia.org` and
`commons.wikimedia.org` added to `images.remotePatterns` in `next.config.js`.

**Note:** the Wikipedia summary lead image sits on `upload.wikimedia.org/wikipedia/en/…`
(**TESTED** — that's the `en` project, not `commons`). Flags in particular are often local
non-free uploads on en.wikipedia rather than Commons. Allow both hosts.

### Attribution you must display

- **Wikipedia text** (the `extract`): CC BY-SA 4.0. You must credit and link back to the
  article, and note the licence. Something like:
  *"Description from [Wikipedia](https://en.wikipedia.org/wiki/India), CC BY-SA 4.0."*
- **Wikidata facts**: CC0. No attribution legally required. Credit anyway — it's cheap and
  it tells the reader where the numbers came from.
- **Commons images**: **each file has its own licence.** Public domain, CC0, CC BY, CC BY-SA
  all appear. Most national flags and coats of arms are public domain, but not all. Safe
  approach: show "Image: Wikimedia Commons" with a link to the file page
  (`https://commons.wikimedia.org/wiki/File:Flag_of_India.svg`) and let the file page carry
  the details. Stricter approach: pull `extmetadata` and print the real author + licence.
- **Anthem audio**: same per-file rule. Many are PD recordings, some are not.
- **UN Comtrade**: attribution requested. "Source: UN Comtrade."
- **Open-Meteo**: CC BY 4.0, attribution required.

---

## 6. Extras worth having

| Field | Source | Exact endpoint | Example (India) | Coverage | Notes |
|---|---|---|---|---|---|
| Current weather at capital | Open-Meteo | `https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current=temperature_2m` | HTTP 200 | 100% | **TESTED.** No key. Feed it the `P625` capital coords |
| Climate normals | Open-Meteo | `https://climate-api.open-meteo.com/v1/climate?...` | — | 100% | ASSUMED |
| Timezone | Open-Meteo `&timezone=auto`, or Wikidata `P421` | — | ~100% | ASSUMED. Enough for a live capital clock rendered client-side |
| Exchange rates | Frankfurter | `https://api.frankfurter.dev/v1/latest?from=INR` | `{"base":"INR","date":"2026-07-31","rates":{"EUR":0.00913,…}}` | **~30 currencies only** | **TESTED**, no key. ECB data. Note the domain: `api.frankfurter.app` **301-redirects** to `api.frankfurter.dev/v1/` — use the new one directly |
| Flags, plate codes, calling codes, timezones (one call) | REST Countries | `https://restcountries.com/v3.1/alpha/IND?fields=name,flags,coatOfArms,car,timezones,currencies` | HTTP 200 after redirect | ~100% | **TESTED**, no key. But it **301-redirects** to `files-03.restcountries.com/countries.00/legacy.json` — a static file, and the `fields` filter appears not to be honoured after the redirect. Treat as unstable |
| Country outline / border geometry | Natural Earth or `geojson-maps` npm | — | 100% | ASSUMED. Bundle locally, don't fetch. A country silhouette is the single most banknote-like visual you can add |

### On Frankfurter's coverage

It only carries the ~30 currencies the European Central Bank publishes. Indian rupee, US
dollar, yen, yuan — fine. Nigerian naira, Kenyan shilling, Pakistani rupee, Vietnamese dong
— absent. **TESTED** (I saw the returned rate list). So the "1 unit of local currency buys X"
panel will be blank for well over half of all countries. There is no good key-less
alternative with full coverage.

---

## 7. Requests per country page

Assuming ISR with a long `revalidate`, so these run rarely, not per visitor.

| # | Request | Suggested `revalidate` | Cost |
|---|---|---|---|
| 1 | Wikidata SPARQL — the big dossier query | 86400 (24h) | ~1s. TESTED |
| 2 | Wikipedia REST `/page/summary/{title}` | 86400 | fast. TESTED |
| 3 | Wikidata SPARQL — UNESCO sites | 604800 (7d) | ASSUMED |
| 4 | Wikidata SPARQL — famous people | **precompute instead** | 27s live. TESTED |
| 5 | UN Comtrade — exports by partner | 604800 (7d) | ~1s. TESTED |
| 6 | UN Comtrade — imports by partner | 604800 | ASSUMED |
| 7 | Open-Meteo — current weather at capital | 3600 (1h) | fast. TESTED |
| 8 | Frankfurter — exchange rates | 86400 | fast. TESTED |

**7 live requests per country page**, plus one precomputed local file for famous people.
Drop #6 and you are at 6. That is reasonable for ISR. It would be far too many for a
per-request render.

Practical shape: run 1, 2, 5, 7, 8 in a `Promise.allSettled` so one dead source doesn't
blank the page. Every panel needs an empty state anyway.

---

## 8. Rate limits

**Wikidata SPARQL (WDQS) has a real, enforced limit.** These are **ASSUMED** from the
published user-agent and query-service policy, not measured here:

- **60-second query timeout.** Hard. The famous-people query used 27s of it — TESTED.
- Roughly **5 concurrent queries** per IP.
- An error/throttle budget around **30 queries per minute** per IP; exceed it and you get
  HTTP 429 with a `Retry-After` header.
- **A descriptive `User-Agent` is required**, with a contact URL or email. Generic agents
  (bare `curl`, `node-fetch` defaults) get blocked. I sent
  `CountryExplorer/1.0 (research)` and it worked — TESTED.
- Vercel builds all share outbound IPs with other customers, so you can be throttled through
  no fault of your own. **ASSUMED.** Another argument for long `revalidate` values and for
  precomputing the expensive query.

Others:

- **Wikipedia REST**: ~200 requests/second for anonymous users. Not a concern here.
  **ASSUMED.**
- **UN Comtrade preview**: undocumented but real limits on the free public tier. **ASSUMED.**
  Cache for a week — the data is annual anyway.
- **Open-Meteo**: 10,000 calls/day free, non-commercial. **ASSUMED.**
- **Frankfurter**: no published limit. **ASSUMED.**
- **Commons image hotlinks**: no hard limit, but be polite. **ASSUMED.**

---

## 9. Gaps — no free source found

| Want | Status |
|---|---|
| **National animal, bird, flower, dish, sport** | **No Wikidata property exists for any of these. TESTED** via `wbsearchentities` with `type=property`. Not a coverage gap — there is no field. These five must be hand-written into `lib/atlas/overrides.ts`. Given the banknote concept, they are probably worth the hour of typing |
| **Longest river in a country** | No direct property. You could query rivers with `P17` = country and sort by `P2043` (length), but river length is per-river-total not per-country, so the Nile would be "Uganda's longest river". Not solved |
| **National colours** | Nothing reliable. Derive from the flag SVG instead |
| **Reliable current head of state** | Wikidata is vandalised (TESTED, see §0). No free, always-correct source. Needs a manual override list for countries you care about |
| **Exchange rates for most currencies** | Frankfurter covers ~30. No key-less source covers all ~180. TESTED |
| **Partner country names in trade data** | Comtrade preview returns null names. Needs a local M49 map. TESTED |
| **Country history narrative** | Wikipedia section extraction is unreliable (§2). Use the summary `extract` or write it yourself |
| **Anthem sheet music / lyrics in English** | Scattered, licensing unclear. Skipped |
| **Consistent scenery photo per country** | The Wikipedia lead image is usually the flag, not a landscape. TESTED. Pull from UNESCO site `P18` images instead |

Note that **patron saint is no longer in this list** — `P417` is real and works. See the
correction box at the top.

---

## 10. What I tested vs assumed

**TESTED** (ran on 2026-08-02, saw the response):

- Wikipedia REST `/page/summary/India` — HTTP 200, full field list confirmed
- Wikidata SPARQL small query (motto, anthem, flag, coa, independence, plate) — 200
- Wikidata SPARQL **full dossier query** — 200, ~1s, results above
- Wikidata SPARQL famous-people query — 200, **26.8s**, 12 results with portraits
- `wbgetentities` label check on P2352, P2444, P2450, P991, P868, P1546, P85, P610, P1589 —
  proved the first five were wrong properties
- `wbsearchentities` with `type=property` for national animal / bird / flower / dish /
  sport — **zero results each**; patron saint returned `P417`
- `P417` on Poland, Italy, Mexico, France, India — 200, values for the first three
- UN Comtrade preview, total exports — 200, $452.7B
- UN Comtrade preview, exports by all partners — 200, 224 rows, **names null**
- World Bank WITS SDMX — 200
- Open-Meteo forecast — 200
- Frankfurter — 301 → 200 on `api.frankfurter.dev/v1/`, rate list seen
- REST Countries — 301 → 200 on a static file host

**ASSUMED, not run:** all coverage percentages; the combined dossier query *with the P417
clause folded in*; Commons `extmetadata` licence lookup; the UNESCO sites query (though
`atlas-data` reports it working); imports (`flowCode=M`); Wikipedia section extraction;
OEC's key requirement; every rate-limit number; `?width=` image resizing;
`wikibase:sitelinks` being faster.
