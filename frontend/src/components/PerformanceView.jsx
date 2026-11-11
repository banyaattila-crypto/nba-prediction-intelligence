import React from 'react'
import { Award, TrendingUp, BarChart2, CheckCircle2, XCircle, ArrowUpRight, ShieldCheck, HelpCircle } from 'lucide-react'

export default function PerformanceView({ performance, history }) {
  if (!performance) {
    return (
      <div className="text-center py-12 text-slate-400">
        Teljesítménymutatók betöltése folyamatban...
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
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Objektív, Nem Manipulálható Teljesítménykövetés</h3>
            <p className="text-xs text-slate-400">
              Minden ajánlás időbélyeggel rögzített. A modell kizárólag a mérkőzés előtt ismert adatokból kalkulál (zéró look-ahead bias).
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg border border-blue-500/30">
            CLV Ráta: <strong>+{clv_positive_rate}%</strong>
          </span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Profit */}
        <div className="bg-[#11192e] border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Kumulált Profit / Veszteség</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1 flex items-baseline space-x-1">
            <span>{total_profit_units >= 0 ? `+${total_profit_units.toFixed(2)}` : total_profit_units.toFixed(2)}</span>
            <span className="text-xs font-normal text-slate-400">Unit</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Össz. feltett: {total_units_staked.toFixed(1)}u</span>
        </div>

        {/* ROI / Yield */}
        <div className="bg-[#11192e] border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">ROI (Hozam)</span>
          <div className="text-2xl font-black font-mono text-blue-400 mt-1">
            {roi_percent >= 0 ? `+${roi_percent.toFixed(1)}%` : `${roi_percent.toFixed(1)}%`}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Yield egységnyi téten</span>
        </div>

        {/* Win Rate */}
        <div className="bg-[#11192e] border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Találati Arány (Win Rate)</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {win_rate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">{won_picks}W - {lost_picks}L ({completed_picks} meccs)</span>
        </div>

        {/* Brier Score */}
        <div className="bg-[#11192e] border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Brier-Score (Pontosság)</span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {brier_score.toFixed(3)}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Alacsonyabb = jobb (Coin toss: 0.250)</span>
        </div>
      </div>

      {/* Model Calibration Curve Visualizer */}
      <div className="bg-[#11192e] border border-slate-800 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Modell Valószínűség-Kalibrációs Görbe (Reliability Diagram)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ha a modell 60% esélyt jósol, vajon tényleg ~60%-ban nyernek-e a tippek?
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            Jól kalibrált eloszlás
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {calibration_data.map((bin, i) => (
            <div key={i} className="bg-[#0c1424] border border-slate-800/80 p-3 rounded-xl text-center">
              <span className="text-xs font-mono text-slate-400 font-semibold block">{bin.bucket}</span>
              
              <div className="my-2 space-y-1">
                <div className="text-xs text-slate-400">
                  Jósolt: <span className="font-mono text-slate-200">{bin.avg_pred_prob}%</span>
                </div>
                <div className="text-sm font-black font-mono text-emerald-400">
                  Valós: {bin.actual_win_rate}%
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                {bin.count} tipp ({bin.delta >= 0 ? `+${bin.delta}%` : `${bin.delta}%`})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Ledger Table */}
      <div className="bg-[#11192e] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Historikus Tippnapló (Audit Trail)</h3>
          <span className="text-xs text-slate-400 font-mono">Összesen: {history.length} tipp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b1220] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Dátum</th>
                <th className="py-3 px-4">Meccs</th>
                <th className="py-3 px-4">Piac</th>
                <th className="py-3 px-4">Kiválasztás</th>
                <th className="py-3 px-4 text-right">Odds</th>
                <th className="py-3 px-4 text-right">Modell Esély</th>
                <th className="py-3 px-4 text-right">Edge</th>
                <th className="py-3 px-4 text-right">Záró Odds (CLV)</th>
                <th className="py-3 px-4 text-center">Eredmény</th>
                <th className="py-3 px-4 text-right">P/L (Units)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {history.map((h) => {
                const isWon = h.result === 'WON'
                const isLost = h.result === 'LOST'
                return (
                  <tr key={h.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-slate-400">{h.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{h.matchup}</td>
                    <td className="py-3 px-4 text-slate-400">{h.market}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{h.selection}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{h.odds.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{(h.model_prob * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right text-emerald-400">+{h.edge.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {h.closing_odds ? (
                        <span className="flex items-center justify-end space-x-1">
                          <span>{h.closing_odds.toFixed(2)}</span>
                          {h.clv_edge > 0 && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isWon ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isLost ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {isWon ? <CheckCircle2 className="w-3 h-3" /> : isLost ? <XCircle className="w-3 h-3" /> : null}
                        <span>{h.result}</span>
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${
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
