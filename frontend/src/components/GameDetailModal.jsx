import React, { useState } from 'react'
import { X, TrendingUp, AlertTriangle, ShieldCheck, Flame, BarChart2, Activity, Check, Info, Zap, Shield, Calendar, ArrowRight } from 'lucide-react'

export default function GameDetailModal({ analysis, onClose, onTrackPick }) {
  if (!analysis) return null

  const { game, simulation, picks, key_factors } = analysis
  const [trackedId, setTrackedId] = useState(null)

  const handleTrack = (pick) => {
    onTrackPick(pick)
    setTrackedId(pick.id)
    setTimeout(() => setTrackedId(null), 2500)
  }

  const homeWinPct = (simulation.home_win_prob * 100).toFixed(1)
  const awayWinPct = (simulation.away_win_prob * 100).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-dark-950 border border-white/[0.12] rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        
        {/* Top Arena Showdown Header */}
        <div className="relative overflow-hidden bg-gradient-to-b from-dark-850 via-dark-900 to-dark-950 p-6 sm:p-8 border-b border-white/[0.08]">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-dark-900/80 hover:bg-dark-800 border border-white/[0.08] transition z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tag */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full shadow-glow-cyan">
              10 000 MONTE CARLO SZIMULÁCIÓ
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {game.venue || 'NBA Arena'}
            </span>
          </div>

          {/* Stadium Faceoff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Away Team */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-900/90 p-2.5 border border-white/[0.1] shadow-glow-blue flex items-center justify-center">
                <img 
                  src={game.away_team.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
                  alt={game.away_team.display_name} 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">Vendég</span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                  {game.away_team.display_name}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {game.away_team.record} · ORtg {game.away_team.ortg}
                </span>
              </div>
            </div>

            {/* Scoreboard Projection Center */}
            <div className="text-center bg-dark-900/90 border border-white/[0.08] p-4 rounded-2xl shadow-inner">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
                Modell Várható Végeredmény
              </span>
              <div className="font-display font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-cyan-300">
                {simulation.expected_away_score} - {simulation.expected_home_score}
              </div>
              <div className="mt-1 flex items-center justify-center space-x-2 text-xs font-mono">
                <span className="text-slate-400">Várható Margin:</span>
                <strong className={simulation.expected_margin > 0 ? 'text-cyan-400' : 'text-indigo-400'}>
                  {simulation.expected_margin > 0 ? `+${simulation.expected_margin}` : simulation.expected_margin} pont
                </strong>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 font-bold">Össz: {simulation.expected_total}</span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-end space-x-4 text-right">
              <div>
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">Hazai</span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                  {game.home_team.display_name}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {game.home_team.record} · ORtg {game.home_team.ortg}
                </span>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-900/90 p-2.5 border border-white/[0.1] shadow-glow-cyan flex items-center justify-center">
                <img 
                  src={game.home_team.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
                  alt={game.home_team.display_name} 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              </div>
            </div>

          </div>

          {/* Win Probability Bar */}
          <div className="mt-6 pt-4 border-t border-white/[0.05]">
            <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
              <span className="text-indigo-400">{game.away_team.abbreviation} Győzelmi Esély: {awayWinPct}%</span>
              <span className="text-cyan-400">Hazai Győzelmi Esély ({game.home_team.abbreviation}): {homeWinPct}%</span>
            </div>
            <div className="w-full bg-dark-950 rounded-full h-3 overflow-hidden flex p-0.5 border border-white/[0.08]">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-l-full transition-all duration-700" 
                style={{ width: `${awayWinPct}%` }} 
              />
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-r-full transition-all duration-700" 
                style={{ width: `${homeWinPct}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">

          {/* Key Matchup Factors & Intelligence Notes */}
          <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
            <div className="flex items-center space-x-2 text-sm font-display font-bold text-slate-200 mb-3">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Kvantitatív Modellező Tényezők & Tempó</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {key_factors.map((factor, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 bg-dark-900/80 p-3 rounded-xl border border-white/[0.04]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-300 font-medium leading-relaxed">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monte Carlo Total Score Probability Histogram */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h4 className="font-display font-bold text-base text-white flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-emerald-400" />
                  <span>Monte Carlo Összpontszám Valószínűségi Sűrűségfüggvény (PDF)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  10 000 futtatás empirikus eloszlása az NBA ligaszórás és tempó-kovariancia alapján
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono bg-dark-900 px-3 py-1.5 rounded-lg border border-white/[0.08] text-amber-300">
                  Piaci Vonal: <strong>{game.odds?.over_under || '225.5'}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {simulation.total_distribution.slice(0, 8).map((bucket, i) => {
                const isPeak = bucket.pct > 18
                return (
                  <div key={i} className="flex items-center text-xs font-mono">
                    <span className="w-24 text-slate-400 text-right pr-4 font-semibold">{bucket.range} pont</span>
                    <div className="flex-1 bg-dark-900/90 rounded-full h-5 overflow-hidden relative border border-white/[0.04]">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${
                          isPeak 
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-glow-emerald' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, bucket.pct * 3.5)}%` }}
                      />
                    </div>
                    <span className={`w-20 text-right pl-3 font-bold ${isPeak ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {bucket.pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Injury Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Away Team Injuries */}
            <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <span className="text-indigo-400">{game.away_team.abbreviation}</span>
                  <span>Sérülésjelentés</span>
                </h4>
                <span className="text-xs font-mono text-slate-500">{game.injuries_away.length} játékos</span>
              </div>

              {game.injuries_away.length === 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400 font-semibold flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Teljes, egészséges rotációs keret</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {game.injuries_away.map((inj, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-dark-900/90 p-2.5 rounded-xl border border-white/[0.05]">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{inj.player_name}</span>
                          {inj.position && <span className="text-[10px] text-slate-400 font-mono">({inj.position})</span>}
                        </div>
                        {inj.detail && <p className="text-[11px] text-slate-400 mt-0.5">{inj.detail}</p>}
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg ${
                        inj.status.toUpperCase().includes('OUT') 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {inj.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Home Team Injuries */}
            <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <span className="text-cyan-400">{game.home_team.abbreviation}</span>
                  <span>Sérülésjelentés</span>
                </h4>
                <span className="text-xs font-mono text-slate-500">{game.injuries_home.length} játékos</span>
              </div>

              {game.injuries_home.length === 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400 font-semibold flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Teljes, egészséges rotációs keret</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {game.injuries_home.map((inj, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-dark-900/90 p-2.5 rounded-xl border border-white/[0.05]">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{inj.player_name}</span>
                          {inj.position && <span className="text-[10px] text-slate-400 font-mono">({inj.position})</span>}
                        </div>
                        {inj.detail && <p className="text-[11px] text-slate-400 mt-0.5">{inj.detail}</p>}
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg ${
                        inj.status.toUpperCase().includes('OUT') 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-extrabold text-lg text-white">
                  Értékelt Piacok és Matematikai Várható Érték (+EV)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Multiplikatív Vig-mentesítés
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {picks.map((pick) => {
                const isValue = pick.verdict === 'STRONG_VALUE' || pick.verdict === 'VALUE'
                return (
                  <div 
                    key={pick.id}
                    className={`p-5 rounded-2xl border transition-all duration-300 ${
                      isValue 
                        ? 'bg-gradient-to-r from-dark-850 to-dark-900 border-emerald-500/40 shadow-glow-emerald' 
                        : 'bg-dark-900/70 border-white/[0.05] opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-dark-950 border border-white/[0.08] text-slate-300">
                          {pick.market}
                        </span>
                        <span className="font-display font-extrabold text-white text-base sm:text-lg">
                          {pick.selection}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                          {pick.bookmaker_odds.toFixed(2)} ({pick.bookmaker})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        {isValue ? (
                          <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1.5 shadow-glow-emerald">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span>+{pick.edge}% EDGE (EV: +{pick.ev}%)</span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-dark-950 text-slate-400 border border-white/[0.05]">
                            Nincs előny (Pass)
                          </span>
                        )}

                        {isValue && (
                          <button
                            onClick={() => handleTrack(pick)}
                            className="text-xs font-bold px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-glow-cyan transition flex items-center space-x-1.5"
                          >
                            {trackedId === pick.id ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-300" />
                                <span>Rögzítve</span>
                              </>
                            ) : (
                              <span>Követés</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats comparison row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-dark-950/80 p-3 rounded-xl border border-white/[0.05] mb-3">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Modell Esély:</span>
                        <strong className="text-white text-sm">{(pick.model_prob * 100).toFixed(1)}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Vig-mentes Fair Odds:</span>
                        <strong className="text-cyan-400 text-sm">{(1 / pick.fair_implied_prob).toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">0.25x Kelly Tét:</span>
                        <strong className="text-amber-400 text-sm">{pick.kelly_stake > 0 ? `${pick.kelly_stake} Unit` : '0'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Bizonytalansági Index:</span>
                        <strong className="text-slate-300 text-sm">{(pick.uncertainty * 100).toFixed(0)}%</strong>
                      </div>
                    </div>

                    {/* Reasoning list */}
                    <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                      {pick.reasoning.map((r, ri) => (
                        <li key={ri} className="flex items-center space-x-2">
                          <span className="text-cyan-400">•</span>
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
