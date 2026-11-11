import React, { useState } from 'react'
import { Trophy, ChevronUp, ChevronDown } from 'lucide-react'

export default function StandingsView({ teams }) {
  const [conference, setConference] = useState('ALL') // ALL, EAST, WEST
  const [sortBy, setSortBy] = useState('wins')

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === 'wins') return b.wins - a.wins
    if (sortBy === 'ortg') return b.ortg - a.ortg
    if (sortBy === 'drtg') return a.drtg - b.drtg // lower DRtg is better
    if (sortBy === 'pace') return b.pace - a.pace
    return b.wins - a.wins
  })

  return (
    <div className="space-y-6">
      
      {/* Top Bar with sort controls */}
      <div className="bg-[#11192e] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>NBA Csapatstatisztikák és Hatékonysági Mutatók</span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Rendezés:</span>
          {[
            { id: 'wins', label: 'Győzelmek' },
            { id: 'ortg', label: 'Támadóhatékonyság (ORtg)' },
            { id: 'drtg', label: 'Védekezőhatékonyság (DRtg)' },
            { id: 'pace', label: 'Tempó (Pace)' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                sortBy === s.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b1220] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center">#</th>
                <th className="py-3 px-4">Csapat</th>
                <th className="py-3 px-4 text-center">Mérleg (W-L)</th>
                <th className="py-3 px-4 text-right">PPG</th>
                <th className="py-3 px-4 text-right">Opp PPG</th>
                <th className="py-3 px-4 text-right">Diff</th>
                <th className="py-3 px-4 text-right">ORtg</th>
                <th className="py-3 px-4 text-right">DRtg</th>
                <th className="py-3 px-4 text-right">Net Rtg</th>
                <th className="py-3 px-4 text-right">Pace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {sortedTeams.map((t, idx) => {
                const diff = (t.points_per_game - t.points_allowed_per_game).toFixed(1)
                const netRtg = (t.ortg - t.drtg).toFixed(1)
                return (
                  <tr key={t.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={t.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
                          alt={t.display_name} 
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.target.src = "https://a.espncdn.com/i/teamlogos/nba/500/nba.png" }}
                        />
                        <span className="font-bold text-white text-sm font-sans">{t.display_name}</span>
                        <span className="text-[11px] text-slate-400">({t.abbreviation})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">{t.record}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{t.points_per_game}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{t.points_allowed_per_game}</td>
                    <td className={`py-3 px-4 text-right font-bold ${Number(diff) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Number(diff) > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400 font-bold">{t.ortg}</td>
                    <td className="py-3 px-4 text-right text-indigo-400 font-bold">{t.drtg}</td>
                    <td className={`py-3 px-4 text-right font-bold ${Number(netRtg) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Number(netRtg) > 0 ? `+${netRtg}` : netRtg}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">{t.pace}</td>
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
