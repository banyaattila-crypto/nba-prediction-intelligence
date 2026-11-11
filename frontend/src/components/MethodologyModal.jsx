import React from 'react'
import { X, ShieldAlert, BookOpen, Calculator, Cpu, AlertTriangle } from 'lucide-react'

export default function MethodologyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Kvantitatív Módszertan & Felelős Játék Szabályzat
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm text-slate-300">
          
          {/* Section 1: Vig Removal */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>1. Bukmékeri Árrés (Vig) Eltávolítása és Fair Odds</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A bukmékerek nem valós valószínűségeket kínálnak, hanem egy 4-7% közötti árrést (vigorish / juice) építenek be: az implikált esélyek összege meghaladja a 100%-ot. Rendszerünk multiplikatív vig-mentesítést alkalmaz, így a modell valószínűségét a valódi, tiszta piaci esélyhez (P_fair) viszonyítjuk:
            </p>
            <div className="bg-[#121a2c] p-3 rounded-xl font-mono text-xs text-blue-300 border border-slate-800">
              P_fair = (1 / Odds_i) / (1 / Odds_A + 1 / Odds_B)
            </div>
          </div>

          {/* Section 2: Edge & EV */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>2. Matematikai Előny (Edge) és Várható Érték (EV)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Egy tipp csak akkor kap "VALUE" ajánlást, ha mindkét feltétel teljesül:
            </p>
            <div className="bg-[#121a2c] p-3 rounded-xl font-mono text-xs text-emerald-300 border border-slate-800 space-y-1">
              <div>Edge = P_modell - P_fair ≥ +2.0%</div>
              <div>EV = [P_modell · (Odds - 1) - (1 - P_modell)] · 100 ≥ +2.5%</div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ha nincs kimutatható matematikai előny, a rendszer egyértelműen a **"PASS / Nincs ajánlható tipp"** állapotot jeleníti meg, elkerülve a felesleges kockázatvállalást.
            </p>
          </div>

          {/* Section 3: Monte Carlo */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">3. 10 000 Futásos Monte Carlo Mérkőzésszimuláció</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nem determinisztikus pontszámot jósolunk. A csapatok dinamikus támadó- és védőhatékonyságát (ORtg/DRtg), ligatempóját (Pace), valamint a sérülések és back-to-back fáradtság súlyozását 10 000 független virtuális mérkőzésen szimuláljuk, beépítve az NBA empirikus szórását ($\sigma \approx 11.5$).
            </p>
          </div>

          {/* Section 4: Fractional Kelly */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">4. Bankroll-Védelem: 0.25x Fractional Kelly Kritérium</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A teljes Kelly-kritérium túlságosan agresszív a sportfogadás varianciájához. Alkalmazásunk <strong>Quarter-Kelly (0.25x)</strong> tétméretezést javasol, maximum 2.5 egységben (Unit) plafonálva, minimalizálva a tőkevesztés (drawdown) esélyét.
            </p>
          </div>

          {/* Section 5: Responsible Gaming Notice */}
          <div className="bg-rose-950/20 border border-rose-500/40 p-4 rounded-xl flex items-start space-x-3 text-xs text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block">Felelős Játék és Pénzügyi Figyelmeztetés</strong>
              <p>
                A sportfogadás kockázattal jár. A matematikai modellek és statisztikai előrejelzések a valószínűségi előnyt keresik, de nem garantálnak nyereséget az egyes mérkőzéseken. Soha ne fogadj olyan összeggel, amelynek elvesztését nem engedheted meg magadnak!
              </p>
              <p className="text-slate-400 text-[11px] pt-1">
                Az alkalmazás kizárólag döntéstámogató és elemző célokat szolgál; nem hajt végre automatikus fogadásokat és nem vesz részt szerencsejáték lebonyolításában.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
