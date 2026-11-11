import React from 'react'
import { Activity, Flame, BarChart3, Trophy, HelpCircle, ShieldAlert } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, onOpenMethodology }) {
  const navItems = [
    { id: 'games', label: 'Napi Meccsek', icon: Activity },
    { id: 'picks', label: 'Érték Tippek (+EV)', icon: Flame },
    { id: 'performance', label: 'Validáció & Backtest', icon: BarChart3 },
    { id: 'standings', label: 'Tabella & Statisztikák', icon: Trophy },
  ]

  return (
    <header className="sticky top-0 z-40 bg-[#0c1322]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('games')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-extrabold text-white text-lg tracking-tighter">NBA</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-wide">INTELLIGENCE</span>
                <span className="text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">QUANT v1.0</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Matematikai NBA Előrejelző & Odds Elemző Rendszer</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Right Action: Methodology button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMethodology}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Módszertan & Felelős Játék"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Módszertan</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 space-x-2 bg-slate-900/60 border-t border-slate-800/80">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
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
