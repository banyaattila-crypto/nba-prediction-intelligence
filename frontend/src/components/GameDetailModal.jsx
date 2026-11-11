import React, { useState } from 'react'
import { X, TrendingUp, AlertTriangle, ShieldCheck, Flame, BarChart2, Activity, Check, Info } from 'lucide-react'

export default function GameDetailModal({ analysis, onClose, onTrackPick }) {
  if (!analysis) return null

  const { game, simulation, picks, key_factors } = analysis
  const [trackedId, setTrackedId] = useState(null)

  const handleTrack = (pick) => {
    onTrackPick(pick)
    setTrackedId(pick.id)
    setTimeout(() => setTrackedId(null), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs uppercase tracking-wider font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
              Kvantitatív Elemzés
            </span>
            <h2 className="text-lg font-bold text-white">
              {game.away_team.display_name} @ {game.home_team.display_name}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Key Simulation Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#162036] border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Hazai Győzelem</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {(simulation.home_win_prob * 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-400">10 000 Monte Carlo</span>
            </div>

            <div className="bg-[#162036] border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Vendég Győzelem</span>
              <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                {(simulation.away_win_prob * 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-400">10 000 Monte Carlo</span>
            </div>

            <div className="bg-[#162036] border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Várható Végeredmény</span>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {simulation.expected_home_score} - {simulation.expected_away_score}
              </div>
              <span className="text-[11px] text-slate-400">Margin: {simulation.expected_margin > 0 ? `+${simulation.expected_margin}` : simulation.expected_margin} pont</span>
            </div>

            <div className="bg-[#162036] border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-400 font-medium">Várható Összpont</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {simulation.expected_total}
              </div>
              <span className="text-[11px] text-slate-400">Piac: {game.odds?.over_under || '-'}</span>
            </div>
          </div>

          {/* Key Factors & Intelligence Notes */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-2.5">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Modell Főbb Tényezők & Tempó</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {key_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start space-x-2 bg-[#121b2d] px-3 py-2 rounded-lg border border-slate-800/80">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Monte Carlo Total Score Probability Distribution */}
          <div className="bg-[#131d31] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Monte Carlo Összpontszám Valószínűségi Eloszlás</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">N=10 000 szimuláció</span>
            </div>

            <div className="space-y-2">
              {simulation.total_distribution.slice(0, 8).map((bucket, i) => (
                <div key={i} className="flex items-center text-xs">
                  <span className="w-20 font-mono text-slate-400 text-right pr-3">{bucket.range}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden relative">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, bucket.pct * 4)}%` }}
                    />
                  </div>
                  <span className="w-16 font-mono text-slate-300 text-right pl-3 font-semibold">{bucket.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Injury Reports Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Away Team Injuries */}
            <div className="bg-[#121b2d] border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span>{game.away_team.abbreviation} Sérülésjelentés</span>
                <span className="text-slate-400 font-normal">({game.injuries_away.length})</span>
              </h4>
              {game.injuries_away.length === 0 ? (
                <p className="text-xs text-emerald-400 font-medium">Nincs jelentett sérült (teljes keret)</p>
              ) : (
                <div className="space-y-2">
                  {game.injuries_away.map((inj, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="font-semibold text-white">{inj.player_name}</span>
                        {inj.detail && <p className="text-[11px] text-slate-400">{inj.detail}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inj.status.toUpperCase().includes('OUT') 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {inj.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Home Team Injuries */}
            <div className="bg-[#121b2d] border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <span>{game.home_team.abbreviation} Sérülésjelentés</span>
                <span className="text-slate-400 font-normal">({game.injuries_home.length})</span>
              </h4>
              {game.injuries_home.length === 0 ? (
                <p className="text-xs text-emerald-400 font-medium">Nincs jelentett sérült (teljes keret)</p>
              ) : (
                <div className="space-y-2">
                  {game.injuries_home.map((inj, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="font-semibold text-white">{inj.player_name}</span>
                        {inj.detail && <p className="text-[11px] text-slate-400">{inj.detail}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inj.status.toUpperCase().includes('OUT') 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {inj.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Evaluated Betting Markets & Recommendations */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Értékelt Piacok és Matematikai Érték (EV)</h3>
            </div>

            <div className="space-y-3">
              {picks.map((pick) => {
                const isValue = pick.verdict === 'STRONG_VALUE' || pick.verdict === 'VALUE'
                return (
                  <div 
                    key={pick.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isValue 
                        ? 'bg-[#15233e] border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
                        : 'bg-[#10182b] border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {pick.market}
                        </span>
                        <span className="font-bold text-white text-sm sm:text-base">{pick.selection}</span>
                        <span className="text-xs font-mono font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          Odds: {pick.bookmaker_odds.toFixed(2)} ({pick.bookmaker})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isValue ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>+{pick.edge}% EDGE (EV: +{pick.ev}%)</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Nincs ajánlható él (Pass)
                          </span>
                        )}

                        {isValue && (
                          <button
                            onClick={() => handleTrack(pick)}
                            className="text-xs font-semibold px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition flex items-center space-x-1"
                          >
                            {trackedId === pick.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Követve</span>
                              </>
                            ) : (
                              <span>Követés</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats comparison row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg mb-2">
                      <div>Modell Esély: <strong className="text-white">{(pick.model_prob * 100).toFixed(1)}%</strong></div>
                      <div>Fair Odds: <strong className="text-white">{(1 / pick.fair_implied_prob).toFixed(2)}</strong></div>
                      <div>Kelly Tét: <strong className="text-white">{pick.kelly_stake > 0 ? `${pick.kelly_stake} Unit` : '0'}</strong></div>
                      <div>Bizonytalanság: <strong className="text-white">{(pick.uncertainty * 100).toFixed(0)}%</strong></div>
                    </div>

                    {/* Reasoning list */}
                    <ul className="text-xs text-slate-300 space-y-1 pl-1">
                      {pick.reasoning.map((r, ri) => (
                        <li key={ri} className="flex items-center space-x-1.5">
                          <span className="text-slate-400">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
