import React from 'react'
import { num } from '../lib/format'

// A napló állapota egy mondatban és egy mérőn. Az adatból épül: nincs benne előre megírt minősítés.
export default function Evidence({ performance, onOpenLedger }) {
  if (!performance) return null
  const done = performance.completed_picks
  const need = performance.min_reliable_sample
  const ok = performance.reliable_sample
  const ratio = Math.min(1, done / need)

  return (
    <aside className={`panel flex flex-wrap items-center gap-x-6 gap-y-3 p-4 ${ok ? '' : 'hatch'}`} aria-label="A modell bizonyítottsága">
      <div className="min-w-[14rem] flex-1">
        <p className="font-semibold">{ok ? 'A napló már értelmezhető mintát tartalmaz.' : 'A modell előnye még nem bizonyított.'}</p>
        <p className="mt-0.5 text-sm text-mute">
          {ok
            ? `${done} lezárt tipp van a naplóban. A hendikep- és total-szorzók becsültek, ezt az értékelésnél vedd figyelembe.`
            : `A naplóban ${done} lezárt tipp van. Az értelmezhető értékeléshez legalább ${need} kell, addig az eltérések csak a modell és a piac különbségei.`}
        </p>
      </div>
      <div className="w-full sm:w-56">
        <div className="flex justify-between font-mono text-[11px] text-mute">
          <span>Lezárt tipp</span>
          <span className="tnum">
            {num(done, 0)} / {num(need, 0)}
          </span>
        </div>
        <div className="mt-1 h-2 rounded-sm bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={Math.min(done, need)} aria-label="Lezárt tippek a szükséges mintából">
          <div className="h-full rounded-sm bg-ink" style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>
      {onOpenLedger && (
        <button type="button" onClick={onOpenLedger} className="btn btn-ghost border-ink">
          Napló megnyitása
        </button>
      )}
    </aside>
  )
}
