import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import GameCard from './components/GameCard'
import GameDetailModal from './components/GameDetailModal'
import PicksView from './components/PicksView'
import PerformanceView from './components/PerformanceView'
import StandingsView from './components/StandingsView'
import MethodologyModal from './components/MethodologyModal'
import { Activity, Flame, ShieldAlert, Sparkles, RefreshCw, Zap, TrendingUp, Cpu, Award } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('games')
  const [games, setGames] = useState([])
  const [topPicks, setTopPicks] = useState([])
  const [allPicks, setAllPicks] = useState([])
  const [performance, setPerformance] = useState(null)
  const [history, setHistory] = useState([])
  const [teams, setTeams] = useState([])
  
  const [selectedGameAnalysis, setSelectedGameAnalysis] = useState(null)
  const [showMethodology, setShowMethodology] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const loadData = async () => {
    try {
      setRefreshing(true)
      const [gamesRes, topRes, picksRes, perfRes, histRes, teamsRes] = await Promise.all([
        fetch('/api/games'),
        fetch('/api/picks/top'),
        fetch('/api/picks'),
        fetch('/api/performance'),
        fetch('/api/history'),
        fetch('/api/standings')
      ])

      if (gamesRes.ok) setGames(await gamesRes.json())
      if (topRes.ok) setTopPicks(await topRes.json())
      if (picksRes.ok) setAllPicks(await picksRes.json())
      if (perfRes.ok) setPerformance(await perfRes.json())
      if (histRes.ok) setHistory(await histRes.json())
      if (teamsRes.ok) setTeams(await teamsRes.json())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectGame = async (game) => {
    try {
      const res = await fetch(`/api/games/${game.id}`)
      if (res.ok) {
        const analysis = await res.json()
        setSelectedGameAnalysis(analysis)
      }
    } catch (err) {
      console.error('Error loading game analysis:', err)
    }
  }

  const handleTrackPick = async (pick) => {
    try {
      const res = await fetch('/api/picks/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pick)
      })
      if (res.ok) {
        showToast(`Tipp hozzáadva a követett szimulált bankrollhoz: ${pick.selection}`)
        const histRes = await fetch('/api/history')
        if (histRes.ok) setHistory(await histRes.json())
        const perfRes = await fetch('/api/performance')
        if (perfRes.ok) setPerformance(await perfRes.json())
      }
    } catch (err) {
      console.error('Error tracking pick:', err)
    }
  }

  const liveCount = games.filter(g => g.status === 'in_progress').length
  const bestEdgePick = topPicks.length > 0 ? topPicks[0] : null

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col relative selection:bg-cyan-500 selection:text-black">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-card bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-5 py-3 rounded-2xl shadow-glow-emerald text-xs font-mono font-bold flex items-center space-x-2.5 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenMethodology={() => setShowMethodology(true)}
        liveGamesCount={liveCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        
        {/* Dynamic Quant Hero Strip */}
        <div className="mb-8 glass-panel rounded-3xl p-6 sm:p-7 border border-white/[0.08] relative overflow-hidden shadow-glass">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-radial from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <span className="text-[10px] font-mono font-black tracking-widest uppercase bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2.5 py-0.5 rounded-md shadow-glow-cyan">
                  QUANTITATIVE BETTING INTELLIGENCE
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">· 2026-27 Alapszakasz</span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                NBA Mérkőzéselemző & Algoritmikus Értékkereső
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Valós idejű bukmékeri oddsok, dinamikus csapat-hatékonyság (ORtg/DRtg), rotációs sérülésjelentések és 10 000 Monte Carlo meccsszimuláció.
              </p>
            </div>

            {/* Quick Metrics Bar & Refresh Button */}
            <div className="flex items-center space-x-3 flex-wrap sm:flex-nowrap">
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="bg-dark-900/90 border border-white/[0.08] px-3.5 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">Játéknap</span>
                  <span className="font-bold text-cyan-400 text-sm">{games.length} Meccs</span>
                </div>
                <div className="bg-dark-900/90 border border-white/[0.08] px-3.5 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">Pozitív EV</span>
                  <span className="font-bold text-emerald-400 text-sm">{topPicks.length} Piac</span>
                </div>
              </div>

              <button
                onClick={loadData}
                disabled={refreshing}
                className="p-3 rounded-2xl bg-dark-900 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/[0.08] hover:border-cyan-500/40 shadow-sm transition-all"
                title="Adatok és szimulációk frissítése"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-cyan-400' : 'text-slate-300'}`} />
              </button>
            </div>
          </div>

          {/* Quick Highlight Banner if top edge exists */}
          {bestEdgePick && (
            <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono relative z-10">
              <div className="flex items-center space-x-2 text-slate-300">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Nap Legjobb Matematikai Éléke:</span>
                <strong className="text-white">{bestEdgePick.game_matchup}</strong>
                <span className="text-cyan-400 font-bold">{bestEdgePick.selection}</span>
                <span className="text-slate-400">@{bestEdgePick.bookmaker_odds.toFixed(2)}</span>
              </div>
              <span className="neon-pill-emerald px-2.5 py-0.5 rounded-lg font-bold text-[11px] hidden sm:inline">
                +{bestEdgePick.edge}% Edge (EV: +{bestEdgePick.ev}%)
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: Games List */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="font-display font-extrabold text-base uppercase tracking-wider text-white">
                  Játéknap Menetrend & Oddsok
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Kattints bármelyik mérkőzésre a 10 000 Monte Carlo lefutásért
              </span>
            </div>

            {loading ? (
              <div className="text-center py-24 text-slate-400 font-mono text-sm">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                <span>Adatok, sérülések és szimulációk betöltése...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {games.map((g) => {
                  const matchTopPick = topPicks.find(p => p.game_id === g.id)
                  return (
                    <GameCard 
                      key={g.id} 
                      game={g} 
                      topPick={matchTopPick} 
                      onSelectGame={handleSelectGame} 
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Actionable Picks */}
        {activeTab === 'picks' && (
          <PicksView 
            picks={allPicks} 
            onTrackPick={handleTrackPick} 
          />
        )}

        {/* Tab 3: Performance & Backtesting */}
        {activeTab === 'performance' && (
          <PerformanceView 
            performance={performance} 
            history={history} 
          />
        )}

        {/* Tab 4: Standings & Ratings */}
        {activeTab === 'standings' && (
          <StandingsView 
            teams={teams} 
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-dark-950/90 py-8 px-4 text-center text-xs font-mono text-slate-500 space-y-2 mt-12">
        <div className="flex items-center justify-center space-x-3 text-slate-400">
          <span className="text-cyan-400 font-bold">NBA QUANT INTELLIGENCE v1.2</span>
          <span>·</span>
          <span>Vig-mentesített Monte Carlo Döntéstámogatás</span>
          <span>·</span>
          <span>DraftKings & Caesars Odds Feeds</span>
        </div>
        <p className="text-[11px] text-slate-600 max-w-xl mx-auto">
          A rendszer valószínűségi modelleket kalkulál, nem garantál pénzügyi nyereséget. A sportfogadás kockázattal jár, játssz felelősséggel!
        </p>
      </footer>

      {/* Game Detail Modal */}
      {selectedGameAnalysis && (
        <GameDetailModal 
          analysis={selectedGameAnalysis} 
          onClose={() => setSelectedGameAnalysis(null)} 
          onTrackPick={handleTrackPick}
        />
      )}

      {/* Methodology Modal */}
      {showMethodology && (
        <MethodologyModal 
          onClose={() => setShowMethodology(false)} 
        />
      )}
    </div>
  )
}
