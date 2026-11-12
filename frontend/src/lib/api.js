import { useCallback, useEffect, useRef, useState } from 'react'

export async function errorText(res) {
  try {
    const body = await res.json()
    // A szerver üzenete ponttal zárul, a felület szövegei maguk teszik ki a pontot.
    if (body && typeof body.detail === 'string') return body.detail.replace(/[.\s]+$/, '')
  } catch {
    /* nem JSON válasz */
  }
  return `A szerver ${res.status} állapotkóddal válaszolt`
}

export async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errorText(res))
  return res.json()
}

// Egy végpont lekérése betöltés-, hiba- és frissítési állapottal. Az újabb kérés megszakítja a régit.
export function useResource(url) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const controller = useRef(null)

  const load = useCallback(async () => {
    controller.current?.abort()
    const c = new AbortController()
    controller.current = c
    setState((s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }))
    try {
      const res = await fetch(url, { signal: c.signal })
      if (!res.ok) throw new Error(await errorText(res))
      setState({ status: 'ok', data: await res.json(), error: null })
    } catch (e) {
      if (e.name === 'AbortError') return
      setState((s) => ({ status: 'error', data: s.data, error: e.message || 'Ismeretlen hiba' }))
    }
  }, [url])

  useEffect(() => {
    load()
    return () => controller.current?.abort()
  }, [load])

  return { ...state, reload: load }
}
