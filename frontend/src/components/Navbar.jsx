import React from 'react'
import { Activity, Flame, BarChart3, Trophy, HelpCircle, Shield, Zap, Circle } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, onOpenMethodology, liveGamesCount = 0 }) {
  const navItems = [
    { id: 'games', label: 'Mérkőzések & Élő', icon: Activity, badge: liveGamesCount > 0 ? `${liveGamesCount} ÉLŐ` : null },
    { id: 'picks', label: 'Érték Tippek (+EV)', icon: Flame, badge: 'HOT' },
    { id: 'performance', label: 'Validáció & Backtest', icon: BarChart3 },
    { id: 'standings', label: 'Tabella & Hatékonyság', icon: Trophy },
  ]

  return (
    <header className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-2xl border-b border-white/[0.08] transition-all">
      {/* Top micro ticker */}
      <div className="bg-gradient-to-r from-blue-950/50 via-dark-900 to-indigo-950/50 border-b border-white/[0.04] py-1 px-4 text-[11px] font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>QUANT ENGINE AKTÍV</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">10 000 Monte Carlo Szimuláció / mérkőzés</span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline">Vig-mentesített Multiplikatív Piacmodell</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="text-cyan-400 font-bold">CET Időzóna</span>
            <span>·</span>
            <span>DraftKings & Caesars Odds</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand with glowing badge */}
          <div 
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => setActiveTab('games')}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-glow-cyan group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-950" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-black text-white text-lg tracking-wider group-hover:text-cyan-300 transition-colors">
                  NBA<span className="text-cyan-400 font-light">QUANT</span>
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                  PRO v1.2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Kvantitatív Fogadási Intelligencia & Predikció
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-dark-900/60 p-1.5 rounded-xl border border-white/[0.06]">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-glow-cyan shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white text-blue-700' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Action: Methodology button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenMethodology}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-dark-850 hover:bg-dark-800 border border-white/[0.08] hover:border-cyan-500/40 shadow-sm transition-all"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Módszertan</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2.5 space-x-2 bg-dark-900/90 border-t border-white/[0.05]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white bg-dark-850 border border-white/[0.05]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}
