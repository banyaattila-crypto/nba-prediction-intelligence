import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import GameCard from './components/GameCard'
import GameDetailModal from './components/GameDetailModal'
import PicksView from './components/PicksView'
import PerformanceView from './components/PerformanceView'
import StandingsView from './components/StandingsView'
import MethodologyModal from './components/MethodologyModal'
import Evidence from './components/Evidence'
import { Legend, Loading, Notice } from './components/ui'
import { errorText, postJson, useResource } from './lib/api'
import { isFlagged } from './lib/format'

const today = () => {
  const s = new Date().toLocaleDateString('hu-HU', { weekday: 'long', month: 'long', day: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function App() {
  const [tab, setTab] = useState('games')
  const [detail, setDetail] = useState(null)
  const [showMethodology, setShowMethodology] = useState(false)
  const [settling, setSettling] = useState(false)
  const [toast, setToast] = useState(null)

  // Minden végpont önálló: a lassú modellszámítás nem tartja fel a meccslistát.
  const games = useResource('/api/games')
  const picks = useResource('/api/picks')
  const performance = useResource('/api/performance')
  const history = useResource('/api/history')
  const standings = useResource('/api/standings')

  const toastTimer = useRef(null)
  const showToast = useCallback((message, tone = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ message, tone })
    toastTimer.current = setTimeout(() => setToast(null), 4500)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const picksByGame = useMemo(() => {
    const map = new Map()
    for (const p of picks.data ?? []) map.set(p.game_id, [...(map.get(p.game_id) ?? []), p])
    return map
  }, [picks.data])

  const trackedIds = useMemo(() => new Set((history.data ?? []).map((h) => h.id)), [history.data])
  const gameList = games.data ?? []
  const liveCount = gameList.filter((g) => g.status === 'in_progress').length
  const flaggedGames = gameList.filter((g) => (picksByGame.get(g.id) ?? []).some(isFlagged)).length
  const upcoming = gameList.filter((g) => g.status === 'scheduled').length

  const detailRequest = useRef(null)
  const openGame = useCallback(async (game) => {
    detailRequest.current?.abort()
    const c = new AbortController()
    detailRequest.current = c
    setDetail({ game, status: 'loading' })
    try {
      const res = await fetch(`/api/games/${game.id}`, { signal: c.signal })
      if (!res.ok) throw new Error(await errorText(res))
      setDetail({ game, status: 'ok', analysis: await res.json() })
    } catch (e) {
      if (e.name !== 'AbortError') setDetail({ game, status: 'error', error: e.message })
    }
  }, [])
  const closeGame = useCallback(() => {
    detailRequest.current?.abort()
    setDetail(null)
  }, [])

  // Csak akkor kerül „Rögzítve” állapotba a tipp, ha a szerver tényleg elmentette.
  const trackPick = useCallback(
    async (pick) => {
      try {
        await postJson('/api/picks/track', pick)
        await Promise.all([history.reload(), performance.reload()])
        showToast(`Rögzítve: ${pick.selection}`)
      } catch (e) {
        showToast(`A rögzítés nem sikerült: ${e.message}`, 'error')
      }
    },
    [history, performance, showToast],
  )

  const settle = useCallback(async () => {
    setSettling(true)
    try {
      const r = await postJson('/api/history/settle')
      await Promise.all([history.reload(), performance.reload()])
      const parts = [r.settled ? `${r.settled} tipp lezárva` : 'Nincs új végeredmény']
      if (r.still_pending) parts.push(`${r.still_pending} még függő`)
      if (r.unsettleable) parts.push(`${r.unsettleable} nem számolható (hiányzó vonal)`)
      showToast(parts.join(', '))
    } catch (e) {
      showToast(`Az elszámolás nem sikerült: ${e.message}`, 'error')
    } finally {
      setSettling(false)
    }
  }, [history, performance, showToast])

  const heroLine2 =
    picks.status === 'loading' && !picks.data
      ? 'A modell még számol.'
      : picks.status === 'error' && !picks.data
        ? 'A modell most nem érhető el.'
        : upcoming === 0
          ? 'Már egy meccs sem indul, így nincs mit összevetni.'
          : flaggedGames === 0
            ? 'A modell sehol nem tér el érdemben a piactól.'
            : `A modell ${flaggedGames} meccsen lát mást, mint a piac.`

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#tartalom" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-board">
        Ugrás a tartalomra
      </a>
      <Navbar activeTab={tab} setActiveTab={setTab} onOpenMethodology={() => setShowMethodology(true)} liveCount={liveCount} />

      <main id="tartalom" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {tab === 'games' && (
          <>
            <section aria-labelledby="hero-title" className="mb-8">
              <p className="eyebrow mb-2">{today()}</p>
              <h1 id="hero-title" className="max-w-4xl font-display text-[clamp(2.4rem,7vw,4.5rem)] font-extrabold uppercase leading-[0.95] tracking-wide">
                {games.data ? `Ma ${gameList.length} meccs.` : games.status === 'error' ? 'A meccslista nem érhető el.' : 'Meccsek betöltése.'}
                <br />
                <span className="text-mute">{heroLine2}</span>
              </h1>
              <div className="mt-5">
                <Evidence performance={performance.data} onOpenLedger={() => setTab('performance')} />
              </div>
            </section>

            {games.status === 'loading' && !games.data && <Loading>Mai mérkőzések betöltése</Loading>}
            {games.status === 'error' && !games.data && (
              <Notice
                tone="error"
                title="A mérkőzések nem töltődtek be"
                action={
                  <button type="button" onClick={games.reload} className="btn btn-solid">
                    Újrapróbálom
                  </button>
                }
              >
                {games.error}. Az adatforrás (ESPN) vagy a szerver nem válaszolt.
              </Notice>
            )}
            {games.data && gameList.length === 0 && (
              <Notice tone="empty" title="Ma nincs NBA-mérkőzés">
                A tabella és a napló ettől függetlenül elérhető.
              </Notice>
            )}
            {gameList.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gameList.map((g) => (
                  <GameCard key={g.id} game={g} picks={picksByGame.get(g.id) ?? []} onSelect={openGame} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'picks' && <PicksView picks={picks} performance={performance} trackedIds={trackedIds} onTrackPick={trackPick} onOpenLedger={() => setTab('performance')} />}
        {tab === 'performance' && <PerformanceView performance={performance} history={history} onSettle={settle} settling={settling} />}
        {tab === 'standings' && <StandingsView standings={standings} />}
      </main>

      <footer className="border-t bg-paper">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-sm text-mute sm:px-6">
          <Legend />
          <p>Adatforrás: az ESPN publikus adatai. Az oldal modellt és piacot hasonlít össze, nem fogadási tanács. A sportfogadás kockázattal jár.</p>
        </div>
      </footer>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
        {toast && (
          <p role="status" className={`fade-in pointer-events-auto max-w-md rounded border px-4 py-3 text-sm font-semibold shadow-lg ${toast.tone === 'error' ? 'border-danger bg-paper text-danger' : 'border-ink bg-ink text-board'}`}>
            {toast.message}
          </p>
        )}
      </div>

      {detail && <GameDetailModal detail={detail} onClose={closeGame} onTrackPick={trackPick} trackedIds={trackedIds} />}
      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
    </div>
  )
}
