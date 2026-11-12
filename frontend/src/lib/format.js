// Magyar számformázás (tizedesvessző) és a megjelenítés közös szótárai.

const formatters = {}
const nf = (d) => (formatters[d] ??= new Intl.NumberFormat('hu-HU', { minimumFractionDigits: d, maximumFractionDigits: d }))

const missing = (v) => v === null || v === undefined || Number.isNaN(v)

export const num = (v, d = 1) => (missing(v) ? '—' : nf(d).format(v))

// Előjeles szám valódi mínuszjellel: +3,2 / −1,0 / 0,0
export const signed = (v, d = 1) => {
  if (missing(v)) return '—'
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return sign + nf(d).format(Math.abs(v))
}

// 0..1 valószínűségből százalék
export const pct = (p, d = 1) => (missing(p) ? '—' : `${nf(d).format(p * 100)}%`)

export const gameTime = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Időpont nincs'
  return d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' })
}

export const MARKET_LABEL = {
  MONEYLINE: 'Győztes',
  SPREAD: 'Hendikep',
  TOTAL_OVER: 'Over',
  TOTAL_UNDER: 'Under',
}

// A modell és a piac eltérését írják le, nem bizonyított előnyt (lásd Napló fül).
export const VERDICT_LABEL = {
  STRONG_VALUE: 'Nagy eltérés',
  VALUE: 'Eltérés',
  PASS: 'Nincs eltérés',
}

export const isFlagged = (pick) => pick.verdict !== 'PASS'
