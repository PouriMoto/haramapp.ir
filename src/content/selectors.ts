export interface Sortable { id: string; order: number; pinned: boolean; addedAt: string; categories: string[] }

/** pinned → order → جدیدترین → id (همان ترتیب اسکریپت publish) */
export function sortContent<T extends Sortable>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order || b.addedAt.localeCompare(a.addedAt) || a.id.localeCompare(b.id),
  )
}

/** صفحه اصلی: حداکثر `limit` مورد؛ بقیه در صفحهٔ «همه» */
export function homeSlice<T extends Sortable>(items: readonly T[], limit: number) {
  const sorted = sortContent(items)
  return { shown: sorted.slice(0, limit), total: sorted.length, hasMore: sorted.length > limit }
}

/** فیلتر دسته؛ آیتم بدون دسته در «other» حساب می‌شود. cat خالی = همه */
export function inCategory<T extends Sortable>(items: readonly T[], cat: string | null | undefined): T[] {
  if (!cat) return [...items]
  return items.filter((i) => i.categories.includes(cat) || (cat === 'other' && i.categories.length === 0))
}

/** دسته‌هایی که حداقل یک آیتم دارند، با تعداد؛ به ترتیب دسته‌ها */
export function categoryCounts<T extends Sortable>(items: readonly T[], categories: readonly { id: string; title: string }[]) {
  return categories
    .map((c) => ({ ...c, count: inCategory(items, c.id).length }))
    .filter((c) => c.count > 0)
}

export interface BannerLike {
  id: string
  placement: 'home' | 'messages' | 'both'
  startsAt?: string
  endsAt?: string
  weight: number
}

/** بنرهای فعال برای یک جایگاه در لحظهٔ `now` (بازهٔ تاریخ شامل ابتدا و انتها) */
export function activeBanners<T extends BannerLike>(banners: readonly T[], placement: 'home' | 'messages', now: number): T[] {
  return banners
    .filter((b) => b.placement === 'both' || b.placement === placement)
    .filter((b) => (!b.startsAt || Date.parse(b.startsAt) <= now) && (!b.endsAt || now <= Date.parse(b.endsAt)))
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
}

/** انتخاب چرخشی: slot مثلاً شمارهٔ جایگاه در لیست؛ همان ورودی = همان خروجی (قابل پیش‌بینی/تست) */
export function pickBanner<T>(list: readonly T[], slot: number): T | null {
  return list.length === 0 ? null : list[((slot % list.length) + list.length) % list.length]
}
