import React, { useState } from 'react'
import Evidence from './Evidence'
import PickCard from './PickCard'
import { Loading, Notice, SectionHead } from './ui'
import { MARKET_LABEL, isFlagged } from '../lib/format'

const MARKETS = ['ALL', 'MONEYLINE', 'SPREAD', 'TOTAL_OVER', 'TOTAL_UNDER']

export default function PicksView({ picks, performance, trackedIds, onTrackPick, onOpenLedger }) {
  const [market, setMarket] = useState('ALL')
  const [minEdge, setMinEdge] = useState(0)
  const [onlyFlagged, setOnlyFlagged] = useState(true)

  const all = picks.data ?? []
  const shown = all.filter((p) => (!onlyFlagged || isFlagged(p)) && (market === 'ALL' || p.market === market) && p.edge >= minEdge)
  const resetFilters = () => {
    setMarket('ALL')
    setMinEdge(0)
    setOnlyFlagged(false)
  }

  return (
    <section aria-labelledby="picks-title">
      <SectionHead eyebrow="Modell és piac" title={<span id="picks-title">Eltérések</span>} />
      <Evidence performance={performance.data} onOpenLedger={onOpenLedger} />

      <form className="panel mt-5 flex flex-wrap items-end gap-x-6 gap-y-4 p-4" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="min-w-0">
          <legend className="eyebrow mb-1.5">Piac</legend>
          <div className="flex flex-wrap gap-1.5">
            {MARKETS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={market === m}
                onClick={() => setMarket(m)}
                className={`btn !py-1.5 ${market === m ? 'btn-solid' : 'btn-ghost'}`}
              >
                {m === 'ALL' ? 'Mind' : MARKET_LABEL[m]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="eyebrow mb-1.5 block">Legalább ennyi eltérés</span>
          <select value={minEdge} onChange={(e) => setMinEdge(Number(e.target.value))} className="rounded border bg-paper px-3 py-2 text-sm font-semibold">
            <option value={0}>Bármennyi</option>
            <option value={2}>2 százalékpont</option>
            <option value={4}>4 százalékpont</option>
            <option value={6}>6 százalékpont</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm font-semibold">
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} className="h-4 w-4 accent-model" />
          Csak jelzett eltérések
        </label>
      </form>

      <div className="mt-5">
        {picks.status === 'loading' && <Loading>A modell a mai meccseket szimulálja</Loading>}

        {picks.status === 'error' && (
          <Notice
            tone="error"
            title="Az eltérések nem töltődtek be"
            action={
              <button type="button" onClick={picks.reload} className="btn btn-solid">
                Újrapróbálom
              </button>
            }
          >
            {picks.error}. A hiba nem jelenti azt, hogy nincs eltérés.
          </Notice>
        )}

        {picks.status !== 'loading' && picks.status !== 'error' && shown.length === 0 && (
          <Notice
            tone="empty"
            title={all.length === 0 ? 'Ma nincs értékelhető piac' : 'A szűrőknek egy piac sem felel meg'}
            action={
              all.length > 0 && (
                <button type="button" onClick={resetFilters} className="btn btn-ghost border-ink">
                  Szűrők törlése
                </button>
              )
            }
          >
            {all.length === 0 ? 'Az értékeléshez piaci árak kellenek. Ha nincs mai meccs vagy ár, nincs mit összevetni.' : `${all.length} értékelt piac van, de egyik sem teljesíti a beállított feltételeket.`}
          </Notice>
        )}

        <p className="eyebrow mb-3" aria-live="polite">
          {shown.length > 0 && `${shown.length} piac`}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((p) => (
            <PickCard key={p.id} pick={p} tracked={trackedIds.has(p.id)} onTrack={onTrackPick} />
          ))}
        </div>
      </div>
    </section>
  )
}
