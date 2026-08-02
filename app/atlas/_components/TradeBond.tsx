import type { TradePartner, TradeSummary, SourceResult } from '@/lib/atlas/types'
import { countryInk } from '@/lib/atlas/ink'
import { formatValue, formatYear } from '@/lib/atlas/format'
import styles from './compare.module.css'

export interface TradeBondProps {
  trade: SourceResult<TradeSummary>
  countryName: string
}

const VISIBLE_PARTNERS = 8

/**
 * Comtrade always joins a real partner's numeric M49 code against
 * lib/atlas/iso-countries.ts before this component ever sees it (see
 * lib/atlas/sources/comtrade.ts), but the join can still miss — some
 * M49 codes are aggregates or territories the local ISO table does not
 * carry. That case must never leak a bare number onto the page (§3.6),
 * so any partner without a resolved iso3 renders as "Other" here,
 * overriding whatever fallback string the source client produced.
 */
function partnerLabel(partner: TradePartner): string {
  return partner.iso3 ? partner.name : 'Other'
}

/** The Comtrade "World" aggregate row carries each partner's true share
 * of total trade — back the reporter's total out of that instead of
 * summing only the top-15 partners the client keeps, which would
 * understate it. Falls back to the partial sum when no partner has a
 * usable share (e.g. the aggregate row was itself missing). */
function impliedTotal(partners: readonly TradePartner[]): number {
  for (const p of partners) {
    if (p.share && p.share > 0) return p.value / p.share
  }
  return partners.reduce((sum, p) => sum + p.value, 0)
}

interface PartnerColumnProps {
  title: string
  partners: readonly TradePartner[]
  year: string | null
}

function PartnerColumn({ title, partners, year }: PartnerColumnProps) {
  if (partners.length === 0) {
    return (
      <div className={styles.bondColumn}>
        <div className="atlas-label">{title}</div>
        <p className={`atlas-serial ${styles.bondEmpty}`}>No partners on record</p>
      </div>
    )
  }

  const visible = partners.slice(0, VISIBLE_PARTNERS)
  const hidden = partners.slice(VISIBLE_PARTNERS)

  const row = (p: TradePartner, i: number, cascade?: number) => {
    const ink = p.iso3 ? countryInk(p.iso3) : null
    const style = cascade !== undefined ? { ['--atlas-cascade-i' as string]: cascade } : undefined
    return (
      <li key={`${p.iso3 ?? 'other'}-${i}`} className={styles.bondRow} style={style}>
        <span
          aria-hidden="true"
          className={styles.bondSeal}
          style={{ background: ink ? ink.hex : 'var(--note-seal)' }}
        />
        <span className={styles.bondPartnerName}>{partnerLabel(p)}</span>
        <span className={`atlas-denomination ${styles.bondValue}`}>{formatValue(p.value, 'currency')}</span>
      </li>
    )
  }

  return (
    <div className={styles.bondColumn}>
      <div className={styles.bondColumnHeader}>
        <span className="atlas-label">{title}</span>
        {year && <span className="atlas-serial">as of {formatYear(Number(year))}</span>}
      </div>

      <ul className={styles.bondLedger}>{visible.map((p, i) => row(p, i))}</ul>

      {hidden.length > 0 && (
        <details className={styles.bondIssue}>
          <summary className={styles.bondIssueSummary}>▸ ISSUE {hidden.length} MORE</summary>
          <ul className={`${styles.bondLedger} atlas-cascade`}>
            {hidden.map((p, i) => row(p, i, i))}
          </ul>
        </details>
      )}
    </div>
  )
}

/**
 * "Trade is a bearer bond" (spec §4.2.5) — two engraved columns of
 * partners, each a small seal plus a ruled ledger value, and the trade
 * balance struck at the bottom: ember when the reporter exports more
 * than it imports, the security-thread teal when it imports more.
 * Never fabricates a total when Comtrade has nothing for this country —
 * that composed empty state is designed first, not bolted on.
 */
export function TradeBond({ trade, countryName }: TradeBondProps) {
  if (!trade.ok) {
    return (
      <section className={`atlas-note ${styles.bond}`} aria-label="Trade">
        <div className="atlas-section-rule">— TRADE —</div>
        <p className={`atlas-body ${styles.bondEmpty}`}>
          No trade data available for {countryName}.
        </p>
      </section>
    )
  }

  const { exports, imports, year } = trade.data

  if (year === null || (exports.length === 0 && imports.length === 0)) {
    return (
      <section className={`atlas-note ${styles.bond}`} aria-label="Trade">
        <div className="atlas-section-rule">— TRADE —</div>
        <p className={`atlas-body ${styles.bondEmpty}`}>
          {countryName} has no export or import data on record with UN Comtrade. That is normal —
          many small or non-reporting states carry nothing here.
        </p>
      </section>
    )
  }

  const totalExports = impliedTotal(exports)
  const totalImports = impliedTotal(imports)
  const balance = totalExports - totalImports
  const balancePositive = balance >= 0

  return (
    <section className={`atlas-note ${styles.bond}`} aria-label="Trade">
      <div className="atlas-section-rule">— TRADE —</div>

      <div className={styles.bondColumns}>
        <PartnerColumn title="Exports to" partners={exports} year={year} />
        <span className={`atlas-perforated-v ${styles.bondDivider}`} aria-hidden="true" />
        <PartnerColumn title="Imports from" partners={imports} year={year} />
      </div>

      <div className={styles.bondBalance}>
        <span className="atlas-label">Trade balance, {formatYear(Number(year))}</span>
        <span
          className="atlas-denomination"
          style={{ color: balancePositive ? 'var(--note-ember)' : 'var(--note-thread)' }}
        >
          {balancePositive ? '+' : ''}
          {formatValue(balance, 'currency')}
        </span>
      </div>
    </section>
  )
}
