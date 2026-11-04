import { useSyncExternalStore } from 'react'

export type ToastKind = 'info' | 'ok' | 'warn'
export interface ToastItem { id: number; text: string; kind: ToastKind }

let current: ToastItem | null = null
let seq = 0
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** پیام کوتاه و گذرا برای هر اکشن کاربر؛ از هر جا (حتی خارج از React) صدا زده می‌شود. */
export function toast(text: string, kind: ToastKind = 'info', ms = 2600): void {
  current = { id: ++seq, text, kind }
  clearTimeout(timer)
  timer = setTimeout(() => { current = null; emit() }, ms)
  emit()
}

export function useToast(): ToastItem | null {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => current,
    () => null,
  )
}
