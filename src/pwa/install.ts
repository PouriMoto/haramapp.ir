import { useSyncExternalStore } from 'react'
import { readJson, writeJson } from '../lib/storage'

interface BIPEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const KEY = 'haram.install.v2'
const DAY = 24 * 60 * 60 * 1000
interface InstallState { count: number; last: number }

/**
 * زمان‌بندی نمایش: بازدید اول → نمایش؛ بعد از «بعداً» در بازدید بعدی دوباره؛
 * بعد از دومین «بعداً» ۷ روز صبر؛ از آن به بعد هر ۱۴ روز.
 * (داخل همان بازدید پس از «بعداً» دوباره نمایش داده نمی‌شود: hiddenThisVisit)
 */
export function installDue(s: InstallState, now: number): boolean {
  if (s.count <= 1) return true
  return now - s.last >= (s.count === 2 ? 7 : 14) * DAY
}
let hiddenThisVisit = false
let deferred: BIPEvent | null = null
let installed = false
let version = 0
const listeners = new Set<() => void>()
const emit = () => { version++; listeners.forEach((l) => l()) }

/** باید خیلی زود (قبل از React) صدا زده شود تا رویداد از دست نرود. */
export function initInstall() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; emit() })
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; emit() })
}

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function dismissInstall() {
  const s = readJson<InstallState>(KEY, { count: 0, last: 0 })
  writeJson(KEY, { count: s.count + 1, last: Date.now() } satisfies InstallState)
  hiddenThisVisit = true
  emit()
}

export async function runInstall() {
  if (!deferred) return
  const ev = deferred
  deferred = null
  await ev.prompt()
  const { outcome } = await ev.userChoice
  if (outcome === 'dismissed') dismissInstall()
  else emit()
}

const snoozed = () => hiddenThisVisit || !installDue(readJson<InstallState>(KEY, { count: 0, last: 0 }), Date.now())

export type InstallMode = 'native' | 'ios' | null

export function useInstallMode(): InstallMode {
  useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => version, () => 0)
  if (installed || standalone()) return null
  if (snoozed()) return null
  if (deferred) return 'native'
  return isIos() ? 'ios' : null
}
