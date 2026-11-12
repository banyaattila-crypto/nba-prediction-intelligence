import React from 'react'
import { BookOpen } from 'lucide-react'

const TABS = [
  { id: 'games', label: 'Mérkőzések' },
  { id: 'picks', label: 'Eltérések' },
  { id: 'performance', label: 'Napló' },
  { id: 'standings', label: 'Tabella' },
]

export default function Navbar({ activeTab, setActiveTab, onOpenMethodology, liveCount = 0 }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-board/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 sm:flex-nowrap sm:px-6">
        <button type="button" onClick={() => setActiveTab('games')} className="py-3 text-left" aria-label="Tábla – vissza a mérkőzésekhez">
          <span className="block font-display text-3xl font-extrabold uppercase leading-none tracking-[0.08em]">Tábla</span>
          <span className="eyebrow !text-[10px]">NBA · modell és piac</span>
        </button>

        <nav aria-label="Fő navigáció" className="order-3 -mb-0.5 -mx-4 flex w-[calc(100%+2rem)] overflow-x-auto border-t px-4 sm:order-none sm:mx-0 sm:w-auto sm:min-w-0 sm:flex-1 sm:justify-center sm:self-stretch sm:border-t-0 sm:px-0">
          <ul className="flex">
            {TABS.map((t) => {
              const active = activeTab === t.id
              return (
                <li key={t.id} className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`whitespace-nowrap border-b-[3px] px-3 py-2.5 text-sm font-semibold transition-colors sm:px-5 sm:py-0 ${
                      active ? 'border-model text-ink' : 'border-transparent text-mute hover:text-ink'
                    }`}
                  >
                    {t.label}
                    {t.id === 'games' && liveCount > 0 && (
                      <span className="tag ml-2 border-ink bg-ink text-board">{liveCount} élő</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <button type="button" onClick={onOpenMethodology} className="btn btn-ghost shrink-0 !px-2.5 sm:!px-3.5">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Módszertan</span>
          <span className="sr-only sm:hidden">Módszertan</span>
        </button>
      </div>
    </header>
  )
}
