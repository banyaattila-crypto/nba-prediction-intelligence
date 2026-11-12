import React from 'react'
import PickCard from './PickCard'
import PriceStrip from './PriceStrip'
import { Dialog, Loading, Logo, Mark, Notice } from './ui'
import { num, signed } from '../lib/format'

function Matchup({ game, simulation }) {
  const { away_team: away, home_team: home } = game
  const homeML = simulation && game.odds?.moneyline_home && game.odds?.moneyline_away
  let marketHome = null
  if (homeML) {
    const h = 1 / game.odds.moneyline_home
    marketHome = h / (h + 1 / game.odds.moneyline_away)
  }
  return (
    <section className="border-b p-5 pt-14 sm:p-8 sm:pt-12">
      <p className="eyebrow mb-4">{game.venue || 'Helyszín nincs megadva'}</p>
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-4">
          <Logo team={away} size={56} />
          <div>
            <p className="eyebrow">Vendég</p>
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide">{away.display_name}</h3>
            <p className="tnum mt-1 font-mono text-xs text-mute">{away.record}</p>
          </div>
        </div>

        {simulation && (
          <div className="text-center">
            <p className="eyebrow mb-1">
              <Mark kind="model" /> Nyers modell szerinti végeredmény
            </p>
            <p className="tnum font-display text-5xl font-extrabold leading-none">
              {num(simulation.expected_away_score, 0)}–{num(simulation.expected_home_score, 0)}
            </p>
            <p className="tnum mt-1 font-mono text-xs text-mute">
              különbség {signed(simulation.expected_margin, 1)} (hazai) · összesen {num(simulation.expected_total, 1)}
            </p>
            {game.status === 'final' && game.away_score != null && (
              <p className="tnum mt-2 font-mono text-xs">
                <Mark kind="source" /> Végeredmény: <strong>{game.away_score}–{game.home_score}</strong>
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 md:flex-row-reverse md:text-right">
          <Logo team={home} size={56} />
          <div>
            <p className="eyebrow">Hazai</p>
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide">{home.display_name}</h3>
            <p className="tnum mt-1 font-mono text-xs text-mute">{home.record}</p>
          </div>
        </div>
      </div>

      {simulation && marketHome !== null && (
        <div className="mt-6 max-w-xl">
          <PriceStrip label={`${home.abbreviation} győzelem (nyers modell)`} market={marketHome} model={simulation.home_win_prob} />
        </div>
      )}
    </section>
  )
}

// A 12 sávos összpontszám-eloszlás; a piaci vonalat tartalmazó sávot narancs jelzi.
function TotalDistribution({ buckets, line }) {
  const parsed = buckets.map((b) => {
    const [lo, hi] = b.range.split('-').map(Number)
    return { ...b, hasLine: line != null && line >= lo && line < hi }
  })
  const max = Math.max(...parsed.map((b) => b.pct), 1)
  return (
    <section aria-labelledby="dist-title">
      <h3 id="dist-title" className="font-display text-2xl font-extrabold uppercase tracking-wide">Összpontszám eloszlása</h3>
      <p className="mb-3 mt-1 text-sm text-mute">
        <Mark kind="model" /> 10 000 szimulált meccs, a szórás a szezon valós eredményeiből kalibrált. {line != null && <>Narancs: a piaci vonal ({num(line, 1)}) sávja <Mark kind="market" />.</>}
      </p>
      <ol className="space-y-1">
        {parsed.map((b) => (
          <li key={b.range} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3 font-mono text-xs">
            <span className="tnum text-right text-mute">{b.range}</span>
            <span className="h-4 rounded-sm bg-line/50">
              <span className={`block h-full rounded-sm ${b.hasLine ? 'bg-market' : 'bg-model'}`} style={{ width: `${(b.pct / max) * 100}%` }} />
            </span>
            <span className="tnum">{num(b.pct, 1)}%</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Injuries({ team, list }) {
  return (
    <section aria-label={`${team.display_name} sérülésjelentés`}>
      <h4 className="mb-2 flex items-baseline justify-between font-semibold">
        <span>{team.display_name}</span>
        <span className="tnum font-mono text-xs font-normal text-mute">{list.length} játékos</span>
      </h4>
      {list.length === 0 ? (
        <p className="text-sm text-mute">Az ESPN nem jelez hiányzót.</p>
      ) : (
        <ul className="divide-y rounded-md border bg-paper">
          {list.map((inj, i) => (
            <li key={`${inj.player_name}-${i}`} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">
                  {inj.player_name} {inj.position && <span className="font-mono text-xs font-normal text-mute">({inj.position})</span>}
                </p>
                {inj.detail && <p className="text-xs text-mute">{inj.detail}</p>}
              </div>
              <span className={`tag shrink-0 ${inj.status.toUpperCase().includes('OUT') ? 'border-ink bg-ink text-board' : 'border-mute/60 text-mute'}`}>{inj.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function GameDetailModal({ detail, onClose, onTrackPick, trackedIds }) {
  const { game, status, analysis, error } = detail
  const title = `${game.away_team.display_name} – ${game.home_team.display_name}`

  return (
    <Dialog title={title} onClose={onClose} wide>
      {status === 'loading' && (
        <div className="p-8 pt-14">
          <Loading>Szimuláció futtatása</Loading>
        </div>
      )}

      {status === 'error' && (
        <div className="p-5 pt-14 sm:p-8 sm:pt-14">
          <Notice tone="error" title="Az elemzés nem tölthető be">
            {error}. Zárd be az ablakot, és próbáld újra a meccs kártyájáról.
          </Notice>
        </div>
      )}

      {status === 'ok' && (
        <>
          <Matchup game={analysis.game} simulation={analysis.simulation} />
          <div className="space-y-10 p-5 sm:p-8">
            <section aria-labelledby="factors-title">
              <h3 id="factors-title" className="font-display text-2xl font-extrabold uppercase tracking-wide">Mit vett figyelembe a modell</h3>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {analysis.key_factors.map((f, i) => (
                  <li key={i} className="panel flex gap-2 p-3">
                    <Mark kind="model" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
            </section>

            <TotalDistribution buckets={analysis.simulation.total_distribution} line={analysis.game.odds?.over_under} />

            <section aria-labelledby="inj-title">
              <h3 id="inj-title" className="font-display text-2xl font-extrabold uppercase tracking-wide">Sérülések</h3>
              <p className="mb-3 mt-1 text-sm text-mute">
                A lista az ESPN-ről jön <Mark kind="source" />. A hatásuk a modellben becsült érték <Mark kind="assumed" />: ismert sztárokra fix lista, a többi játékosra általános alapérték.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <Injuries team={analysis.game.away_team} list={analysis.game.injuries_away} />
                <Injuries team={analysis.game.home_team} list={analysis.game.injuries_home} />
              </div>
            </section>

            <section aria-labelledby="mk-title">
              <h3 id="mk-title" className="font-display text-2xl font-extrabold uppercase tracking-wide">Értékelt piacok</h3>
              <p className="mb-3 mt-1 text-sm text-mute">Az eltérés a kalibrált modell és a piac vig-mentes valószínűségének különbsége. A kalibrált modell a piachoz húzott, a nyers modell külön látszik.</p>
              {analysis.picks.length === 0 ? (
                <Notice tone="empty" title="Ehhez a meccshez nincs piaci ár">
                  Ár nélkül nem értékelhető piac.
                </Notice>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {analysis.picks.map((p) => (
                    <PickCard key={p.id} pick={p} tracked={trackedIds.has(p.id)} onTrack={onTrackPick} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </Dialog>
  )
}
