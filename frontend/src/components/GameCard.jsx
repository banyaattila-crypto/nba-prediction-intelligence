import React from 'react'
import { Clock, TrendingUp, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react'

export default function GameCard({ game, onSelectGame, topPick }) {
  // Format local kickoff time
  const formatGameTime = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return 'TBD'
    }
  }

  const isLive = game.status === 'in_progress'
  const isFinal = game.status === 'final'

  return (
    <div 
      onClick={() => onSelectGame(game)}
      className="group relative bg-[#11192e] hover:bg-[#16213c] border border-slate-800/90 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-900/10"
    >
      {/* Top Bar: Time / Status & Top Pick Badge */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          {isLive ? (
            <span className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>ÉLŐ {game.period ? `Q${game.period}` : ''} {game.clock || ''}</span>
            </span>
          ) : isFinal ? (
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full">
              VÉGEREDMÉNY
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatGameTime(game.date)} CET</span>
            </span>
          )}
          <span className="text-xs text-slate-400 truncate max-w-[150px]">{game.venue || 'NBA Arena'}</span>
        </div>

        {topPick && (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <TrendingUp className="w-3 h-3" />
            <span>+{topPick.edge}% EDGE</span>
          </span>
        )}
      </div>

      {/* Teams & Scores Grid */}
      <div className="space-y-3">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={game.away_team.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
              alt={game.away_team.display_name} 
              className="w-9 h-9 object-contain"
              onError={(e) => { e.target.src = "https://a.espncdn.com/i/teamlogos/nba/500/nba.png" }}
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                  {game.away_team.display_name}
                </span>
                <span className="text-xs font-mono text-slate-400">({game.away_team.record})</span>
              </div>
              <span className="text-xs text-slate-400">
                ORtg: {game.away_team.ortg} · DRtg: {game.away_team.drtg}
              </span>
            </div>
          </div>
          <div className="text-right">
            {isLive || isFinal ? (
              <span className="text-2xl font-black font-mono text-white">{game.away_score ?? '-'}</span>
            ) : (
              <span className="text-xs font-mono font-medium text-slate-400">
                ML: {game.odds?.moneyline_away ? game.odds.moneyline_away.toFixed(2) : '-'}
              </span>
            )}
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={game.home_team.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
              alt={game.home_team.display_name} 
              className="w-9 h-9 object-contain"
              onError={(e) => { e.target.src = "https://a.espncdn.com/i/teamlogos/nba/500/nba.png" }}
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                  {game.home_team.display_name}
                </span>
                <span className="text-xs font-mono text-slate-400">({game.home_team.record})</span>
              </div>
              <span className="text-xs text-slate-400">
                ORtg: {game.home_team.ortg} · DRtg: {game.home_team.drtg}
              </span>
            </div>
          </div>
          <div className="text-right">
            {isLive || isFinal ? (
              <span className="text-2xl font-black font-mono text-white">{game.home_score ?? '-'}</span>
            ) : (
              <span className="text-xs font-mono font-medium text-slate-400">
                ML: {game.odds?.moneyline_home ? game.odds.moneyline_home.toFixed(2) : '-'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Market Lines & Projections Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-3 font-mono">
          {game.odds?.spread !== undefined && (
            <span className="bg-slate-800/70 px-2 py-0.5 rounded text-slate-300">
              Spread: <strong className="text-white">{game.odds.spread > 0 ? `+${game.odds.spread}` : game.odds.spread}</strong>
            </span>
          )}
          {game.odds?.over_under && (
            <span className="bg-slate-800/70 px-2 py-0.5 rounded text-slate-300">
              O/U: <strong className="text-white">{game.odds.over_under}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-blue-400 group-hover:text-blue-300 font-medium">
          <span>Elemzés</span>
          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  )
}
