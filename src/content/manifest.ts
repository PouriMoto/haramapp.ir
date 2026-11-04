import { ApiError } from '../data/errors'
import type { Banner, Category, HeroVideo, Manifest, Music, Prayer, VideoItem } from './types'

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0

/** https مطلق بدون user:pass. (فهرست سایت‌های مجاز هنگام ساخت محتوا در data/content.json بررسی می‌شود؛ manifest همان‌سایت قابل اعتماد است.) */
export function isHttpsUrl(u: string): boolean {
  try {
    const x = new URL(u)
    return x.protocol === 'https:' && !x.username && !x.password
  } catch { return false }
}

export const isAbsoluteUrl = (p: string) => /^https:\/\//i.test(p)

/** مسیر نسبی امن: بدون scheme، بدون «..»، بدون اسلش ابتدایی */
export function isSafeMediaPath(p: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/i.test(p) && !p.startsWith('/') && !p.startsWith('//') && !p.split('/').includes('..') && !p.includes('\\')
}

export function mediaUrl(base: string, path: string): string {
  if (isAbsoluteUrl(path)) return path // قبلاً در parseManifest با فهرست سفید اعتبارسنجی شده
  if (!base) throw new ApiError('server', 'VITE_MEDIA_BASE_URL تنظیم نشده')
  if (!isSafeMediaPath(path)) throw new ApiError('validation', 'مسیر رسانه نامعتبر')
  return `${base.replace(/\/+$/, '')}/${path.split('/').map(encodeURIComponent).join('/')}`
}

function item<T extends Prayer | Music>(v: unknown, pathKeys: string[]): T | null {
  if (!isObj(v) || !str(v.id) || !str(v.title)) return null
  const audioOk = (p: string) => (isAbsoluteUrl(p) ? isHttpsUrl(p) : isSafeMediaPath(p))
  for (const k of pathKeys) if (!str(v[k]) || !(k === 'src' ? audioOk(v[k]) : isSafeMediaPath(v[k]))) return null
  if (v.audio !== undefined && (!str(v.audio) || !audioOk(v.audio))) return null
  if (v.cover !== undefined && (!str(v.cover) || !(isAbsoluteUrl(v.cover) ? isHttpsUrl(v.cover) : isSafeMediaPath(v.cover)))) return null
  return {
    ...v,
    order: typeof v.order === 'number' ? v.order : 9999,
    pinned: v.pinned === true,
    categories: Array.isArray(v.categories) ? v.categories.filter((c): c is string => typeof c === 'string') : [],
    addedAt: typeof v.addedAt === 'string' ? v.addedAt : '',
  } as unknown as T
}

function parseVideo(v: unknown): HeroVideo | undefined {
  if (!isObj(v) || !str(v.src) || !isSafeMediaPath(v.src)) return undefined
  const poster = str(v.poster) && isSafeMediaPath(v.poster) ? v.poster : undefined
  return { src: v.src, ...(poster ? { poster } : {}) }
}

const HASH_RE = /^[A-Za-z0-9]{3,16}$/
function parseVideos(v: unknown): VideoItem[] {
  if (!Array.isArray(v)) return []
  const out: VideoItem[] = []
  for (const x of v) {
    if (!isObj(x) || !str(x.id) || !str(x.title) || !str(x.aparat) || !HASH_RE.test(x.aparat)) continue
    const poster = str(x.poster) && (isAbsoluteUrl(x.poster) ? isHttpsUrl(x.poster) : isSafeMediaPath(x.poster)) ? x.poster : undefined
    out.push({ id: x.id, title: x.title, aparat: x.aparat, featured: x.featured === true, ...(poster ? { poster } : {}), order: typeof x.order === 'number' ? x.order : 9999, pinned: x.pinned === true, categories: [], addedAt: typeof x.addedAt === 'string' ? x.addedAt : '' })
  }
  return out
}

/** href فقط https:// مطلق یا مسیر داخلی `/...` (نه `//host`، نه javascript:) */
export function isSafeHref(h: string): boolean {
  return /^https:\/\/[^\s]+$/.test(h) || /^\/(?!\/)[^\s]*$/.test(h)
}

function parseBanners(v: unknown): Banner[] {
  if (!Array.isArray(v)) return []
  const out: Banner[] = []
  for (const b of v) {
    if (!isObj(b) || !str(b.id)) continue
    const image = str(b.image) && (isAbsoluteUrl(b.image) ? isHttpsUrl(b.image) : isSafeMediaPath(b.image)) ? b.image : undefined
    const title = str(b.title) ? b.title : undefined
    if (b.image !== undefined && !image) continue // مسیر تصویر ناامن → کل بنر حذف
    if (!image && !title) continue
    if (b.href !== undefined && !(str(b.href) && isSafeHref(b.href))) continue
    const opt = (k: string) => (str(b[k]) ? (b[k] as string) : undefined)
    out.push({
      id: b.id, kind: b.kind === 'ad' ? 'ad' : 'campaign',
      placement: b.placement === 'home' || b.placement === 'messages' ? b.placement : 'both',
      image, title, text: opt('text'), alt: opt('alt'), sponsor: opt('sponsor'), href: opt('href'),
      startsAt: opt('startsAt'), endsAt: opt('endsAt'), weight: typeof b.weight === 'number' ? b.weight : 0,
    })
  }
  return out
}

function parseCategories(v: unknown): Category[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((c): c is Record<string, unknown> => isObj(c) && str(c.id) && str(c.title))
    .map((c, i) => ({ id: c.id as string, title: c.title as string, order: typeof c.order === 'number' ? c.order : i + 1 }))
    .sort((a, b) => a.order - b.order)
}

/** ورودی بیرونی را اعتبارسنجی می‌کند؛ آیتم خراب حذف می‌شود، ساختار خراب خطا می‌دهد. */
export function parseManifest(raw: unknown): Manifest {
  if (!isObj(raw) || raw.version !== 1 || !Array.isArray(raw.prayers) || !Array.isArray(raw.music)) {
    throw new ApiError('server', 'manifest نامعتبر است')
  }
  return {
    version: 1,
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : '',
    video: parseVideo(raw.video),
    categories: parseCategories(raw.categories),
    banners: parseBanners(raw.banners),
    prayers: raw.prayers.map((p) => item<Prayer>(p, ['text'])).filter((x): x is Prayer => x !== null),
    videos: parseVideos(raw.videos),
    music: raw.music.map((m) => item<Music>(m, ['src'])).filter((x): x is Music => x !== null),
  }
}
