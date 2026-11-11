import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import GameCard from './components/GameCard'
import GameDetailModal from './components/GameDetailModal'
import PicksView from './components/PicksView'
import PerformanceView from './components/PerformanceView'
import StandingsView from './components/StandingsView'
import MethodologyModal from './components/MethodologyModal'
import { Activity, Flame, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react'

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
        showToast(`Tipp hozzáadva a követett portfólióhoz: ${pick.selection}`)
        // Refresh performance and history
        const histRes = await fetch('/api/history')
        if (histRes.ok) setHistory(await histRes.json())
        const perfRes = await fetch('/api/performance')
        if (perfRes.ok) setPerformance(await perfRes.json())
      }
    } catch (err) {
      console.error('Error tracking pick:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenMethodology={() => setShowMethodology(true)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Top Intelligence Hero Strip */}
        <div className="mb-6 bg-gradient-to-r from-[#121c33] via-[#0f172a] to-[#121c33] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h1 className="text-base font-extrabold text-white">
                Mai NBA Mérkőzések & Statisztikai Előrejelzések
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Valós idejű bukmékeri oddsok (DraftKings/Caesars), Vig-mentesítés, és 10 000 Monte Carlo mérkőzésszimuláció.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{games.length} Mérkőzés</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400 font-bold">{topPicks.length} +EV lehetőség</span>
            </div>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Adatok frissítése"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab 1: Games List */}
        {activeTab === 'games' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Játéknap Menetrend (Helyi Idő szerint)
              </h2>
              <span className="text-xs text-slate-400">
                Kattints bármelyik mérkőzésre a 10 000 Monte Carlo lefutás és sérülések megtekintéséhez
              </span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                Adatok és szimulációk betöltése...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <footer className="border-t border-slate-800/80 bg-[#070b16] py-6 px-4 text-center text-xs text-slate-400 space-y-2">
        <p>
          NBA Prediction & Betting Intelligence Platform · Kvantitatív döntéstámogatás sportfogadási piacokon
        </p>
        <p className="text-[11px] text-slate-400">
          A rendszer nem garantál nyereséget. A sportfogadás pénzügyi kockázattal jár, játssz felelősséggel!
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
