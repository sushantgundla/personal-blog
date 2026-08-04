/**
 * ISO3 → the IANA timezone name of that country's CAPITAL city.
 *
 * Why this file exists
 * -------------------
 * The Atlas dossier shows a live clock for each capital. Wikidata gives us
 * the capital's name and coordinates but no timezone, and we are not allowed
 * to add an npm dependency. The clock therefore used to guess the offset
 * from the capital's longitude at 15 degrees per hour. That guess is wrong
 * in three separate ways:
 *
 *   1. It can only produce whole hours, so India (UTC+5:30), Nepal
 *      (UTC+5:45), Iran (UTC+3:30), Afghanistan (UTC+4:30) and Myanmar
 *      (UTC+6:30) were all off by half an hour or more.
 *   2. It ignores daylight saving, so every European and North American
 *      capital was an hour out for roughly half the year.
 *   3. Real timezones are political, not solar. Madrid sits at 3.7 degrees
 *      WEST but Spain runs on Central European Time; Buenos Aires computes
 *      to UTC-4 but Argentina is UTC-3.
 *
 * The fix needs no dependency at all: every browser already ships the full
 * IANA timezone database, and `Intl.DateTimeFormat` with a `timeZone` option
 * handles half-hour offsets and daylight saving correctly and for free. The
 * only thing missing was the zone NAME per country — which is this file.
 *
 * It is the CAPITAL's zone, not the country's
 * -------------------------------------------
 * Many countries span several zones. The panel is labelled "Capital time"
 * and claims to show one city's clock, so that is what we store: the zone
 * the capital city itself sits in.
 *
 *   USA → America/New_York      (Washington, D.C., not the whole country)
 *   RUS → Europe/Moscow         (Moscow, not Kamchatka)
 *   AUS → Australia/Sydney      (Canberra shares Sydney's zone)
 *   BRA → America/Sao_Paulo     (Brasília shares São Paulo's zone)
 *   CAN → America/Toronto       (Ottawa shares Toronto's zone)
 *
 * Where the capital has no zone entry of its own, the entry names the
 * nearest IANA zone that the capital actually observes — for example Ivory
 * Coast's Yamoussoukro is under Africa/Abidjan, and Tanzania's Dodoma is
 * under Africa/Dar_es_Salaam.
 *
 * Coverage
 * --------
 * Every entry in ISO_COUNTRIES is covered except four that have no capital
 * city at all: ATA (Antarctica), BVT (Bouvet Island), HMD (Heard Island and
 * McDonald Islands) and UMI (United States Minor Outlying Islands). All four
 * are uninhabited or have no seat of government, so there is no capital
 * clock to show. A missing ISO3 falls back to the old longitude
 * approximation in CapitalClock, clearly labelled as approximate.
 *
 * Keeping it correct
 * ------------------
 * Zone NAMES change very rarely, and the offsets and daylight-saving rules
 * behind them are the browser's problem, not ours — a country moving its
 * clocks needs no change here. Only a genuine rename (Europe/Kiev →
 * Europe/Kyiv) or a capital moving cities needs an edit.
 */
export const CAPITAL_TIMEZONES: Readonly<Record<string, string>> = {
  AFG: 'Asia/Kabul', // Kabul
  ALA: 'Europe/Mariehamn', // Mariehamn
  ALB: 'Europe/Tirane', // Tirana
  DZA: 'Africa/Algiers', // Algiers
  ASM: 'Pacific/Pago_Pago', // Pago Pago
  AND: 'Europe/Andorra', // Andorra la Vella
  AGO: 'Africa/Luanda', // Luanda
  AIA: 'America/Anguilla', // The Valley
  ATG: 'America/Antigua', // Saint John's
  ARG: 'America/Argentina/Buenos_Aires', // Buenos Aires
  ARM: 'Asia/Yerevan', // Yerevan
  ABW: 'America/Aruba', // Oranjestad
  AUS: 'Australia/Sydney', // Canberra
  AUT: 'Europe/Vienna', // Vienna
  AZE: 'Asia/Baku', // Baku
  BHR: 'Asia/Bahrain', // Manama
  BGD: 'Asia/Dhaka', // Dhaka
  BRB: 'America/Barbados', // Bridgetown
  BLR: 'Europe/Minsk', // Minsk
  BEL: 'Europe/Brussels', // Brussels
  BLZ: 'America/Belize', // Belmopan
  BEN: 'Africa/Porto-Novo', // Porto-Novo
  BMU: 'Atlantic/Bermuda', // Hamilton
  BTN: 'Asia/Thimphu', // Thimphu
  BOL: 'America/La_Paz', // Sucre
  BIH: 'Europe/Sarajevo', // Sarajevo
  BWA: 'Africa/Gaborone', // Gaborone
  BRA: 'America/Sao_Paulo', // Brasília
  IOT: 'Indian/Chagos', // Diego Garcia
  VGB: 'America/Tortola', // Road Town
  BRN: 'Asia/Brunei', // Bandar Seri Begawan
  BGR: 'Europe/Sofia', // Sofia
  BFA: 'Africa/Ouagadougou', // Ouagadougou
  BDI: 'Africa/Bujumbura', // Gitega
  KHM: 'Asia/Phnom_Penh', // Phnom Penh
  CMR: 'Africa/Douala', // Yaoundé
  CAN: 'America/Toronto', // Ottawa
  CPV: 'Atlantic/Cape_Verde', // Praia
  BES: 'America/Kralendijk', // Kralendijk
  CYM: 'America/Cayman', // George Town
  CAF: 'Africa/Bangui', // Bangui
  TCD: 'Africa/Ndjamena', // N'Djamena
  CHL: 'America/Santiago', // Santiago
  CXR: 'Indian/Christmas', // Flying Fish Cove
  CCK: 'Indian/Cocos', // West Island
  COL: 'America/Bogota', // Bogotá
  COM: 'Indian/Comoro', // Moroni
  COK: 'Pacific/Rarotonga', // Avarua
  CRI: 'America/Costa_Rica', // San José
  HRV: 'Europe/Zagreb', // Zagreb
  CUB: 'America/Havana', // Havana
  CUW: 'America/Curacao', // Willemstad
  CYP: 'Asia/Nicosia', // Nicosia
  CZE: 'Europe/Prague', // Prague
  COD: 'Africa/Kinshasa', // Kinshasa
  DNK: 'Europe/Copenhagen', // Copenhagen
  DJI: 'Africa/Djibouti', // Djibouti City
  DMA: 'America/Dominica', // Roseau
  DOM: 'America/Santo_Domingo', // Santo Domingo
  ECU: 'America/Guayaquil', // Quito
  EGY: 'Africa/Cairo', // Cairo
  SLV: 'America/El_Salvador', // San Salvador
  GNQ: 'Africa/Malabo', // Malabo
  ERI: 'Africa/Asmara', // Asmara
  EST: 'Europe/Tallinn', // Tallinn
  SWZ: 'Africa/Mbabane', // Mbabane
  ETH: 'Africa/Addis_Ababa', // Addis Ababa
  FLK: 'Atlantic/Stanley', // Stanley
  FRO: 'Atlantic/Faroe', // Tórshavn
  FSM: 'Pacific/Pohnpei', // Palikir
  FJI: 'Pacific/Fiji', // Suva
  FIN: 'Europe/Helsinki', // Helsinki
  FRA: 'Europe/Paris', // Paris
  GUF: 'America/Cayenne', // Cayenne
  PYF: 'Pacific/Tahiti', // Papeete
  ATF: 'Indian/Kerguelen', // Port-aux-Français
  GAB: 'Africa/Libreville', // Libreville
  GEO: 'Asia/Tbilisi', // Tbilisi
  DEU: 'Europe/Berlin', // Berlin
  GHA: 'Africa/Accra', // Accra
  GIB: 'Europe/Gibraltar', // Gibraltar
  GRC: 'Europe/Athens', // Athens
  GRL: 'America/Nuuk', // Nuuk
  GRD: 'America/Grenada', // Saint George's
  GLP: 'America/Guadeloupe', // Basse-Terre
  GUM: 'Pacific/Guam', // Hagåtña
  GTM: 'America/Guatemala', // Guatemala City
  GGY: 'Europe/Guernsey', // Saint Peter Port
  GIN: 'Africa/Conakry', // Conakry
  GNB: 'Africa/Bissau', // Bissau
  GUY: 'America/Guyana', // Georgetown
  HTI: 'America/Port-au-Prince', // Port-au-Prince
  HND: 'America/Tegucigalpa', // Tegucigalpa
  HKG: 'Asia/Hong_Kong', // Hong Kong
  HUN: 'Europe/Budapest', // Budapest
  ISL: 'Atlantic/Reykjavik', // Reykjavík
  IND: 'Asia/Kolkata', // New Delhi — UTC+5:30
  IDN: 'Asia/Jakarta', // Jakarta
  IRN: 'Asia/Tehran', // Tehran
  IRQ: 'Asia/Baghdad', // Baghdad
  IRL: 'Europe/Dublin', // Dublin
  IMN: 'Europe/Isle_of_Man', // Douglas
  ISR: 'Asia/Jerusalem', // Jerusalem
  ITA: 'Europe/Rome', // Rome
  CIV: 'Africa/Abidjan', // Yamoussoukro
  JAM: 'America/Jamaica', // Kingston
  JPN: 'Asia/Tokyo', // Tokyo
  JEY: 'Europe/Jersey', // Saint Helier
  JOR: 'Asia/Amman', // Amman
  KAZ: 'Asia/Almaty', // Astana
  KEN: 'Africa/Nairobi', // Nairobi
  NLD: 'Europe/Amsterdam', // Amsterdam
  KIR: 'Pacific/Tarawa', // South Tarawa
  KWT: 'Asia/Kuwait', // Kuwait City
  KGZ: 'Asia/Bishkek', // Bishkek
  LAO: 'Asia/Vientiane', // Vientiane
  LVA: 'Europe/Riga', // Riga
  LBN: 'Asia/Beirut', // Beirut
  LSO: 'Africa/Maseru', // Maseru
  LBR: 'Africa/Monrovia', // Monrovia
  LBY: 'Africa/Tripoli', // Tripoli
  LIE: 'Europe/Vaduz', // Vaduz
  LTU: 'Europe/Vilnius', // Vilnius
  LUX: 'Europe/Luxembourg', // Luxembourg City
  MAC: 'Asia/Macau', // Macau
  MDG: 'Indian/Antananarivo', // Antananarivo
  MWI: 'Africa/Blantyre', // Lilongwe
  MYS: 'Asia/Kuala_Lumpur', // Kuala Lumpur
  MDV: 'Indian/Maldives', // Malé
  MLI: 'Africa/Bamako', // Bamako
  MLT: 'Europe/Malta', // Valletta
  MHL: 'Pacific/Majuro', // Majuro
  MTQ: 'America/Martinique', // Fort-de-France
  MRT: 'Africa/Nouakchott', // Nouakchott
  MUS: 'Indian/Mauritius', // Port Louis
  MYT: 'Indian/Mayotte', // Mamoudzou
  MEX: 'America/Mexico_City', // Mexico City
  MDA: 'Europe/Chisinau', // Chișinău
  MCO: 'Europe/Monaco', // Monaco
  MNG: 'Asia/Ulaanbaatar', // Ulaanbaatar
  MNE: 'Europe/Podgorica', // Podgorica
  MSR: 'America/Montserrat', // Brades
  MAR: 'Africa/Casablanca', // Rabat
  MOZ: 'Africa/Maputo', // Maputo
  MMR: 'Asia/Yangon', // Naypyidaw — UTC+6:30
  NAM: 'Africa/Windhoek', // Windhoek
  NRU: 'Pacific/Nauru', // Yaren
  NPL: 'Asia/Kathmandu', // Kathmandu — UTC+5:45
  NCL: 'Pacific/Noumea', // Nouméa
  NZL: 'Pacific/Auckland', // Wellington
  NIC: 'America/Managua', // Managua
  NER: 'Africa/Niamey', // Niamey
  NGA: 'Africa/Lagos', // Abuja
  NIU: 'Pacific/Niue', // Alofi
  NFK: 'Pacific/Norfolk', // Kingston
  PRK: 'Asia/Pyongyang', // Pyongyang
  MKD: 'Europe/Skopje', // Skopje
  MNP: 'Pacific/Saipan', // Saipan
  NOR: 'Europe/Oslo', // Oslo
  OMN: 'Asia/Muscat', // Muscat
  PAK: 'Asia/Karachi', // Islamabad
  PLW: 'Pacific/Palau', // Ngerulmud
  PSE: 'Asia/Hebron', // Ramallah — West Bank zone
  PAN: 'America/Panama', // Panama City
  PNG: 'Pacific/Port_Moresby', // Port Moresby
  PRY: 'America/Asuncion', // Asunción
  CHN: 'Asia/Shanghai', // Beijing
  PER: 'America/Lima', // Lima
  PHL: 'Asia/Manila', // Manila
  PCN: 'Pacific/Pitcairn', // Adamstown
  POL: 'Europe/Warsaw', // Warsaw
  PRT: 'Europe/Lisbon', // Lisbon
  PRI: 'America/Puerto_Rico', // San Juan
  QAT: 'Asia/Qatar', // Doha
  COG: 'Africa/Brazzaville', // Brazzaville
  REU: 'Indian/Reunion', // Saint-Denis
  ROU: 'Europe/Bucharest', // Bucharest
  RUS: 'Europe/Moscow', // Moscow
  RWA: 'Africa/Kigali', // Kigali
  BLM: 'America/St_Barthelemy', // Gustavia
  SHN: 'Atlantic/St_Helena', // Jamestown
  KNA: 'America/St_Kitts', // Basseterre
  LCA: 'America/St_Lucia', // Castries
  SPM: 'America/Miquelon', // Saint-Pierre
  VCT: 'America/St_Vincent', // Kingstown
  MAF: 'America/Marigot', // Marigot
  WSM: 'Pacific/Apia', // Apia
  SMR: 'Europe/San_Marino', // San Marino
  STP: 'Africa/Sao_Tome', // São Tomé
  SAU: 'Asia/Riyadh', // Riyadh
  SEN: 'Africa/Dakar', // Dakar
  SRB: 'Europe/Belgrade', // Belgrade
  SYC: 'Indian/Mahe', // Victoria
  SLE: 'Africa/Freetown', // Freetown
  SGP: 'Asia/Singapore', // Singapore
  SXM: 'America/Lower_Princes', // Philipsburg
  SVK: 'Europe/Bratislava', // Bratislava
  SVN: 'Europe/Ljubljana', // Ljubljana
  SLB: 'Pacific/Guadalcanal', // Honiara
  SOM: 'Africa/Mogadishu', // Mogadishu
  ZAF: 'Africa/Johannesburg', // Pretoria
  SGS: 'Atlantic/South_Georgia', // King Edward Point
  XKX: 'Europe/Belgrade', // Pristina — no Europe/Pristina zone exists; Kosovo (XK) maps to Belgrade
  KOR: 'Asia/Seoul', // Seoul
  SSD: 'Africa/Juba', // Juba
  ESP: 'Europe/Madrid', // Madrid — CET, despite sitting west of Greenwich
  LKA: 'Asia/Colombo', // Sri Jayawardenepura Kotte
  SDN: 'Africa/Khartoum', // Khartoum
  SUR: 'America/Paramaribo', // Paramaribo
  SJM: 'Arctic/Longyearbyen', // Longyearbyen
  SWE: 'Europe/Stockholm', // Stockholm
  CHE: 'Europe/Zurich', // Bern
  SYR: 'Asia/Damascus', // Damascus
  TWN: 'Asia/Taipei', // Taipei
  TJK: 'Asia/Dushanbe', // Dushanbe
  TZA: 'Africa/Dar_es_Salaam', // Dodoma
  THA: 'Asia/Bangkok', // Bangkok
  BHS: 'America/Nassau', // Nassau
  GMB: 'Africa/Banjul', // Banjul
  TLS: 'Asia/Dili', // Dili
  TGO: 'Africa/Lome', // Lomé
  TKL: 'Pacific/Fakaofo', // Nukunonu
  TON: 'Pacific/Tongatapu', // Nukuʻalofa
  TTO: 'America/Port_of_Spain', // Port of Spain
  TUN: 'Africa/Tunis', // Tunis
  TUR: 'Europe/Istanbul', // Ankara
  TKM: 'Asia/Ashgabat', // Ashgabat
  TCA: 'America/Grand_Turk', // Cockburn Town
  TUV: 'Pacific/Funafuti', // Funafuti
  UGA: 'Africa/Kampala', // Kampala
  UKR: 'Europe/Kyiv', // Kyiv
  ARE: 'Asia/Dubai', // Abu Dhabi
  GBR: 'Europe/London', // London
  USA: 'America/New_York', // Washington, D.C.
  VIR: 'America/St_Thomas', // Charlotte Amalie
  URY: 'America/Montevideo', // Montevideo
  UZB: 'Asia/Tashkent', // Tashkent
  VUT: 'Pacific/Efate', // Port Vila
  VAT: 'Europe/Vatican', // Vatican City
  VEN: 'America/Caracas', // Caracas
  VNM: 'Asia/Ho_Chi_Minh', // Hanoi
  WLF: 'Pacific/Wallis', // Mata-Utu
  ESH: 'Africa/El_Aaiun', // Laayoune
  YEM: 'Asia/Aden', // Sanaa
  ZMB: 'Africa/Lusaka', // Lusaka
  ZWE: 'Africa/Harare', // Harare
}

/**
 * The capital's IANA timezone for an ISO3 code, or null if we have none.
 * Case-insensitive, because dossier routes use lowercase ISO3 in the URL.
 */
export function capitalTimezone(iso3: string | null | undefined): string | null {
  if (!iso3) return null
  return CAPITAL_TIMEZONES[iso3.toUpperCase()] ?? null
}
