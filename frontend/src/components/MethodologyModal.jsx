import React from 'react'
import { X, ShieldAlert, BookOpen, Calculator, Cpu, AlertTriangle, Scale, Target } from 'lucide-react'

export default function MethodologyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-dark-950 border border-white/[0.12] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-950/95 backdrop-blur-md px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base text-white">
                Kvantitatív Módszertan & Felelős Játék Szabályzat
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Matematikai modellek és tőkevédelmi irányelvek
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-dark-900 hover:bg-dark-800 border border-white/[0.08] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 text-sm text-slate-300">
          
          {/* Section 1: Vig Removal */}
          <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2.5">
            <h3 className="font-display font-bold text-base text-white flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <span>1. Bukmékeri Árrés (Vig) Eltávolítása és Fair Odds</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A bukmékerek nem a valós kimeneteli esélyeket adják, hanem egy 4-7% közötti beépített marginnal (vigorish / juice) dolgoznak: az implikált esélyek összege 100% fölé kúszik. Rendszerünk multiplikatív vig-mentesítést alkalmaz, így a becsült modell-esélyt nem a torzított bukmékeri oddsokhoz, hanem a valódi fair piaci valószínűséghez viszonyítja:
            </p>
            <div className="bg-dark-950 p-3.5 rounded-xl font-mono text-xs text-cyan-300 border border-white/[0.06] shadow-inner">
              P_fair = (1 / Odds_i) / (1 / Odds_A + 1 / Odds_B)
            </div>
          </div>

          {/* Section 2: Edge & EV */}
          <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2.5">
            <h3 className="font-display font-bold text-base text-white flex items-center space-x-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <span>2. Matematikai Előny (Edge) és Várható Érték (EV)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Egy ajánlás kizárólag akkor kap "VALUE" minősítést, ha mindkét matematikai feltétel egyidejűleg teljesül:
            </p>
            <div className="bg-dark-950 p-3.5 rounded-xl font-mono text-xs text-emerald-300 border border-white/[0.06] shadow-inner space-y-1.5">
              <div>Edge = P_modell - P_fair ≥ +2.0%</div>
              <div>EV = [P_modell · (Odds - 1) - (1 - P_modell)] · 100 ≥ +2.5%</div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ha a piaci szorzók hatékonyak és nem találunk kimutatható matematikai előnyt, a rendszer szigorúan a <strong className="text-white">"PASS / Nincs ajánlható él"</strong> jelzést adja, megvédve a felhasználó bankrollját a felesleges kockázattól.
            </p>
          </div>

          {/* Section 3: Monte Carlo */}
          <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2.5">
            <h3 className="font-display font-bold text-base text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>3. 10 000 Futásos Vektorizált Monte Carlo Szimuláció</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nem determinisztikus becslést végzünk: a csapatok kiigazított támadó- és védőhatékonysága (ORtg/DRtg), becsült tempója (Pace), a sérülési hiányzók és a Back-to-Back fáradtsági mutatók alapján 10 000 független meccsszimulációt futtatunk le normál ponteloszlással és tempókorrelációval ($\sigma \approx 11.5$).
            </p>
          </div>

          {/* Section 4: Fractional Kelly */}
          <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2.5">
            <h3 className="font-display font-bold text-base text-white flex items-center space-x-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span>4. Bankroll-Védelem: 0.25x Fractional Kelly Kritérium</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A teljes Kelly-kritérium túlságosan agresszív és túl nagy tőkekingást okozna. Ezért <strong className="text-white">Quarter-Kelly (0.25x)</strong> méretezést alkalmazunk, legfeljebb 2.5 egységben (Unit) plafonálva a téteket, biztosítva a hosszú távú tőkemegőrzést.
            </p>
          </div>

          {/* Section 5: Responsible Gaming Notice */}
          <div className="bg-rose-950/20 border border-rose-500/40 p-5 rounded-2xl flex items-start space-x-3.5 text-xs text-rose-300 shadow-glow-rose">
            <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <strong className="font-display font-bold text-sm text-white block">
                Felelős Játék & Pénzügyi Kockázati Tájékoztató
              </strong>
              <p className="leading-relaxed">
                A sportfogadás jelentős pénzügyi kockázattal jár. A matematikai modellek és statisztikai elemzések valószínűségi előnyt keresnek a piacon, de egyetlen konkrét mérkőzésen sem garantálnak nyereséget.
              </p>
              <p className="text-slate-400 text-[11px] pt-1">
                Az alkalmazás kizárólag kvantitatív döntéstámogató és kutatási célokat szolgál; semmilyen körülmények között nem hajt végre automatikus fogadásokat és nem kezel valódi pénzügyi tranzakciókat.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
