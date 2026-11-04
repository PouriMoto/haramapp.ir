import { readJson, writeJson } from './storage'

export type Theme = 'light' | 'dark'
const KEY = 'haram.theme'

export function currentTheme(): Theme {
  const saved = readJson<Theme | null>(KEY, null)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(t: Theme = currentTheme()) {
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0e1a1c' : '#00838f')
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  writeJson(KEY, next)
  applyTheme(next)
  return next
}
