import React, { useState } from 'react'
import { Trophy, ChevronUp, ChevronDown, Activity, Sparkles } from 'lucide-react'

export default function StandingsView({ teams }) {
  const [sortBy, setSortBy] = useState('wins')

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === 'wins') return b.wins - a.wins
    if (sortBy === 'ortg') return b.ortg - a.ortg
    if (sortBy === 'drtg') return a.drtg - b.drtg // lower DRtg is better
    if (sortBy === 'pace') return b.pace - a.pace
    if (sortBy === 'net') return (b.ortg - b.drtg) - (a.ortg - a.drtg)
    return b.wins - a.wins
  })

  return (
    <div className="space-y-6">
      
      {/* Top Bar with sort controls */}
      <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 shadow-glass">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-white">
              NBA Csapatstatisztikák & Hatékonysági Mátrix
            </h3>
            <p className="text-xs text-slate-400">
              30 NBA csapat haladó statisztikái 100 birtoklásra normálva
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 pr-2">Rendezés:</span>
          {[
            { id: 'wins', label: 'Győzelmek' },
            { id: 'net', label: 'Net Rating' },
            { id: 'ortg', label: 'Támadó (ORtg)' },
            { id: 'drtg', label: 'Védekező (DRtg)' },
            { id: 'pace', label: 'Tempó (Pace)' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                sortBy === s.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-glow-cyan'
                  : 'bg-dark-900 text-slate-400 hover:text-white border border-white/[0.05]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="glass-card rounded-3xl border border-white/[0.08] overflow-hidden shadow-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-dark-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="py-3.5 px-4 text-center font-bold">#</th>
                <th className="py-3.5 px-4 font-bold">Csapat</th>
                <th className="py-3.5 px-4 text-center font-bold">Mérleg (W-L)</th>
                <th className="py-3.5 px-4 text-right font-bold">PPG</th>
                <th className="py-3.5 px-4 text-right font-bold">Opp PPG</th>
                <th className="py-3.5 px-4 text-right font-bold">Diff</th>
                <th className="py-3.5 px-4 text-right font-bold">ORtg</th>
                <th className="py-3.5 px-4 text-right font-bold">DRtg</th>
                <th className="py-3.5 px-4 text-right font-bold">Net Rating</th>
                <th className="py-3.5 px-4 text-right font-bold">Pace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-200">
              {sortedTeams.map((t, idx) => {
                const diff = (t.points_per_game - t.points_allowed_per_game).toFixed(1)
                const netRtg = (t.ortg - t.drtg).toFixed(1)
                const isPositive = Number(netRtg) > 0

                return (
                  <tr key={t.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-dark-900 p-1 border border-white/[0.06] flex items-center justify-center">
                          <img 
                            src={t.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
                            alt={t.display_name} 
                            className="w-6 h-6 object-contain"
                            onError={(e) => { e.target.src = "https://a.espncdn.com/i/teamlogos/nba/500/nba.png" }}
                          />
                        </div>
                        <div>
                          <span className="font-display font-bold text-white text-sm block">
                            {t.display_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.abbreviation}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white font-mono">{t.record}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-mono">{t.points_per_game}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono">{t.points_allowed_per_game}</td>
                    <td className={`py-3.5 px-4 text-right font-bold font-mono ${Number(diff) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Number(diff) > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="py-3.5 px-4 text-right text-cyan-400 font-bold font-mono">{t.ortg}</td>
                    <td className="py-3.5 px-4 text-right text-indigo-400 font-bold font-mono">{t.drtg}</td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                        isPositive 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isPositive ? `+${netRtg}` : netRtg}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-amber-400 font-bold font-mono">{t.pace}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
