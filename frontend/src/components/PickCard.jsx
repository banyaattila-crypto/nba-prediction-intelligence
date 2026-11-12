import React, { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import PriceStrip from './PriceStrip'
import { MARKET_LABEL, VERDICT_LABEL, isFlagged, num, pct, signed } from '../lib/format'

const VERDICT_STYLE = {
  STRONG_VALUE: 'border-ink bg-ink text-board',
  VALUE: 'border-ink text-ink',
  PASS: 'border-dashed border-mute/60 text-mute',
}

function Fact({ term, children, hint }) {
  return (
    <div title={hint}>
      <dt className="eyebrow !text-[10px]">{term}</dt>
      <dd className="tnum mt-0.5 font-mono text-sm font-semibold">{children}</dd>
    </div>
  )
}

// Egy piac értékelése: ár–modell sáv, számok, indoklás, rögzítés. A modalban és az Értéklistán is ez látszik.
export default function PickCard({ pick, tracked, onTrack }) {
  const [busy, setBusy] = useState(false)
  const flagged = isFlagged(pick)
  // Az indulás után rögzített tipp már az eredmény ismeretében születhetne; a szerver is elutasítja.
  const started = new Date(pick.game_date).getTime() <= Date.now()

  const track = async () => {
    setBusy(true)
    try {
      await onTrack(pick)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`panel p-4 sm:p-5 ${flagged ? '' : 'opacity-80'}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">
          {pick.game_matchup} · {MARKET_LABEL[pick.market] ?? pick.market}
        </p>
        <span className={`tag ${VERDICT_STYLE[pick.verdict]}`}>{VERDICT_LABEL[pick.verdict] ?? pick.verdict}</span>
      </header>

      <div className="mt-2 flex items-end justify-between gap-4">
        <h3 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide">{pick.selection}</h3>
        <p className="tnum shrink-0 text-right font-mono text-xl font-semibold">
          {num(pick.bookmaker_odds, 2)}
          <span className="block font-sans text-[11px] font-normal text-mute">{pick.bookmaker}</span>
        </p>
      </div>

      <div className="mt-4">
        <PriceStrip label="Valószínűség" market={pick.fair_implied_prob} model={pick.model_prob} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t pt-3">
        <Fact term="Várható hozam" hint="A modell valószínűsége és a szorzó alapján; csak annyira megbízható, mint a modell.">
          {signed(pick.ev, 1)}%
        </Fact>
        <Fact term="Javasolt tét" hint="Negyed Kelly, egységben; 0 = nincs javaslat">
          {pick.kelly_stake > 0 ? `${num(pick.kelly_stake, 1)} egység` : '—'}
        </Fact>
        <Fact term="Bizonytalanság" hint="Sérülések és játékosállapot miatti bizonytalansági index">
          {pct(pick.uncertainty, 0)}
        </Fact>
      </dl>

      {pick.reasoning?.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold">Indoklás</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-mute">
            {pick.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </details>
      )}

      {flagged && (
        <button type="button" onClick={track} disabled={tracked || busy || started} className={`btn mt-4 w-full ${tracked || started ? 'btn-ghost' : 'btn-solid'}`}>
          {tracked ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" /> Rögzítve a naplóban
            </>
          ) : started ? (
            'A meccs már elkezdődött, nem rögzíthető'
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" /> {busy ? 'Rögzítés…' : 'Rögzítés papírkereskedésként'}
            </>
          )}
        </button>
      )}
    </article>
  )
}
