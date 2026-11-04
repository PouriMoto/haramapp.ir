/* Service worker haramapp — در build توسط vite.config.ts پر می‌شود (نسخه و فهرست precache). *
 * اصول: ۱) پوستهٔ اپ آفلاین بالا بیاید. ۲) صوت/ویدیو هرگز کش نشود (حجم + Range). ۳) پاسخ opaque کش نشود.
 * ۴) نسخهٔ جدید تا بسته شدن همهٔ تب‌ها منتظر می‌ماند (تب بازِ قدیمی chunk حذف‌شده نمی‌خواهد). */
const VERSION = '__VERSION__'
const PRECACHE = `haram-precache-${VERSION}`
const RUNTIME = 'haram-runtime-v1'
const SCOPE = self.registration.scope
const FILES = __PRECACHE__.map((p) => new URL(p, SCOPE).href)
const SHELL = new URL('./', SCOPE).href
const SWR = /(?:\/manifest\.json|\.md)$/ // manifest رسانه و متن دعاها (کوچک و تغییرپذیر)

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PRECACHE).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })))))
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== PRECACHE && k !== RUNTIME) await caches.delete(k)
    await self.clients.claim()
  })())
})

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting() })

const cacheable = (res) => res && res.ok && res.type !== 'opaque'

async function networkFirst(req, fallbackUrl) {
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))])
    return res
  } catch {
    return (await caches.match(fallbackUrl, { ignoreVary: true })) ?? Response.error()
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req, { ignoreVary: true }) // Vary: Origin روی اسکریپت‌های crossorigin نباید کش را خطا بدهد
  if (hit) return hit
  const res = await fetch(req)
  if (cacheable(res)) (await caches.open(RUNTIME)).put(req, res.clone())
  return res
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME)
  const hit = await cache.match(req, { ignoreVary: true })
  const net = fetch(req).then((res) => { if (cacheable(res)) cache.put(req, res.clone()); return res }).catch(() => null)
  return hit ?? (await net) ?? Response.error()
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || req.headers.has('range')) return
  if (req.destination === 'audio' || req.destination === 'video') return
  const url = new URL(req.url)

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') return e.respondWith(networkFirst(req, SHELL))
    const scopePath = new URL(SCOPE).pathname
    // محتوا (manifest و متن دعاها) در همین سایت است: اول کش (سریع/آفلاین)، همزمان تازه می‌شود
    if (url.pathname.startsWith(scopePath + 'content/') && !req.destination.match(/^(audio|video)$/)) return e.respondWith(staleWhileRevalidate(req))
    if (url.pathname.startsWith(scopePath + 'assets/')) return e.respondWith(cacheFirst(req)) // نام‌ها هش‌دارند
    if (FILES.includes(url.href)) return e.respondWith(cacheFirst(req))
    return
  }
  // هاست رسانه (CORS): فقط manifest و متن دعا. تصویر/صوت/ویدیو و API دست‌نخورده می‌ماند.
  if (req.mode === 'cors' && SWR.test(url.pathname)) e.respondWith(staleWhileRevalidate(req))
})
