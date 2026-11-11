import React, { useState } from 'react'
import { Filter, TrendingUp, ShieldCheck, Flame, Check, HelpCircle, AlertCircle } from 'lucide-react'

export default function PicksView({ picks, onTrackPick }) {
  const [marketFilter, setMarketFilter] = useState('ALL')
  const [minEdge, setMinEdge] = useState(0)
  const [onlyValue, setOnlyValue] = useState(true)
  const [trackedIds, setTrackedIds] = useState(new Set())

  const handleTrack = (pick) => {
    onTrackPick(pick)
    setTrackedIds(prev => new Set(prev).add(pick.id))
  }

  const filteredPicks = picks.filter(p => {
    if (onlyValue && p.verdict === 'PASS') return false
    if (marketFilter !== 'ALL' && p.market !== marketFilter) return false
    if (p.edge < minEdge) return false
    return true
  })

  return (
    <div className="space-y-6">
      
      {/* Filters Ribbon */}
      <div className="bg-[#11192e] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Piac Szűrő:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'Mind' },
              { id: 'SPREAD', label: 'Spread (Hendikep)' },
              { id: 'MONEYLINE', label: 'Győztes (ML)' },
              { id: 'TOTAL_OVER', label: 'Over' },
              { id: 'TOTAL_UNDER', label: 'Under' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMarketFilter(m.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                  marketFilter === m.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Edge Threshold & Value Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Min. Előny:</span>
            <select
              value={minEdge}
              onChange={(e) => setMinEdge(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="0">Összes (0%+)</option>
              <option value="2">Min. +2.0% Edge</option>
              <option value="4">Min. +4.0% Edge</option>
              <option value="6">Min. +6.0% Edge</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-300">
            <input
              type="checkbox"
              checked={onlyValue}
              onChange={(e) => setOnlyValue(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 focus:ring-blue-500"
            />
            <span>Csak +EV Érték</span>
          </label>
        </div>
      </div>

      {/* Picks Count & Notification */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Találatok: <strong className="text-white">{filteredPicks.length}</strong> elemzett lehetőség</span>
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Vig-mentesített matematikai valószínűségek alapján</span>
        </span>
      </div>

      {/* Empty State */}
      {filteredPicks.length === 0 && (
        <div className="bg-[#11192e] border border-slate-800 rounded-2xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Nincs ajánlható tipp a kiválasztott szűrőkkel</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            A rendszer szigorú kvantitatív küszöböt alkalmaz: ha a bukmékeri odds kellően hatékony, nem javaslunk véletlenszerű fogadást.
          </p>
        </div>
      )}

      {/* Picks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPicks.map((pick) => {
          const isValue = pick.verdict === 'STRONG_VALUE' || pick.verdict === 'VALUE'
          const isTracked = trackedIds.has(pick.id)
          return (
            <div
              key={pick.id}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isValue
                  ? 'bg-[#121c33] border-blue-500/30 hover:border-blue-400 shadow-xl shadow-blue-950/20'
                  : 'bg-[#101728] border-slate-800/80 opacity-75'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {pick.game_matchup}
                </span>

                <div className="flex items-center space-x-1.5">
                  {isValue ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{pick.edge}% EDGE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      PASS (0 Él)
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pick.confidence === 'HIGH' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    pick.confidence === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {pick.confidence} BIZALOM
                  </span>
                </div>
              </div>

              {/* Selection & Bookmaker Odds */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[11px] font-mono font-semibold uppercase text-slate-400">{pick.market}</span>
                  <h3 className="text-lg font-extrabold text-white">{pick.selection}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black font-mono text-blue-400">
                    {pick.bookmaker_odds.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-400">{pick.bookmaker}</span>
                </div>
              </div>

              {/* Quantitative Metrics Bar */}
              <div className="grid grid-cols-4 gap-2 bg-[#0d1424] p-2.5 rounded-xl border border-slate-800/80 text-center font-mono text-xs mb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">Modell</span>
                  <span className="font-bold text-white">{(pick.model_prob * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Fair Odds</span>
                  <span className="font-bold text-emerald-400">{(1 / pick.fair_implied_prob).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Várható (EV)</span>
                  <span className={`font-bold ${pick.ev > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {pick.ev > 0 ? `+${pick.ev}%` : `${pick.ev}%`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Kelly Tét</span>
                  <span className="font-bold text-amber-400">{pick.kelly_stake > 0 ? `${pick.kelly_stake}u` : '-'}</span>
                </div>
              </div>

              {/* Rationale Bullet Points */}
              <ul className="text-xs text-slate-300 space-y-1 mb-4 pl-1">
                {pick.reasoning.map((r, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {isValue && (
                <button
                  onClick={() => handleTrack(pick)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    isTracked
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                  }`}
                >
                  {isTracked ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Rögzítve a Szimulált Bankrollhoz</span>
                    </>
                  ) : (
                    <span>Hozzáadás a Követett Portfólióhoz (Paper Trade)</span>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
