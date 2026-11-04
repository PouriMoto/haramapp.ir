import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isHttpsUrl, mediaUrl, parseManifest } from '../src/content/manifest'
// @ts-expect-error اسکریپت JS خالص
import { buildContent } from '../scripts/lib/buildContent.mjs'

const ERFAN = 'https://file.erfan.ir/a.mp3?seed=10'
async function data(content: unknown, files: Record<string, string> = {}) {
  const d = await mkdtemp(join(tmpdir(), 'data-'))
  await mkdir(join(d, 'prayers'), { recursive: true })
  await mkdir(join(d, 'banners'), { recursive: true })
  await writeFile(join(d, 'content.json'), typeof content === 'string' ? content : JSON.stringify(content))
  for (const [f, c] of Object.entries(files)) await writeFile(join(d, f), c)
  return d
}

describe('buildContent (data/ → manifest)', () => {
  it('نمونهٔ کامل: دعا، نوا، ویدیو، ترتیب فهرست، pinned اول، خروجی توسط کلاینت پذیرفته می‌شود', async () => {
    const d = await data({
      prayers: [{ id: 'a', title: 'الف', audio: ERFAN }, { id: 'b', title: 'ب', pinned: true }],
      music: [{ title: 'نوا', src: 'https://mir1.kashoob.com/x.mp3?name=a' }],
      videos: [{ title: 'معرفی', aparat: 'ckn3o4e', featured: true }],
    }, { 'prayers/a.md': '# الف\nمتن' })
    const r = await buildContent(d)
    expect(r.errors).toEqual([])
    expect(r.manifest.prayers.map((p: { id: string }) => p.id)).toEqual(['b', 'a'])
    expect(r.texts.a).toContain('متن')
    expect(r.texts.b).toBe('# ب\n') // بدون فایل md: فقط عنوان
    expect(r.manifest.music[0].id).toMatch(/^m-[0-9a-f]{8}$/)
    const m = parseManifest(r.manifest)
    expect(m.prayers).toHaveLength(2)
    expect(m.music[0].src).toBe('https://mir1.kashoob.com/x.mp3?name=a')
    expect(m.videos[0]).toMatchObject({ aparat: 'ckn3o4e', featured: true })
    expect(mediaUrl('/content', ERFAN)).toBe(ERFAN)
  })

  it('خطاهای قابل‌فهم: JSON خراب، id گم، لینک سایت نامجاز، aparat بد، دستهٔ ناشناخته، id تکراری', async () => {
    const r1 = await buildContent(await data('{ "prayers": [ { oops } ] }'))
    expect(r1.errors[0]).toMatch(/JSON نامعتبر/)
    const r2 = await buildContent(await data({
      prayers: [{ title: 'بی‌id' }, { id: 'x', title: 'x', audio: 'https://evil.example/a.mp3' }, { id: 'y', title: 'y', categories: ['nope'] }, { id: 'y', title: 'dup' }],
      music: [{ title: 't', src: 'http://file.erfan.ir/a.mp3' }],
      videos: [{ title: 'v', aparat: 'a b' }],
    }))
    const e = r2.errors.join('\n')
    for (const m of ['«id» لازم است', 'allowedHosts', 'دستهٔ ناشناخته (nope)', 'شناسهٔ تکراری', 'https', 'شناسهٔ ویدیو']) expect(e).toContain(m)
  })

  it('allowedHosts قابل تنظیم است و زیردامنه مجاز', async () => {
    const r = await buildContent(await data({ allowedHosts: ['cdn.example.org'], music: [{ title: 't', src: 'https://a.cdn.example.org/x.mp3' }, { title: 'u', src: ERFAN }] }))
    expect(r.manifest.music).toHaveLength(1)
    expect(r.errors).toHaveLength(1)
  })

  it('بنر: فایل محلی کپی می‌شود، enabled=false حذف، href/تاریخ/تصویر نامعتبر خطا', async () => {
    const d = await data({ banners: [
      { id: 'ram', image: 'a.webp', href: '/prayers?cat=ramadan', weight: 5 },
      { id: 'sp', kind: 'ad', title: 'حامی', href: 'https://x.ir' },
      { id: 'off', title: 'x', enabled: false },
    ] }, { 'banners/a.webp': 'x' })
    const r = await buildContent(d)
    expect(r.errors).toEqual([])
    expect(r.manifest.banners.map((b: { id: string }) => b.id)).toEqual(['ram', 'sp'])
    expect(r.manifest.banners[0].image).toBe('banners/a.webp')
    expect(r.copies).toHaveLength(1)
    expect(r.warnings.join()).toMatch(/بدون sponsor/)
    expect(parseManifest(r.manifest).banners).toHaveLength(2)

    const bad = await buildContent(await data({ banners: [{ id: 'x1', image: 'missing.webp' }, { id: 'x2', title: 't', href: 'http://insecure.ir' }, { id: 'x3' }, { id: 'x4', title: 't', endsAt: 'nope' }] }))
    expect(bad.errors).toHaveLength(4)
  })

  it('isHttpsUrl', () => {
    expect(isHttpsUrl('https://a.ir/x')).toBe(true)
    for (const x of ['http://a.ir', 'https://u:p@a.ir', 'javascript:alert(1)', '//a.ir', 'abc']) expect(isHttpsUrl(x)).toBe(false)
  })
  it('کلاینت: آیتم با لینک http/ناامن حذف می‌شود', () => {
    const m = parseManifest({ version: 1, prayers: [], music: [{ id: 'a', title: 'x', src: ERFAN }, { id: 'b', title: 'x', src: 'http://x.ir/a.mp3' }, { id: 'c', title: 'x', src: '//evil/a.mp3' }] })
    expect(m.music.map((x) => x.id)).toEqual(['a'])
  })
})
