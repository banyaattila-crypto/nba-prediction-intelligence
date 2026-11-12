import React from 'react'
import { ChevronRight } from 'lucide-react'
import PriceStrip from './PriceStrip'
import { Logo, Mark } from './ui'
import { MARKET_LABEL, gameTime, num, signed } from '../lib/format'

function TeamRow({ team, score, price, showScore }) {
  return (
    <div className="flex items-center gap-3">
      <Logo team={team} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xl font-extrabold uppercase leading-none tracking-wide">{team.display_name}</p>
        <p className="tnum mt-1 font-mono text-[11px] text-mute">{team.record}</p>
      </div>
      {showScore ? (
        <p className="tnum font-display text-4xl font-extrabold leading-none">{score ?? '–'}</p>
      ) : (
        <p className="tnum font-mono text-sm font-semibold" title="Moneyline szorzó (ESPN)">
          {price ? (
            <>
              {num(price, 2)} <Mark kind="market" />
            </>
          ) : (
            <span className="text-mute">–</span>
          )}
        </p>
      )}
    </div>
  )
}

// A meccs kártyája. `picks` az adott meccs összes értékelt piaca (üres, amíg a modell nem töltött be).
export default function GameCard({ game, picks = [], onSelect }) {
  const live = game.status === 'in_progress'
  const final = game.status === 'final'
  const o = game.odds

  const homeML = picks.find((p) => p.id === `${game.id}_ML_HOME`)
  // Vig-mentes piaci esély: a modell-sávhoz a backend értékét használjuk, egyébként a szorzókból számolunk.
  let marketHome = homeML?.fair_implied_prob ?? null
  if (marketHome === null && o?.moneyline_home && o?.moneyline_away) {
    const h = 1 / o.moneyline_home
    marketHome = h / (h + 1 / o.moneyline_away)
  }

  const flagged = picks.filter((p) => p.verdict !== 'PASS').sort((a, b) => b.ev - a.ev)[0]

  return (
    <article className="panel fade-in relative flex flex-col gap-4 p-4 transition-colors hover:border-ink sm:p-5">
      <header className="flex items-center justify-between gap-2">
        {live ? (
          <span className="tag border-ink bg-ink text-board">
            Élő · {game.period ? `${game.period}. negyed` : ''} {game.clock}
          </span>
        ) : final ? (
          <span className="tag border-mute/50 text-mute">Végeredmény</span>
        ) : (
          <span className="tnum font-mono text-sm font-semibold">{gameTime(game.date)}</span>
        )}
        {flagged && (
          <span className="tag border-model text-model" title="A modell és a piac legnagyobb eltérése ezen a meccsen">
            <Mark kind="model" /> {MARKET_LABEL[flagged.market]} {signed(flagged.edge, 1)} pp
          </span>
        )}
      </header>

      <div className="space-y-3">
        <TeamRow team={game.away_team} score={game.away_score} price={o?.moneyline_away} showScore={live || final} />
        <TeamRow team={game.home_team} score={game.home_score} price={o?.moneyline_home} showScore={live || final} />
      </div>

      {live || final ? null : marketHome !== null ? (
        <PriceStrip label={`${game.home_team.abbreviation} győzelem`} market={marketHome} model={homeML?.model_prob ?? null} />
      ) : (
        <p className="text-xs text-mute">Ehhez a meccshez nincs piaci ár.</p>
      )}

      <footer className="mt-auto flex items-center justify-between gap-3 border-t pt-3 text-sm">
        <p className="tnum flex flex-wrap gap-x-4 font-mono text-xs text-mute">
          {o?.spread !== null && o?.spread !== undefined && (
            <span>
              Hendikep <strong className="text-ink">{signed(o.spread, 1)}</strong> <Mark kind="source" />
            </span>
          )}
          {o?.over_under && (
            <span>
              Total <strong className="text-ink">{num(o.over_under, 1)}</strong> <Mark kind="source" />
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => onSelect(game)}
          className="inline-flex items-center gap-1 font-semibold after:absolute after:inset-0 after:content-['']"
          aria-label={`Elemzés megnyitása: ${game.away_team.display_name} – ${game.home_team.display_name}`}
        >
          Elemzés <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </footer>
    </article>
  )
}
