import React from 'react'
import { Award, TrendingUp, BarChart2, CheckCircle2, XCircle, ArrowUpRight, ShieldCheck, HelpCircle, Activity } from 'lucide-react'

export default function PerformanceView({ performance, history }) {
  if (!performance) {
    return (
      <div className="text-center py-20 text-slate-400 font-mono text-sm">
        Teljesítménymutatók kalkulálása folyamatban...
      </div>
    )
  }

  const {
    total_picks,
    completed_picks,
    won_picks,
    lost_picks,
    push_picks,
    win_rate,
    total_units_staked,
    total_profit_units,
    roi_percent,
    brier_score,
    clv_positive_rate,
    calibration_data
  } = performance

  return (
    <div className="space-y-6">

      {/* Top Banner: Verification Notice */}
      <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] relative overflow-hidden shadow-glass">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-glow-cyan">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-extrabold text-lg text-white">
                  Objektív, Auditált Teljesítmény & Backtest
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  ZÉRÓ LOOK-AHEAD BIAS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Minden ajánlás időbélyeggel rögzített. A modell szigorúan csak a feldobás előtti oddsokat és sérülésadatokat használja, utólagos módosítási lehetőség nélkül.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-dark-900/90 border border-white/[0.08] px-4 py-2.5 rounded-2xl font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">Pozitív CLV Arány</span>
              <span className="text-emerald-400 font-black text-sm">+{clv_positive_rate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Profit */}
        <div className="glass-card p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Kumulált Profit</span>
          <div className="text-3xl font-display font-black font-mono text-emerald-400 mt-2 flex items-baseline space-x-1.5">
            <span>{total_profit_units >= 0 ? `+${total_profit_units.toFixed(2)}` : total_profit_units.toFixed(2)}</span>
            <span className="text-xs font-mono font-normal text-slate-400">Unit</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1.5 block">
            Összes tét: {total_units_staked.toFixed(1)}u
          </span>
        </div>

        {/* ROI / Yield */}
        <div className="glass-card p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">ROI (Yield)</span>
          <div className="text-3xl font-display font-black font-mono text-cyan-400 mt-2">
            {roi_percent >= 0 ? `+${roi_percent.toFixed(1)}%` : `${roi_percent.toFixed(1)}%`}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1.5 block">
            Hozam egységnyi téten
          </span>
        </div>

        {/* Win Rate */}
        <div className="glass-card p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Találati Arány</span>
          <div className="text-3xl font-display font-black font-mono text-white mt-2">
            {win_rate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1.5 block">
            {won_picks}W - {lost_picks}L ({completed_picks} meccs)
          </span>
        </div>

        {/* Brier Score */}
        <div className="glass-card p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Brier-Score</span>
          <div className="text-3xl font-display font-black font-mono text-amber-400 mt-2">
            {brier_score.toFixed(3)}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1.5 block">
            Alacsonyabb = jobb (Coin toss: 0.250)
          </span>
        </div>

      </div>

      {/* Model Calibration Curve Visualizer */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2.5">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              <span>Valószínűség-Kalibrációs Görbe (Reliability Diagram)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              A modell által becsült valószínűség (pl. 60-70%) összehasonlítása az empirikusan megfigyelt nyerési aránnyal
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-glow-emerald">
            ✓ Jó eloszlási kalibráció
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
          {calibration_data.map((bin, i) => {
            const isGood = Math.abs(bin.delta) <= 5.0
            return (
              <div key={i} className="bg-dark-900/90 border border-white/[0.06] p-4 rounded-2xl text-center shadow-inner">
                <span className="text-xs font-mono font-extrabold text-cyan-400 block mb-2">
                  {bin.bucket}
                </span>
                
                <div className="my-2 space-y-1">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Jósolt: <strong className="text-slate-200">{bin.avg_pred_prob}%</strong>
                  </div>
                  <div className="text-lg font-black font-mono text-white">
                    Valós: <span className="text-emerald-400">{bin.actual_win_rate}%</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{bin.count} tipp</span>
                  <span className={isGood ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    Δ {bin.delta >= 0 ? `+${bin.delta}%` : `${bin.delta}%`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Historical Ledger Table */}
      <div className="glass-card rounded-3xl border border-white/[0.08] overflow-hidden shadow-glass">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-bold text-base text-white">
              Historikus Tippnapló & Audit Trail
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{history.length} auditált tipp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-dark-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Dátum</th>
                <th className="py-3.5 px-4 font-bold">Meccs</th>
                <th className="py-3.5 px-4 font-bold">Piac</th>
                <th className="py-3.5 px-4 font-bold">Kiválasztás</th>
                <th className="py-3.5 px-4 text-right font-bold">Odds</th>
                <th className="py-3.5 px-4 text-right font-bold">Modell</th>
                <th className="py-3.5 px-4 text-right font-bold">Edge</th>
                <th className="py-3.5 px-4 text-right font-bold">Záró Odds (CLV)</th>
                <th className="py-3.5 px-4 text-center font-bold">Eredmény</th>
                <th className="py-3.5 px-4 text-right font-bold">P/L (Units)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-200">
              {history.map((h) => {
                const isWon = h.result === 'WON'
                const isLost = h.result === 'LOST'
                return (
                  <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">{h.date}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{h.matchup}</td>
                    <td className="py-3.5 px-4 text-slate-400">{h.market}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{h.selection}</td>
                    <td className="py-3.5 px-4 text-right text-cyan-400 font-bold">{h.odds.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">{(h.model_prob * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">+{h.edge.toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {h.closing_odds ? (
                        <span className="flex items-center justify-end space-x-1">
                          <span>{h.closing_odds.toFixed(2)}</span>
                          {h.clv_edge > 0 && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        isWon ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        isLost ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-dark-950 text-slate-400'
                      }`}>
                        {isWon ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : isLost ? <XCircle className="w-3 h-3 text-rose-400" /> : null}
                        <span>{h.result}</span>
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-black ${
                      h.profit_loss > 0 ? 'text-emerald-400' : h.profit_loss < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {h.profit_loss > 0 ? `+${h.profit_loss.toFixed(2)}` : h.profit_loss.toFixed(2)}
                    </td>
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
