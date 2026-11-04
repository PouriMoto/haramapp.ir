const KEY = 'haram.clientId'
let memory: string | null = null

function make(): string {
  return globalThis.crypto?.randomUUID?.() ?? `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

/** شناسه ناشناس دستگاه؛ اگر localStorage در دسترس نبود در حافظه می‌ماند. */
export function getClientId(): string {
  try {
    const v = localStorage.getItem(KEY)
    if (v) return v
    const id = make()
    localStorage.setItem(KEY, id)
    return id
  } catch {
    return (memory ??= make())
  }
}
