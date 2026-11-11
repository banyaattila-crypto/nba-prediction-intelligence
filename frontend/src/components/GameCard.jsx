import React from 'react'
import { Clock, TrendingUp, ChevronRight, Zap, Flame, ShieldAlert, Sparkles } from 'lucide-react'

export default function GameCard({ game, onSelectGame, topPick }) {
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
  
  // Calculate approximate win probability estimation for battle bar
  const homeWinEst = game.odds?.moneyline_home && game.odds?.moneyline_away
    ? Math.round(( (1 / game.odds.moneyline_home) / ((1 / game.odds.moneyline_home) + (1 / game.odds.moneyline_away)) ) * 100)
    : 52
  const awayWinEst = 100 - homeWinEst

  const hasHighEdge = topPick && topPick.edge >= 3.0

  return (
    <div 
      onClick={() => onSelectGame(game)}
      className="group relative glass-card rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Background ambient subtle glow on hover */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all duration-500" />

      {/* Top Bar: Time, Arena & Top Value Tag */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center space-x-2">
          {isLive ? (
            <span className="flex items-center space-x-1.5 text-xs font-bold font-mono text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 animate-pulse shadow-glow-rose">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>ÉLŐ {game.period ? `Q${game.period}` : ''} {game.clock ? `· ${game.clock}` : ''}</span>
            </span>
          ) : isFinal ? (
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-dark-900 px-3 py-1 rounded-full border border-white/[0.05]">
              VÉGEREDMÉNY
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatGameTime(game.date)} CET</span>
            </span>
          )}
          <span className="text-[11px] text-slate-400 truncate max-w-[130px] hidden sm:inline">
            {game.venue || 'NBA Arena'}
          </span>
        </div>

        {topPick && (
          <span className={`inline-flex items-center space-x-1 text-xs font-black font-mono px-2.5 py-1 rounded-lg shadow-sm ${
            hasHighEdge
              ? 'neon-pill-emerald shadow-glow-emerald animate-pulse-subtle'
              : 'neon-pill-cyan'
          }`}>
            <Flame className="w-3.5 h-3.5" />
            <span>+{topPick.edge}% {topPick.verdict === 'STRONG_VALUE' ? 'HIGH EV' : 'EDGE'}</span>
          </span>
        )}
      </div>

      {/* Teams Grid Showdown */}
      <div className="space-y-3.5 relative z-10">
        
        {/* Away Team */}
        <div className="flex items-center justify-between p-2 rounded-xl group-hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-dark-900/90 p-1.5 border border-white/[0.08] shadow-inner flex items-center justify-center">
                <img 
                  src={game.away_team.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
                  alt={game.away_team.display_name} 
                  className="w-8 h-8 object-contain transition-transform group-hover:scale-110 duration-200"
                  onError={(e) => { e.target.src = "https://a.espncdn.com/i/teamlogos/nba/500/nba.png" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-white text-base tracking-tight group-hover:text-cyan-300 transition-colors">
                  {game.away_team.display_name}
                </span>
                <span className="text-xs font-mono font-medium text-slate-400">
                  {game.away_team.record}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 mt-0.5">
                <span>ORtg <strong className="text-slate-300">{game.away_team.ortg}</strong></span>
                <span>·</span>
                <span>DRtg <strong className="text-slate-300">{game.away_team.drtg}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            {isLive || isFinal ? (
              <span className="text-2xl font-black font-mono text-white tracking-tight">{game.away_score ?? '-'}</span>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-slate-300 bg-dark-900/80 px-2 py-0.5 rounded border border-white/[0.06]">
                  ML: {game.odds?.moneyline_away ? game.odds.moneyline_away.toFixed(2) : '-'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Win Probability Battle Gauge */}
        <div className="px-2">
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
            <span className="text-indigo-400">{game.away_team.abbreviation} {awayWinEst}%</span>
            <span className="text-cyan-400">{homeWinEst}% {game.home_team.abbreviation}</span>
          </div>
          <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden flex p-0.5 border border-white/[0.06]">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-l-full transition-all duration-500" 
              style={{ width: `${awayWinEst}%` }} 
            />
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-r-full transition-all duration-500" 
              style={{ width: `${homeWinEst}%` }} 
            />
          </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between p-2 rounded-xl group-hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-dark-900/90 p-1.5 border border-white/[0.08] shadow-inner flex items-center justify-center">
                <img 
                  src={game.home_team.logo || "https://a.espncdn.com/i/teamlogos/nba/500/nba.png"} 
                  alt={game.home_team.display_name} 
                  className="w-8 h-8 object-contain transition-transform group-hover:scale-110 duration-200"
                  onError={(e) => { e.target.src = "https://a.espncdn.com/i/teamlogos/nba/500/nba.png" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-white text-base tracking-tight group-hover:text-cyan-300 transition-colors">
                  {game.home_team.display_name}
                </span>
                <span className="text-xs font-mono font-medium text-slate-400">
                  {game.home_team.record}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 mt-0.5">
                <span>ORtg <strong className="text-slate-300">{game.home_team.ortg}</strong></span>
                <span>·</span>
                <span>DRtg <strong className="text-slate-300">{game.home_team.drtg}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            {isLive || isFinal ? (
              <span className="text-2xl font-black font-mono text-white tracking-tight">{game.home_score ?? '-'}</span>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-slate-300 bg-dark-900/80 px-2 py-0.5 rounded border border-white/[0.06]">
                  ML: {game.odds?.moneyline_home ? game.odds.moneyline_home.toFixed(2) : '-'}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Market Lines & Projections Footer */}
      <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center space-x-2 font-mono">
          {game.odds?.spread !== undefined && (
            <span className="bg-dark-900/90 border border-white/[0.08] px-2.5 py-1 rounded-lg text-slate-300 text-[11px]">
              Spread <strong className="text-cyan-400">{game.odds.spread > 0 ? `+${game.odds.spread}` : game.odds.spread}</strong>
            </span>
          )}
          {game.odds?.over_under && (
            <span className="bg-dark-900/90 border border-white/[0.08] px-2.5 py-1 rounded-lg text-slate-300 text-[11px]">
              O/U <strong className="text-amber-400">{game.odds.over_under}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-cyan-400 group-hover:text-cyan-300 font-bold text-xs">
          <span>Kvantitatív Elemzés</span>
          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}
