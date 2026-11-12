import React from 'react'
import { Mark } from './ui'
import { pct, signed, num } from '../lib/format'

const clamp = (p) => Math.min(1, Math.max(0, p))

/**
 * Ár–modell sáv: a piac vig-mentes valószínűsége (narancs sáv) és a modell becslése (kék rombusz)
 * ugyanazon a 0–100% tengelyen. A köztük levő szakasz az eltérés százalékpontban.
 * market, model: 0..1. A model hiányozhat (még nem töltődött be) – ilyenkor csak a piac látszik.
 */
export default function PriceStrip({ label, market, model }) {
  const m = clamp(market)
  const p = model === null || model === undefined ? null : clamp(model)
  const gap = p === null ? null : (p - m) * 100
  const lo = p === null ? m : Math.min(m, p)
  const hi = p === null ? m : Math.max(m, p)

  const description =
    p === null
      ? `${label}: piac ${pct(m)}, a modell becslése még nem érhető el`
      : `${label}: piac ${pct(m)}, modell ${pct(p)}, eltérés ${signed(gap)} százalékpont`

  return (
    <figure className="m-0" aria-label={description}>
      <div className="flex items-baseline justify-between gap-3">
        <figcaption className="text-xs font-semibold">{label}</figcaption>
        {gap !== null && (
          <span className="tnum font-mono text-sm font-semibold" title="Modell mínusz piac, százalékpontban">
            {signed(gap)} pp
          </span>
        )}
      </div>

      <div className="relative mt-1.5 h-7" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        {[25, 50, 75].map((t) => (
          <span key={t} className="absolute top-[35%] h-[30%] w-px bg-line" style={{ left: `${t}%` }} />
        ))}
        {p !== null && <div className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-ink/60" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />}
        <span className="absolute top-0 h-full w-[4px] -translate-x-1/2 rounded-sm bg-market" style={{ left: `${m * 100}%` }} />
        {p !== null && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-paper bg-model" style={{ left: `${p * 100}%` }} />}
      </div>

      <div className="mt-1 flex justify-between font-mono text-[11px] text-mute">
        <span className="tnum">
          <Mark kind="market" /> Piac {num(m * 100, 1)}%
        </span>
        <span className="tnum">
          {p === null ? 'Modell: nincs adat' : `Modell ${num(p * 100, 1)}%`} <Mark kind="model" />
        </span>
      </div>
    </figure>
  )
}
