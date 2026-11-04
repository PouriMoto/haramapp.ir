import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { env } from '../config/env'
import { ApiError } from '../data/errors'
import { mediaUrl, parseManifest } from './manifest'
import { activeBanners, categoryCounts, homeSlice, inCategory, sortContent } from './selectors'

async function fetchJson(url: string): Promise<unknown> {
  let res: Response
  try { res = await fetch(url) } catch { throw new ApiError('network', 'اتصال برقرار نشد') }
  if (!res.ok) throw new ApiError(res.status === 404 ? 'not_found' : 'server', `خطا در دریافت (${res.status})`)
  try { return await res.json() } catch { throw new ApiError('server', 'پاسخ نامعتبر است') }
}

export function useManifest() {
  return useQuery({
    queryKey: ['manifest'],
    queryFn: async () => parseManifest(await fetchJson(mediaUrl(env.mediaBaseUrl, 'manifest.json'))),
    staleTime: 5 * 60_000,
  })
}

export function useHomeVideo() {
  const q = useManifest()
  return { ...q, data: q.data?.video }
}

export function useVideos() {
  const q = useManifest()
  return { ...q, data: q.data ? sortContent(q.data.videos) : undefined }
}

export function usePrayers() {
  const q = useManifest()
  return { ...q, data: q.data ? sortContent(q.data.prayers) : undefined }
}

export function useMusic() {
  const q = useManifest()
  return { ...q, data: q.data ? sortContent(q.data.music) : undefined }
}

/** بنرهای فعال یک جایگاه؛ «اکنون» هنگام mount ثابت می‌ماند تا لیست با هر رندر جابه‌جا نشود */
export function useBanners(placement: 'home' | 'messages') {
  const q = useManifest()
  const [now] = useState(() => Date.now())
  return useMemo(() => (q.data ? activeBanners(q.data.banners, placement, now) : []), [q.data, placement, now])
}

export function useCategories() {
  const q = useManifest()
  return q.data?.categories ?? []
}

/** صفحهٔ اصلی: با دستهٔ انتخابی (اختیاری) حداکثر `homeLimit` دعا و موزیک؛ chips با تعداد کل (دعا + موزیک) */
export function useHomeContent(cat: string | null) {
  const q = useManifest()
  const m = q.data
  const chips = m ? categoryCounts([...m.prayers, ...m.music], m.categories) : []
  const vids = m ? sortContent(m.videos) : []
  const featured = vids.find((v) => v.featured)
  const active = cat && chips.some((c) => c.id === cat) ? cat : null
  return {
    ...q,
    data: m && {
      chips,
      active,
      totalAll: m.prayers.length + m.music.length,
      prayers: homeSlice(inCategory(m.prayers, active), env.homeLimit),
      music: homeSlice(inCategory(m.music, active), env.homeLimit),
      featured,
      videos: homeSlice(vids.filter((v) => v !== featured), env.homeLimit),
    },
  }
}

/** متن دعا (markdown) — نشست ۴ آن را رندر می‌کند */
export function usePrayerText(path: string | undefined) {
  return useQuery({
    queryKey: ['prayerText', path],
    enabled: !!path,
    staleTime: 24 * 60 * 60_000,
    queryFn: async () => {
      const res = await fetch(mediaUrl(env.mediaBaseUrl, path as string))
      if (!res.ok) throw new ApiError('not_found', 'متن پیدا نشد')
      return res.text()
    },
  })
}

/** تبدیل مسیر نسبی manifest به URL کامل (کامپوننت‌ها env را نمی‌شناسند) */
export function resolveMedia(path: string): string {
  return mediaUrl(env.mediaBaseUrl, path)
}
