import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query'

const KEY = 'haram.qcache.v1'
const MAX_AGE = 24 * 60 * 60 * 1000
const MAX_BYTES = 300_000
// فقط دادهٔ عمومی و کم‌حجم. پرداخت‌های من، پیام‌های بی‌نهایت و متن دعا ذخیره نمی‌شوند.
const ALLOW = new Set(['manifest', 'stats', 'causes', 'cause', 'helpConfig', 'helpTotal'])

interface Stored { t: number; build: string; state: ReturnType<typeof dehydrate> }

/** بازدید دوم: دادهٔ ذخیره‌شده فوراً نمایش داده می‌شود و در پس‌زمینه تازه می‌گردد (stale-while-revalidate). */
export function restoreCache(qc: QueryClient, storage: Pick<Storage, 'getItem' | 'removeItem'> = localStorage, build = __BUILD_ID__, now = Date.now()) {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return
    const s = JSON.parse(raw) as Stored
    if (s.build !== build || now - s.t > MAX_AGE) { storage.removeItem(KEY); return }
    hydrate(qc, s.state)
  } catch {
    try { storage.removeItem(KEY) } catch { /* ignore */ }
  }
}

export function persistCache(qc: QueryClient, storage: Pick<Storage, 'setItem'> = localStorage, build = __BUILD_ID__, delayMs = 1000) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const unsubscribe = qc.getQueryCache().subscribe(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        const state = dehydrate(qc, { shouldDehydrateQuery: (q) => q.state.status === 'success' && ALLOW.has(String(q.queryKey[0])) })
        const json = JSON.stringify({ t: Date.now(), build, state } satisfies Stored)
        if (json.length <= MAX_BYTES) storage.setItem(KEY, json)
      } catch { /* حافظه پر یا غیرفعال: مهم نیست */ }
    }, delayMs)
  })
  return () => { clearTimeout(timer); unsubscribe() }
}
