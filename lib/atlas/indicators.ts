// The indicator catalogue — one entry per World Bank indicator we show on a
// dossier. Codes are taken from docs/superpowers/research/country-numbers-catalog.md.
// Do not invent codes here; every code must be verifiable by
// scripts/atlas/verify-indicators.mjs, which is the pre-ship sweep that
// drops anything that comes back empty for a sample of countries.
//
// `higherIsBetter` is a judgement call used to colour a note's comparison
// thread ember (above average, "good") or thread teal (below average). Many
// indicators are genuinely neutral (null) — population is not "better" when
// higher.
import type { AtlasFormat, AtlasSection, IndicatorDef } from "./types";

function def(
  code: string,
  label: string,
  unit: string,
  section: AtlasSection,
  format: AtlasFormat,
  higherIsBetter: boolean | null,
  chart = false
): IndicatorDef {
  return { code, label, unit, section, format, higherIsBetter, chart };
}

export const INDICATORS: IndicatorDef[] = [
  // ---------------------------------------------------------------- MONEY
  def("NY.GDP.MKTP.CD", "GDP", "current US$", "MONEY", "currency", true, true),
  def("NY.GDP.MKTP.PP.CD", "GDP, purchasing power parity", "current int'l $", "MONEY", "currency", true),
  def("NY.GDP.PCAP.CD", "GDP per person", "current US$", "MONEY", "currency", true, true),
  def("NY.GDP.PCAP.PP.CD", "GDP per person, purchasing power parity", "current int'l $", "MONEY", "currency", true),
  def("NY.GDP.MKTP.KD.ZG", "GDP growth", "% per year", "MONEY", "percent", true, true),
  def("NY.GDP.PCAP.KD.ZG", "GDP per person growth", "% per year", "MONEY", "percent", true),
  def("NY.GNP.MKTP.CD", "Gross national income", "current US$", "MONEY", "currency", true),
  def("NY.GNP.PCAP.CD", "Gross national income per person", "current US$", "MONEY", "currency", true),
  def("NY.GNP.PCAP.PP.CD", "Gross national income per person, PPP", "current int'l $", "MONEY", "currency", true),
  def("FP.CPI.TOTL.ZG", "Inflation", "% per year", "MONEY", "percent", false, true),
  def("NY.GDP.DEFL.KD.ZG", "Inflation (GDP deflator)", "% per year", "MONEY", "percent", false),
  def("FR.INR.RINR", "Real interest rate", "%", "MONEY", "percent", null),
  def("FR.INR.LEND", "Lending interest rate", "%", "MONEY", "percent", null),
  def("GC.DOD.TOTL.GD.ZS", "Government debt", "% of GDP", "MONEY", "percent", false, true),
  def("GC.REV.XGRT.GD.ZS", "Government revenue", "% of GDP", "MONEY", "percent", null),
  def("GC.XPN.TOTL.GD.ZS", "Government spending", "% of GDP", "MONEY", "percent", null),
  def("NE.CON.GOVT.ZS", "Government consumption", "% of GDP", "MONEY", "percent", null),
  def("NE.CON.PRVT.ZS", "Household consumption", "% of GDP", "MONEY", "percent", null),
  def("NE.GDI.TOTL.ZS", "Investment (gross capital formation)", "% of GDP", "MONEY", "percent", true),
  def("NE.GDI.FTOT.ZS", "Fixed investment", "% of GDP", "MONEY", "percent", true),
  def("NY.GNS.ICTR.ZS", "Gross savings", "% of GDP", "MONEY", "percent", true),
  def("BX.KLT.DINV.CD.WD", "Foreign investment inflows", "current US$", "MONEY", "currency", true, true),
  def("BX.KLT.DINV.WD.GD.ZS", "Foreign investment inflows", "% of GDP", "MONEY", "percent", true),
  def("BM.KLT.DINV.WD.GD.ZS", "Foreign investment outflows", "% of GDP", "MONEY", "percent", null),
  def("BN.CAB.XOKA.GD.ZS", "Current account balance", "% of GDP", "MONEY", "percent", null),
  def("FI.RES.TOTL.CD", "Foreign reserves", "current US$", "MONEY", "currency", true),
  def("DT.DOD.DECT.CD", "External debt", "current US$", "MONEY", "currency", false),
  def("SI.POV.GINI", "Income inequality (Gini)", "0-100", "MONEY", "number", false),
  def("SI.POV.DDAY", "People below the poverty line", "% of population", "MONEY", "percent", false, true),
  def("SI.DST.10TH.10", "Income share held by richest 10%", "%", "MONEY", "percent", false),
  def("SI.DST.FRST.10", "Income share held by poorest 10%", "%", "MONEY", "percent", true),
  def("CM.MKT.LCAP.GD.ZS", "Stock market value", "% of GDP", "MONEY", "percent", null),
  def("BX.TRF.PWKR.CD.DT", "Money sent home by workers abroad", "current US$", "MONEY", "currency", null),
  def("DT.ODA.ODAT.GN.ZS", "Foreign aid received", "% of GNI", "MONEY", "percent", null),
  def("PA.NUS.FCRF", "Exchange rate", "local currency per US$", "MONEY", "number", null),
  def("NV.AGR.TOTL.ZS", "Agriculture's share of the economy", "% of GDP", "MONEY", "percent", null),
  def("NV.IND.TOTL.ZS", "Industry's share of the economy", "% of GDP", "MONEY", "percent", null),
  def("NV.IND.MANF.ZS", "Manufacturing's share of the economy", "% of GDP", "MONEY", "percent", null),
  def("NV.SRV.TOTL.ZS", "Services' share of the economy", "% of GDP", "MONEY", "percent", null),

  // ---------------------------------------------------------------- TRADE
  def("NE.EXP.GNFS.ZS", "Exports", "% of GDP", "TRADE", "percent", null, true),
  def("NE.IMP.GNFS.ZS", "Imports", "% of GDP", "TRADE", "percent", null),
  def("NE.RSB.GNFS.ZS", "Trade balance", "% of GDP", "TRADE", "percent", null),
  def("TG.VAL.TOTL.GD.ZS", "Total trade (openness)", "% of GDP", "TRADE", "percent", null),
  def("TX.VAL.MRCH.CD.WT", "Goods exported", "current US$", "TRADE", "currency", true),
  def("TM.VAL.MRCH.CD.WT", "Goods imported", "current US$", "TRADE", "currency", null),
  def("BX.GSR.NFSV.CD", "Services exported", "current US$", "TRADE", "currency", true),
  def("BM.GSR.NFSV.CD", "Services imported", "current US$", "TRADE", "currency", null),
  def("BX.GSR.GNFS.CD", "Goods and services exported", "current US$", "TRADE", "currency", true),
  def("BM.GSR.GNFS.CD", "Goods and services imported", "current US$", "TRADE", "currency", null),
  def("TX.VAL.TECH.MF.ZS", "High-tech share of exports", "% of manufactured exports", "TRADE", "percent", true),
  def("TT.PRI.MRCH.XD.WD", "Terms of trade", "index", "TRADE", "number", null),

  // --------------------------------------------------------------- PEOPLE
  def("SP.POP.TOTL", "Population", "people", "PEOPLE", "number", null, true),
  def("SP.POP.GROW", "Population growth", "% per year", "PEOPLE", "percent", null),
  def("EN.POP.DNST", "Population density", "people per km²", "PEOPLE", "number", null),
  def("SP.URB.TOTL.IN.ZS", "People living in cities", "% of population", "PEOPLE", "percent", null, true),
  def("SP.URB.GROW", "Urban population growth", "% per year", "PEOPLE", "percent", null),
  def("SP.RUR.TOTL.ZS", "People living rurally", "% of population", "PEOPLE", "percent", null),
  def("SP.POP.0014.TO.ZS", "Population aged 0-14", "% of population", "PEOPLE", "percent", null),
  def("SP.POP.1564.TO.ZS", "Population aged 15-64", "% of population", "PEOPLE", "percent", null),
  def("SP.POP.65UP.TO.ZS", "Population aged 65+", "% of population", "PEOPLE", "percent", null),
  def("SP.POP.DPND", "Age dependency ratio", "% of working-age population", "PEOPLE", "percent", null),
  def("SP.POP.TOTL.FE.ZS", "Female population", "% of population", "PEOPLE", "percent", null),
  def("SP.DYN.TFRT.IN", "Births per woman", "births per woman", "PEOPLE", "number", null, true),
  def("SP.DYN.CBRT.IN", "Birth rate", "per 1,000 people", "PEOPLE", "per1000", null),
  def("SP.DYN.CDRT.IN", "Death rate", "per 1,000 people", "PEOPLE", "per1000", null),
  def("SM.POP.NETM", "Net migration", "people (5-year total)", "PEOPLE", "number", null),
  def("SM.POP.TOTL.ZS", "Migrants living in the country", "% of population", "PEOPLE", "percent", null),

  // ---------------------------------------------------------------- HEALTH
  def("SP.DYN.LE00.IN", "Life expectancy", "years", "HEALTH", "years", true, true),
  def("SP.DYN.LE00.FE.IN", "Life expectancy, women", "years", "HEALTH", "years", true),
  def("SP.DYN.LE00.MA.IN", "Life expectancy, men", "years", "HEALTH", "years", true),
  def("SP.DYN.IMRT.IN", "Infant deaths", "per 1,000 live births", "HEALTH", "per1000", false, true),
  def("SH.DYN.MORT", "Deaths under age 5", "per 1,000 live births", "HEALTH", "per1000", false),
  def("SH.STA.MMRT", "Maternal deaths", "per 100,000 live births", "HEALTH", "number", false),
  def("SH.XPD.CHEX.GD.ZS", "Health spending", "% of GDP", "HEALTH", "percent", null),
  def("SH.XPD.CHEX.PC.CD", "Health spending per person", "current US$", "HEALTH", "currency", null),
  def("SH.MED.PHYS.ZS", "Physicians", "per 1,000 people", "HEALTH", "per1000", true),
  def("SH.MED.NUMW.P3", "Nurses and midwives", "per 1,000 people", "HEALTH", "per1000", true),
  def("SH.MED.BEDS.ZS", "Hospital beds", "per 1,000 people", "HEALTH", "per1000", true),
  def("SH.H2O.BASW.ZS", "Access to clean drinking water", "% of population", "HEALTH", "percent", true),
  def("SH.STA.BASS.ZS", "Access to basic sanitation", "% of population", "HEALTH", "percent", true),
  def("SH.STA.SUIC.P5", "Suicide rate", "per 100,000 people", "HEALTH", "number", false),
  def("SH.PRV.SMOK", "Adults who smoke", "% of adults", "HEALTH", "percent", false),
  def("SH.DYN.AIDS.ZS", "HIV prevalence", "% aged 15-49", "HEALTH", "percent", false),
  def("SH.TBS.INCD", "Tuberculosis cases", "per 100,000 people", "HEALTH", "number", false),
  def("SN.ITK.DEFC.ZS", "Undernourishment", "% of population", "HEALTH", "percent", false),
  def("SH.IMM.MEAS", "Children vaccinated against measles", "% of children 12-23 months", "HEALTH", "percent", true),

  // -------------------------------------------------------------- LEARNING
  def("SE.XPD.TOTL.GD.ZS", "Education spending", "% of GDP", "LEARNING", "percent", null),
  def("SE.XPD.TOTL.GB.ZS", "Education spending", "% of government spending", "LEARNING", "percent", null),
  def("SE.ADT.LITR.ZS", "Adult literacy", "% aged 15+", "LEARNING", "percent", true),
  def("SE.ADT.1524.LT.ZS", "Youth literacy", "% aged 15-24", "LEARNING", "percent", true),
  def("SE.PRM.ENRR", "Primary school enrolment", "% gross", "LEARNING", "percent", true),
  def("SE.SEC.ENRR", "Secondary school enrolment", "% gross", "LEARNING", "percent", true),
  def("SE.TER.ENRR", "University enrolment", "% gross", "LEARNING", "percent", true, true),
  def("SE.PRM.CMPT.ZS", "Primary school completion", "% of relevant age group", "LEARNING", "percent", true),
  def("SE.PRM.ENRL.TC.ZS", "Pupils per teacher, primary school", "pupils per teacher", "LEARNING", "number", false),
  def("SE.COM.DURS", "Years of compulsory education", "years", "LEARNING", "years", null),

  // ------------------------------------------------------------------ WORK
  def("SL.UEM.TOTL.ZS", "Unemployment", "% of labour force", "WORK", "percent", false, true),
  def("SL.UEM.1524.ZS", "Youth unemployment", "% of labour force aged 15-24", "WORK", "percent", false),
  def("SL.TLF.CACT.ZS", "Labour force participation", "% aged 15+", "WORK", "percent", null),
  def("SL.TLF.CACT.FE.ZS", "Women in the labour force", "% of women aged 15+", "WORK", "percent", null),
  def("SL.TLF.CACT.MA.ZS", "Men in the labour force", "% of men aged 15+", "WORK", "percent", null),
  def("SL.TLF.TOTL.IN", "Labour force", "people", "WORK", "number", null),
  def("SL.AGR.EMPL.ZS", "Working in agriculture", "% of employment", "WORK", "percent", null),
  def("SL.IND.EMPL.ZS", "Working in industry", "% of employment", "WORK", "percent", null),
  def("SL.SRV.EMPL.ZS", "Working in services", "% of employment", "WORK", "percent", null),
  def("SL.EMP.SELF.ZS", "Self-employed", "% of employment", "WORK", "percent", null),
  def("SL.TLF.ADVN.ZS", "Labour force with advanced education", "% of labour force", "WORK", "percent", true),
  def("SL.EMP.TOTL.SP.ZS", "Employed", "% aged 15+", "WORK", "percent", null),

  // ------------------------------------------------------------- CONNECTED
  def("IT.NET.USER.ZS", "People online", "% of population", "CONNECTED", "percent", true, true),
  def("IT.CEL.SETS.P2", "Mobile phone subscriptions", "per 100 people", "CONNECTED", "number", null),
  def("IT.NET.BBND.P2", "Fixed broadband subscriptions", "per 100 people", "CONNECTED", "number", true),
  def("IT.MLT.MAIN.P2", "Fixed telephone lines", "per 100 people", "CONNECTED", "number", null),
  def("EG.ELC.ACCS.ZS", "Access to electricity", "% of population", "CONNECTED", "percent", true, true),
  def("EG.CFT.ACCS.ZS", "Access to clean cooking fuel", "% of population", "CONNECTED", "percent", true),
  def("EG.USE.ELEC.KH.PC", "Electricity used per person", "kWh per person", "CONNECTED", "number", null),
  def("EG.USE.PCAP.KG.OE", "Energy used per person", "kg oil equivalent per person", "CONNECTED", "number", null),
  def("IS.AIR.PSGR", "Air passengers carried", "passengers", "CONNECTED", "number", null),
  def("IS.AIR.GOOD.MT.K1", "Air freight", "million tonne-km", "CONNECTED", "number", null),
  def("IS.RRS.TOTL.KM", "Rail network", "route-km", "CONNECTED", "number", null),
  def("IS.RRS.PASG.KM", "Rail passengers", "million passenger-km", "CONNECTED", "number", null),
  def("IS.SHP.GOOD.TU", "Container port traffic", "TEU", "CONNECTED", "number", null),
  def("GB.XPD.RSDV.GD.ZS", "Research and development spending", "% of GDP", "CONNECTED", "percent", true),
  def("IP.PAT.RESD", "Patent applications by residents", "count", "CONNECTED", "number", null),
  def("IP.JRN.ARTC.SC", "Scientific journal articles published", "count", "CONNECTED", "number", null),
  def("ST.INT.ARVL", "Tourists arriving", "count", "CONNECTED", "number", null),
  def("ST.INT.RCPT.CD", "Money earned from tourism", "current US$", "CONNECTED", "currency", null),

  // ----------------------------------------------------------------- LAND
  def("AG.LND.FRST.ZS", "Land covered by forest", "% of land area", "LAND", "percent", true, true),
  def("AG.LND.FRST.K2", "Forest area", "km²", "LAND", "number", null),
  def("AG.LND.AGRI.ZS", "Agricultural land", "% of land area", "LAND", "percent", null),
  def("AG.LND.ARBL.ZS", "Farmable (arable) land", "% of land area", "LAND", "percent", null),
  def("AG.SRF.TOTL.K2", "Land area", "km²", "LAND", "number", null),

  // --------------------------------------------------------------- NATURE
  def("EN.GHG.CO2.PC.CE.AR5", "Carbon emissions per person", "tonnes per person", "NATURE", "number", false, true),
  def("EN.GHG.CO2.MT.CE.AR5", "Carbon emissions", "Mt CO2", "NATURE", "number", false),
  def("EN.GHG.ALL.MT.CE.AR5", "Greenhouse gas emissions", "Mt CO2-equivalent", "NATURE", "number", false),
  def("ER.LND.PTLD.ZS", "Protected land", "% of land area", "NATURE", "percent", true),
  def("ER.MRN.PTMR.ZS", "Protected coastal waters", "% of territorial waters", "NATURE", "percent", true),
  def("ER.H2O.FWTL.ZS", "Freshwater withdrawn", "% of internal resources", "NATURE", "percent", null),
  def("ER.H2O.INTR.PC", "Renewable water available per person", "m³ per person", "NATURE", "number", true),
  def("EG.FEC.RNEW.ZS", "Renewable energy use", "% of final energy consumption", "NATURE", "percent", true, true),
  def("EG.ELC.RNEW.ZS", "Electricity from renewables", "% of total", "NATURE", "percent", true),
  def("EG.ELC.FOSL.ZS", "Electricity from fossil fuels", "% of total", "NATURE", "percent", false),
  def("EG.ELC.NUCL.ZS", "Electricity from nuclear power", "% of total", "NATURE", "percent", null),
  def("EG.IMP.CONS.ZS", "Energy imported (net)", "% of energy use", "NATURE", "percent", null),

  // ---------------------------------------------------------------- STATE
  def("MS.MIL.XPND.GD.ZS", "Military spending", "% of GDP", "STATE", "percent", null, true),
  def("MS.MIL.XPND.CD", "Military spending", "current US$", "STATE", "currency", null),
  def("MS.MIL.XPND.ZS", "Military spending", "% of government spending", "STATE", "percent", null),
  def("MS.MIL.TOTL.P1", "Armed forces personnel", "people", "STATE", "number", null),
  def("MS.MIL.TOTL.TF.ZS", "Armed forces", "% of labour force", "STATE", "percent", null),
  def("GC.TAX.TOTL.GD.ZS", "Tax revenue", "% of GDP", "STATE", "percent", null),
  def("VC.IHR.PSRC.P5", "Homicides", "per 100,000 people", "STATE", "number", false),
];

export const INDICATORS_BY_CODE: Readonly<Record<string, IndicatorDef>> =
  Object.freeze(
    Object.fromEntries(INDICATORS.map((i) => [i.code, i] as const))
  );

export const CHART_INDICATOR_CODES: readonly string[] = INDICATORS.filter(
  (i) => i.chart
).map((i) => i.code);

export function indicatorsBySection(section: AtlasSection): IndicatorDef[] {
  return INDICATORS.filter((i) => i.section === section);
}

export const ALL_INDICATOR_CODES: readonly string[] = INDICATORS.map(
  (i) => i.code
);
