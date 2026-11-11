import React, { useState } from 'react'
import { Filter, TrendingUp, ShieldCheck, Flame, Check, HelpCircle, AlertCircle, Sparkles, SlidersHorizontal } from 'lucide-react'

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
      
      {/* High-Tech Terminal Filter Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] shadow-glass flex flex-wrap items-center justify-between gap-4">
        
        {/* Markets Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-300 pr-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>PIAC:</span>
          </div>

          {[
            { id: 'ALL', label: 'Összes Piac' },
            { id: 'SPREAD', label: 'Spread (Hendikep)' },
            { id: 'MONEYLINE', label: 'Győztes (ML)' },
            { id: 'TOTAL_OVER', label: 'Total Over' },
            { id: 'TOTAL_UNDER', label: 'Total Under' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMarketFilter(m.id)}
              className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl transition-all duration-200 ${
                marketFilter === m.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-glow-cyan'
                  : 'bg-dark-900 text-slate-400 hover:text-white border border-white/[0.05] hover:border-white/[0.15]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Quant Thresholds */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-semibold">Min. Él:</span>
            <select
              value={minEdge}
              onChange={(e) => setMinEdge(Number(e.target.value))}
              className="bg-dark-900 border border-white/[0.1] text-xs font-mono font-bold text-cyan-400 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 shadow-inner"
            >
              <option value="0">Összes (0%+)</option>
              <option value="2">Min. +2.0% Edge</option>
              <option value="4">Min. +4.0% Edge</option>
              <option value="6">Min. +6.0% Edge</option>
            </select>
          </div>

          <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-mono font-bold text-slate-300 bg-dark-900/90 px-3.5 py-1.5 rounded-xl border border-white/[0.08]">
            <input
              type="checkbox"
              checked={onlyValue}
              onChange={(e) => setOnlyValue(e.target.checked)}
              className="w-4 h-4 text-cyan-500 rounded bg-dark-950 border-white/[0.1] focus:ring-cyan-500"
            />
            <span>Csak +EV Lehetőségek</span>
          </label>
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>Kvantitatív találatok: <strong className="text-cyan-400 font-bold">{filteredPicks.length}</strong> piaci pozíció</span>
        <span className="flex items-center space-x-1.5 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Vig-mentesített valószínűségi előny</span>
        </span>
      </div>

      {/* Empty State */}
      {filteredPicks.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl bg-dark-900 border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">
            Nincs ajánlható tipp a kiválasztott szűrőkkel
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            A modell szigorú matematikai küszöböt alkalmaz. Ha a bukmékeri odds hatékony és nem kínál kimutatható várható értéket, a tőkevédelmi szabályok miatt a rendszer elkerüli a pozíciót.
          </p>
        </div>
      )}

      {/* Picks Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPicks.map((pick) => {
          const isValue = pick.verdict === 'STRONG_VALUE' || pick.verdict === 'VALUE'
          const isTracked = trackedIds.has(pick.id)
          const isStrong = pick.verdict === 'STRONG_VALUE'

          return (
            <div
              key={pick.id}
              className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                isValue
                  ? 'glass-card border-white/[0.1] hover:border-cyan-500/50 hover:shadow-glow-cyan'
                  : 'bg-dark-900/60 border-white/[0.04] opacity-70'
              }`}
            >
              {/* Top ambient glow */}
              {isValue && (
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              )}

              {/* Header: Matchup & Badges */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06] relative z-10">
                <span className="text-xs font-mono font-bold text-slate-400 tracking-wide">
                  {pick.game_matchup}
                </span>

                <div className="flex items-center space-x-2">
                  {isValue ? (
                    <span className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg flex items-center space-x-1 ${
                      isStrong
                        ? 'neon-pill-emerald shadow-glow-emerald animate-pulse-subtle'
                        : 'neon-pill-cyan'
                    }`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{pick.edge}% EDGE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-dark-950 text-slate-500 border border-white/[0.05]">
                      PASS (0 Él)
                    </span>
                  )}
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg ${
                    pick.confidence === 'HIGH' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' :
                    pick.confidence === 'MEDIUM' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                    'bg-dark-950 text-slate-500'
                  }`}>
                    {pick.confidence}
                  </span>
                </div>
              </div>

              {/* Selection & Bookmaker Odds */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-0.5">
                    {pick.market}
                  </span>
                  <h3 className="font-display font-black text-xl text-white tracking-tight group-hover:text-cyan-200 transition-colors">
                    {pick.selection}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    {pick.bookmaker_odds.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{pick.bookmaker}</span>
                </div>
              </div>

              {/* Quant Metrics Matrix */}
              <div className="grid grid-cols-4 gap-2 bg-dark-950/90 p-3 rounded-xl border border-white/[0.06] text-center font-mono text-xs mb-4 relative z-10">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Modell Esély</span>
                  <strong className="text-white text-sm">{(pick.model_prob * 100).toFixed(1)}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Fair Odds</span>
                  <strong className="text-cyan-400 text-sm">{(1 / pick.fair_implied_prob).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Várható EV</span>
                  <strong className={`text-sm ${pick.ev > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {pick.ev > 0 ? `+${pick.ev}%` : `${pick.ev}%`}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">0.25x Kelly</span>
                  <strong className="text-amber-400 text-sm">{pick.kelly_stake > 0 ? `${pick.kelly_stake}u` : '-'}</strong>
                </div>
              </div>

              {/* Rationale Bullet Points */}
              <ul className="text-xs text-slate-300 space-y-1.5 mb-5 pl-1 relative z-10">
                {pick.reasoning.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-cyan-400 mt-0.5 font-bold">•</span>
                    <span className="font-medium leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {isValue && (
                <button
                  onClick={() => handleTrack(pick)}
                  className={`w-full py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 relative z-10 ${
                    isTracked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                      : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-glow-cyan'
                  }`}
                >
                  {isTracked ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Rögzítve a Szimulált Bankrollhoz</span>
                    </>
                  ) : (
                    <span>Hozzáadás a Szimulált Portfólióhoz (Paper Trade)</span>
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
