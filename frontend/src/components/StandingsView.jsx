import React, { useMemo, useState } from 'react'
import { Loading, Logo, Mark, Notice, SectionHead } from './ui'
import { num, signed } from '../lib/format'

// Minden oszlop a „legjobb elöl” sorrendet adja.
const COLUMNS = [
  { id: 'wins', label: 'Mérleg', sort: (a, b) => b.wins - a.wins || a.losses - b.losses },
  { id: 'ppg', label: 'Dobott', numeric: true, sort: (a, b) => b.points_per_game - a.points_per_game },
  { id: 'opp', label: 'Kapott', numeric: true, sort: (a, b) => a.points_allowed_per_game - b.points_allowed_per_game },
  { id: 'diff', label: 'Különbség', numeric: true, sort: (a, b) => b.points_per_game - b.points_allowed_per_game - (a.points_per_game - a.points_allowed_per_game) },
  { id: 'ortg', label: 'ORtg', numeric: true, estimated: true, sort: (a, b) => b.ortg - a.ortg },
  { id: 'drtg', label: 'DRtg', numeric: true, estimated: true, sort: (a, b) => a.drtg - b.drtg },
  { id: 'net', label: 'Net', numeric: true, estimated: true, sort: (a, b) => b.ortg - b.drtg - (a.ortg - a.drtg) },
  { id: 'pace', label: 'Tempó', numeric: true, estimated: true, sort: (a, b) => b.pace - a.pace },
]

export default function StandingsView({ standings }) {
  const [sortId, setSortId] = useState('wins')
  const teams = standings.data ?? []
  const sorted = useMemo(() => [...teams].sort(COLUMNS.find((c) => c.id === sortId).sort), [teams, sortId])

  if (!standings.data && standings.status === 'loading') return <Loading>Tabella betöltése</Loading>
  if (!standings.data) {
    return (
      <Notice
        tone="error"
        title="A tabella nem tölthető be"
        action={
          <button type="button" onClick={standings.reload} className="btn btn-solid">
            Újrapróbálom
          </button>
        }
      >
        {standings.error}
      </Notice>
    )
  }

  return (
    <section aria-labelledby="standings-title">
      <SectionHead eyebrow={`${teams.length} csapat`} title={<span id="standings-title">Tabella</span>} />
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <caption className="sr-only">NBA-csapatok mérlege és hatékonysági mutatói; a fejlécre kattintva rendezhető</caption>
          <thead className="border-b font-mono text-[11px] uppercase tracking-wider text-mute">
            <tr>
              <th scope="col" className="w-10 p-3 text-center">#</th>
              <th scope="col" className="p-3">Csapat</th>
              {COLUMNS.map((c) => (
                <th key={c.id} scope="col" aria-sort={sortId === c.id ? 'descending' : 'none'} className={`p-0 ${c.numeric ? 'text-right' : 'text-center'}`}>
                  <button
                    type="button"
                    onClick={() => setSortId(c.id)}
                    className={`w-full p-3 uppercase tracking-wider ${c.numeric ? 'text-right' : 'text-center'} ${sortId === c.id ? 'text-ink underline decoration-model decoration-2 underline-offset-4' : 'hover:text-ink'}`}
                  >
                    {c.label} {c.estimated && <Mark kind="assumed" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map((t, i) => {
              const diff = t.points_per_game - t.points_allowed_per_game
              const net = t.ortg - t.drtg
              return (
                <tr key={t.id}>
                  <td className="tnum p-3 text-center font-mono text-xs text-mute">{i + 1}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-3">
                      <Logo team={t} size={28} />
                      <span className="font-semibold">{t.display_name}</span>
                    </span>
                  </td>
                  <td className="tnum p-3 text-center font-mono font-semibold">{t.record}</td>
                  <td className="tnum p-3 text-right font-mono">{num(t.points_per_game, 1)}</td>
                  <td className="tnum p-3 text-right font-mono">{num(t.points_allowed_per_game, 1)}</td>
                  <td className={`tnum p-3 text-right font-mono font-semibold ${diff > 0 ? 'text-good' : ''}`}>{signed(diff, 1)}</td>
                  <td className="tnum p-3 text-right font-mono text-mute">{num(t.ortg, 1)}</td>
                  <td className="tnum p-3 text-right font-mono text-mute">{num(t.drtg, 1)}</td>
                  <td className={`tnum p-3 text-right font-mono ${net > 0 ? 'text-good' : 'text-mute'}`}>{signed(net, 1)}</td>
                  <td className="tnum p-3 text-right font-mono text-mute">{num(t.pace, 1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-mute">
        <Mark kind="assumed" /> Az ORtg, DRtg, Net és Tempó becsült: az ESPN tabella pontátlagaiból számolja a rendszer, nem tényleges birtoklásszámból. A mérleg és a pontátlagok forrásadatok{' '}
        <Mark kind="source" />.
      </p>
    </section>
  )
}
