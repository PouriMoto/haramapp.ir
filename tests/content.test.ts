import { describe, expect, it } from 'vitest'
import { isSafeMediaPath, mediaUrl, parseManifest } from '../src/content/manifest'
import { homeSlice } from '../src/content/selectors'

const item = (id: string, o: Partial<{ order: number; pinned: boolean; addedAt: string }> = {}) => ({
  id, order: 9999, pinned: false, addedAt: '2026-01-01', ...o,
})

describe('selectors', () => {
  it('حداکثر limit و hasMore', () => {
    const items = Array.from({ length: 8 }, (_, i) => item(`a${i}`))
    const r = homeSlice(items, 5)
    expect(r.shown).toHaveLength(5)
    expect(r.hasMore).toBe(true)
    expect(homeSlice(items.slice(0, 5), 5).hasMore).toBe(false)
  })
  it('ترتیب: pinned → order → جدیدتر', () => {
    const r = homeSlice([item('c', { addedAt: '2026-03-01' }), item('b', { order: 1 }), item('a', { pinned: true, order: 50 }), item('d', { addedAt: '2026-05-01' })], 10)
    expect(r.shown.map((x) => x.id)).toEqual(['a', 'b', 'd', 'c'])
  })
})

describe('manifest client', () => {
  it('مسیر امن و URL', () => {
    expect(isSafeMediaPath('a/b.mp3')).toBe(true)
    for (const bad of ['../x', '/x', '//evil.com/x', 'https://evil.com/x', 'javascript:alert(1)', 'a\\b']) expect(isSafeMediaPath(bad)).toBe(false)
    expect(mediaUrl('https://cdn.x/m/', 'prayers/a b/text.md')).toBe('https://cdn.x/m/prayers/a%20b/text.md')
    expect(() => mediaUrl('', 'a')).toThrow()
  })
  it('آیتم خراب حذف و ساختار خراب خطا', () => {
    const m = parseManifest({ version: 1, prayers: [{ id: 'a', title: 'x', text: 'p/a.md' }, { id: 'b', title: 'y', text: '../evil' }], music: [] })
    expect(m.prayers.map((p) => p.id)).toEqual(['a'])
    expect(() => parseManifest({ version: 2 })).toThrow()
    expect(() => parseManifest(null)).toThrow()
  })
})

import { categoryCounts, inCategory } from '../src/content/selectors'
import { ibanForCopy } from '../src/lib/copy'

describe('دسته‌بندی', () => {
  const cats = [{ id: 'muharram', title: 'محرم' }, { id: 'ramadan', title: 'رمضان' }, { id: 'other', title: 'سایر' }]
  const a = { ...item('a'), categories: ['muharram'] }
  const b = { ...item('b'), categories: ['muharram', 'ramadan'] }
  const c = { ...item('c'), categories: [] as string[] }
  it('فیلتر و شمارش؛ بدون دسته = سایر؛ دستهٔ خالی حذف می‌شود', () => {
    expect(inCategory([a, b, c], 'muharram').map((x) => x.id)).toEqual(['a', 'b'])
    expect(inCategory([a, b, c], 'other').map((x) => x.id)).toEqual(['c'])
    expect(inCategory([a, b, c], null)).toHaveLength(3)
    expect(categoryCounts([a, b, c], cats).map((x) => [x.id, x.count])).toEqual([['muharram', 2], ['ramadan', 1], ['other', 1]])
    expect(categoryCounts([a], cats).map((x) => x.id)).toEqual(['muharram'])
  })
  it('پارس manifest: دسته‌ها و categories هر آیتم', () => {
    const m = parseManifest({ version: 1, categories: [{ id: 'x', title: 'ایکس', order: 2 }, { id: 'y', title: 'وای', order: 1 }, { bad: 1 }], prayers: [{ id: 'p', title: 't', text: 'a.md', categories: ['x', 5] }], music: [] })
    expect(m.categories.map((x) => x.id)).toEqual(['y', 'x'])
    expect(m.prayers[0].categories).toEqual(['x'])
  })
})

describe('کپی شبا', () => {
  it('IR از مقدار کپی حذف می‌شود', () => {
    expect(ibanForCopy('IR062010000000123456789012')).toBe('062010000000123456789012')
    expect(ibanForCopy('ir0620')).toBe('0620')
    expect(ibanForCopy('062010')).toBe('062010')
  })
})

import { activeBanners, pickBanner } from '../src/content/selectors'
import { isSafeHref } from '../src/content/manifest'

describe('بنرها', () => {
  const b = (id: string, o: Record<string, unknown> = {}) => ({ id, placement: 'both' as const, weight: 0, ...o })
  const NOW = Date.parse('2026-06-15T00:00:00Z')

  it('فیلتر جایگاه و بازهٔ تاریخ، ترتیب weight', () => {
    const list = [
      b('a', { placement: 'home' }), b('m', { placement: 'messages' }), b('both', { weight: 5 }),
      b('future', { startsAt: '2026-07-01T00:00:00Z' }), b('past', { endsAt: '2026-06-01T00:00:00Z' }),
      b('now', { startsAt: '2026-06-01T00:00:00Z', endsAt: '2026-06-30T00:00:00Z' }),
    ]
    expect(activeBanners(list, 'home', NOW).map((x) => x.id)).toEqual(['both', 'a', 'now'])
    expect(activeBanners(list, 'messages', NOW).map((x) => x.id)).toEqual(['both', 'm', 'now'])
  })
  it('pickBanner چرخشی و ایمن', () => {
    expect(pickBanner([], 3)).toBeNull()
    expect([0, 1, 2, 3, -1].map((s) => pickBanner(['x', 'y', 'z'], s))).toEqual(['x', 'y', 'z', 'x', 'z'])
  })
  it('href امن', () => {
    for (const ok of ['https://a.ir/x?y=1', '/help/mosque', '/prayers?cat=muharram']) expect(isSafeHref(ok)).toBe(true)
    for (const bad of ['http://a.ir', '//evil.com', 'javascript:alert(1)', 'data:text/html,x', 'https://a b', '']) expect(isSafeHref(bad)).toBe(false)
  })
  it('پارس manifest: بنر ناامن حذف می‌شود', () => {
    const m = parseManifest({ version: 1, prayers: [], music: [], banners: [
      { id: 'ok', image: 'banners/a.webp', href: 'https://x.ir' }, { id: 'txt', title: 'محرم', href: '/prayers?cat=muharram', kind: 'ad' },
      { id: 'evil1', image: '../x.png' }, { id: 'evil2', title: 't', href: 'javascript:alert(1)' }, { id: 'empty' },
    ] })
    expect(m.banners.map((x) => x.id)).toEqual(['ok', 'txt'])
    expect(m.banners[1].kind).toBe('ad')
  })
})

