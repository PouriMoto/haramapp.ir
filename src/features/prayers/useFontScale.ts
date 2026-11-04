import { useCallback, useState } from 'react'

const KEY = 'haram.fontScale'
const MIN = 0.9
const MAX = 1.7
const STEP = 0.1

function load(): number {
  try {
    const n = Number(localStorage.getItem(KEY))
    return n >= MIN && n <= MAX ? n : 1
  } catch {
    return 1
  }
}

/** اندازه متن خوانش؛ فقط یک راحتی شخصی است، پس خطای localStorage بی‌صدا نادیده گرفته می‌شود. */
export function useFontScale() {
  const [scale, setScale] = useState(load)
  const change = useCallback((delta: number) => {
    setScale((s) => {
      const next = Math.round(Math.min(MAX, Math.max(MIN, s + delta)) * 10) / 10
      try { localStorage.setItem(KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])
  return { scale, bigger: () => change(STEP), smaller: () => change(-STEP), canBigger: scale < MAX - 1e-9, canSmaller: scale > MIN + 1e-9 }
}
