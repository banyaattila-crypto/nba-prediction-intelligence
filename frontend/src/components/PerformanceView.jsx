import React from 'react'
import { RefreshCw } from 'lucide-react'
import Evidence from './Evidence'
import { Loading, Mark, Notice, SectionHead } from './ui'
import { num, pct, signed } from '../lib/format'

const RESULT = {
  WON: { label: 'Nyert ✓', cls: 'border-good text-good' },
  LOST: { label: 'Vesztett ✕', cls: 'border-ink text-ink' },
  PUSH: { label: 'Visszajár', cls: 'border-mute/60 text-mute' },
  PENDING: { label: 'Függő', cls: 'border-dashed border-mute/60 text-mute' },
}

function Kpi({ term, value, note, dim = false }) {
  return (
    <div className="p-4 sm:p-5">
      <dt className="eyebrow">{term}</dt>
      <dd className={`tnum mt-1 font-display text-4xl font-extrabold leading-none ${dim ? 'text-mute' : ''}`}>{value}</dd>
      <dd className="mt-1.5 text-xs text-mute">{note}</dd>
    </div>
  )
}

function Calibration({ buckets }) {
  const measured = buckets.filter((b) => b.count > 0)
  if (measured.length === 0) {
    return (
      <Notice tone="empty" title="Még nincs mit mérni">
        A kalibráció azt mutatja, hogy a modell 60%-os esélyű tippjei valóban kb. 60%-ban nyernek-e. Ehhez lezárt tippek kellenek.
      </Notice>
    )
  }
  return (
    <div className="panel p-4 sm:p-5">
      <ul className="space-y-4">
        {measured.map((b) => (
          <li key={b.bucket}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-mono font-semibold">{b.bucket}</span>
              <span className="tnum font-mono text-xs text-mute">
                {b.count} tipp · eltérés {signed(b.delta, 1)} pp
                {b.count < 10 && <span className="tag ml-2 border-dashed border-mute/60">kis minta</span>}
              </span>
            </div>
            <div className="mt-1.5 space-y-1" aria-label={`Jósolt ${num(b.avg_pred_prob, 1)}%, tényleges ${num(b.actual_win_rate, 1)}%`}>
              <div className="flex items-center gap-2">
                <Mark kind="model" />
                <div className="h-2.5 flex-1 rounded-sm bg-line/60">
                  <div className="h-full rounded-sm bg-model" style={{ width: `${b.avg_pred_prob}%` }} />
                </div>
                <span className="tnum w-14 text-right font-mono text-xs">{num(b.avg_pred_prob, 1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Mark kind="source" />
                <div className="h-2.5 flex-1 rounded-sm bg-line/60">
                  <div className="h-full rounded-sm bg-ink" style={{ width: `${b.actual_win_rate}%` }} />
                </div>
                <span className="tnum w-14 text-right font-mono text-xs">{num(b.actual_win_rate, 1)}%</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t pt-3 text-xs text-mute">Kék: a modell által jósolt átlag. Fekete: a tényleges nyerési arány. Kis mintán a különbségek jórészt zajok.</p>
    </div>
  )
}

export default function PerformanceView({ performance, history, onSettle, settling }) {
  const s = performance.data
  const rows = history.data ?? []

  if (!s && performance.status === 'loading') return <Loading>Napló betöltése</Loading>
  if (!s) {
    return (
      <Notice
        tone="error"
        title="A napló nem tölthető be"
        action={
          <button type="button" onClick={performance.reload} className="btn btn-solid">
            Újrapróbálom
          </button>
        }
      >
        {performance.error}. A tippek a szerveren változatlanok.
      </Notice>
    )
  }

  const hasDone = s.completed_picks > 0
  const pending = rows.filter((r) => r.result === 'PENDING').length

  return (
    <section aria-labelledby="ledger-title" className="space-y-8">
      <SectionHead eyebrow="Papírkereskedési napló" title={<span id="ledger-title">Mit bizonyít eddig a modell?</span>}>
        <button type="button" onClick={onSettle} disabled={settling || pending === 0} className="btn btn-solid" title={pending === 0 ? 'Nincs függő tipp' : undefined}>
          <RefreshCw className={`h-4 w-4 ${settling ? 'animate-spin' : ''}`} aria-hidden="true" />
          {settling ? 'Elszámolás…' : `Eredmények frissítése${pending ? ` (${pending})` : ''}`}
        </button>
      </SectionHead>

      <Evidence performance={s} />

      <dl className="panel grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
        <Kpi term="Lezárt tipp" value={hasDone ? `${s.won_picks}–${s.lost_picks}${s.push_picks ? `–${s.push_picks}` : ''}` : '—'} note={hasDone ? `Nyert–vesztett${s.push_picks ? '–visszajár' : ''} · ${num(s.win_rate, 1)}%` : 'Nincs lezárt tipp'} />
        <Kpi term="Kumulált eredmény" value={hasDone ? `${signed(s.total_profit_units, 2)}` : '—'} note={hasDone ? `egység, ${num(s.total_units_staked, 1)} egység téten` : 'Nincs lezárt tipp'} />
        <Kpi term="Hozam (ROI)" value={hasDone ? `${signed(s.roi_percent, 1)}%` : '—'} note={s.reliable_sample ? 'Eredmény osztva a téttel' : 'Kis minta: nem von le következtetést'} dim={!s.reliable_sample} />
        <Kpi term="Brier-pontszám" value={s.brier_score === null ? '—' : num(s.brier_score, 3)} note={s.reliable_sample ? 'Kisebb a jobb; 0,250 az érmefeldobás' : 'Kis minta; 0,250 az érmefeldobás'} dim={!s.reliable_sample} />
      </dl>

      <Notice tone="info" title="Záró vonal (CLV): nincs mérve">
        A záró szorzó rögzítése még nincs megvalósítva, ezért a naplóban nincs CLV-adat. Ezt a mutatót nem becsüljük.
      </Notice>

      <div>
        <h3 className="mb-3 font-display text-2xl font-extrabold uppercase tracking-wide">Kalibráció</h3>
        <Calibration buckets={s.calibration_data} />
      </div>

      <div>
        <h3 className="mb-3 font-display text-2xl font-extrabold uppercase tracking-wide">Rögzített tippek</h3>
        {history.status === 'error' && (
          <Notice tone="error" title="A tippek listája nem tölthető be">
            {history.error}
          </Notice>
        )}
        {history.status !== 'error' && rows.length === 0 && (
          <Notice tone="empty" title="Még nincs rögzített tipp">
            Az Eltérések fülön a „Rögzítés papírkereskedésként” gombbal vehetsz fel tippet. A meccs után az „Eredmények frissítése” gomb számolja el.
          </Notice>
        )}
        {rows.length > 0 && (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Rögzített papírkereskedési tippek</caption>
              <thead className="border-b font-mono text-[11px] uppercase tracking-wider text-mute">
                <tr>
                  <th scope="col" className="p-3">Dátum</th>
                  <th scope="col" className="p-3">Meccs</th>
                  <th scope="col" className="p-3">Tipp</th>
                  <th scope="col" className="p-3 text-right">Szorzó</th>
                  <th scope="col" className="p-3 text-right">Modell</th>
                  <th scope="col" className="p-3 text-right">Eltérés</th>
                  <th scope="col" className="p-3 text-center">Eredmény</th>
                  <th scope="col" className="p-3 text-right">Egység</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...rows].reverse().map((h) => {
                  const r = RESULT[h.result] ?? RESULT.PENDING
                  return (
                    <tr key={h.id}>
                      <td className="tnum p-3 font-mono text-xs text-mute">{h.date}</td>
                      <td className="p-3 font-semibold">{h.matchup}</td>
                      <td className="p-3">{h.selection}</td>
                      <td className="tnum p-3 text-right font-mono">{num(h.odds, 2)}</td>
                      <td className="tnum p-3 text-right font-mono">{pct(h.model_prob, 1)}</td>
                      <td className="tnum p-3 text-right font-mono">{signed(h.edge, 1)} pp</td>
                      <td className="p-3 text-center">
                        <span className={`tag ${r.cls}`}>{r.label}</span>
                      </td>
                      <td className={`tnum p-3 text-right font-mono font-semibold ${h.profit_loss > 0 ? 'text-good' : ''}`}>{h.result === 'PENDING' ? '—' : signed(h.profit_loss, 2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
