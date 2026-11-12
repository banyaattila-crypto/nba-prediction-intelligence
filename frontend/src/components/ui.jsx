import React, { useEffect, useRef, useState } from 'react'
import { X, AlertTriangle, Info } from 'lucide-react'

// Az eredet jelölése: minden számról látszik, honnan jön. Szín és forma együtt hordozza (nem csak szín).
const MARKS = {
  source: { glyph: '●', cls: 'text-ink', label: 'forrásadat (ESPN)' },
  market: { glyph: '■', cls: 'text-market', label: 'piaci ár' },
  model: { glyph: '◆', cls: 'text-model', label: 'modell' },
  assumed: { glyph: '○', cls: 'text-mute', label: 'becsült alapérték, nem mért' },
}

export function Mark({ kind, title }) {
  const m = MARKS[kind]
  return (
    <span className={`${m.cls} align-middle text-[0.7em] leading-none`} role="img" aria-label={m.label} title={title || m.label}>
      {m.glyph}
    </span>
  )
}

export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-mute">
      {Object.keys(MARKS).map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <Mark kind={k} />
          <span>{MARKS[k].label}</span>
        </li>
      ))}
    </ul>
  )
}

export function Logo({ team, size = 40 }) {
  const [failed, setFailed] = useState(false)
  if (!team.logo || failed) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full border font-mono text-[10px] font-semibold text-mute"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {team.abbreviation}
      </span>
    )
  }
  return (
    <img
      src={team.logo}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

export function SectionHead({ eyebrow, title, children }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide sm:text-4xl">{title}</h2>
      </div>
      {children}
    </header>
  )
}

const TONES = {
  info: { icon: Info, cls: 'border-line' },
  empty: { icon: Info, cls: 'border-dashed border-mute/50' },
  error: { icon: AlertTriangle, cls: 'border-danger/60' },
}

// Üres és hibaállapot: megmondja, mi történt, és mit lehet tenni.
export function Notice({ tone = 'info', title, children, action }) {
  const { icon: Icon, cls } = TONES[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`panel flex items-start gap-3 p-4 sm:p-5 ${cls}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone === 'error' ? 'text-danger' : 'text-mute'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm text-mute">{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

export function Loading({ children }) {
  return (
    <p role="status" className="py-16 text-center font-mono text-sm text-mute">
      {children}…
    </p>
  )
}

// Párbeszédablak: Esc zár, a fókusz bent marad, a háttér nem görgethető.
export function Dialog({ title, onClose, children, wide = false }) {
  const panel = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement
    const scrollLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') return closeRef.current()
      if (e.key !== 'Tab' || !panel.current) return
      const items = panel.current.querySelectorAll('a[href], button:not([disabled]), input, select, summary, [tabindex]:not([tabindex="-1"])')
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = scrollLock
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-0 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`fade-in relative my-0 w-full bg-board sm:my-4 sm:rounded-lg sm:border ${wide ? 'max-w-5xl' : 'max-w-3xl'} outline-none`}
      >
        <button type="button" onClick={onClose} className="btn btn-ghost absolute right-3 top-3 z-10 !p-2" aria-label="Bezárás">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  )
}
