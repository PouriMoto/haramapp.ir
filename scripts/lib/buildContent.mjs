// منطق خالص ساخت manifest از پوشهٔ data/ (بدون وابستگی؛ قابل تست).
// ورودی:  data/content.json  +  data/prayers/<id>.md (اختیاری)  +  data/banners/* (اختیاری)
// خروجی: { manifest, texts: {id: markdown}, copies: [{from,to}], errors, warnings }
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/
const HASH_RE = /^[A-Za-z0-9]{3,16}$/
const DEFAULT_HOSTS = ['file.erfan.ir', 'kashoob.com']
const BANNER_KINDS = ['ad', 'campaign']
const BANNER_PLACEMENTS = ['home', 'messages', 'both']
const IMG_EXT = /\.(webp|jpg|jpeg|png)$/i

export const DEFAULT_CATEGORIES = [
  { id: 'fatemiyeh', title: 'فاطمیه', order: 1 },
  { id: 'muharram', title: 'محرم', order: 2 },
  { id: 'ramadan', title: 'ماه رمضان', order: 3 },
  { id: 'qadr', title: 'شب‌های قدر', order: 4 },
  { id: 'other', title: 'سایر', order: 99 },
]

const exists = (p) => stat(p).then(() => true, () => false)
const safeHref = (h) => typeof h === 'string' && (/^https:\/\/[^\s]+$/.test(h) || /^\/(?!\/)[^\s]*$/.test(h))
const isDate = (d) => d === undefined || (typeof d === 'string' && !Number.isNaN(Date.parse(d)))
const hashId = (prefix, ...parts) => `${prefix}-${createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 8)}`

export async function buildContent(dataDir, { now = new Date() } = {}) {
  const errors = []
  const warnings = []
  const copies = []
  const texts = {}

  let raw = {}
  try { raw = JSON.parse(await readFile(join(dataDir, 'content.json'), 'utf8')) } catch (e) {
    errors.push(e.code === 'ENOENT' ? 'data/content.json پیدا نشد' : `data/content.json: JSON نامعتبر (${e.message}) — معمولاً کاما یا گیومهٔ جاافتاده است`)
    return { manifest: null, texts, copies, errors, warnings }
  }
  const list = (k) => (Array.isArray(raw[k]) ? raw[k] : (raw[k] === undefined ? [] : (errors.push(`${k}: باید فهرست [ ... ] باشد`), [])))

  const hosts = (Array.isArray(raw.allowedHosts) ? raw.allowedHosts : DEFAULT_HOSTS).map((h) => String(h).trim().toLowerCase()).filter(Boolean)
  const linkOk = (u) => {
    try {
      const x = new URL(u)
      return x.protocol === 'https:' && !x.username && !x.password && hosts.some((h) => x.hostname === h || x.hostname.endsWith(`.${h}`))
    } catch { return false }
  }
  const httpsOk = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && !x.username && !x.password } catch { return false } }
  const badLink = (where, field) => { errors.push(`${where}: «${field}» باید لینک https از یکی از سایت‌های مجاز (${hosts.join('، ')}) باشد؛ سایت دیگری را در allowedHosts اضافه کنید`) }

  // ----- دسته‌ها -----
  let categories = DEFAULT_CATEGORIES
  if (raw.categories !== undefined) {
    const c = list('categories')
    if (c.some((x) => !x || !ID_RE.test(x.id ?? '') || !x.title)) errors.push('categories: هر مورد باید {"id": "latin-id", "title": "عنوان"} باشد')
    else categories = c.map((x, i) => ({ id: x.id, title: x.title, order: Number.isFinite(x.order) ? x.order : i + 1 }))
  }
  const catIds = new Set(categories.map((c) => c.id))
  const cats = (item, where) => {
    const l = Array.isArray(item.categories) ? item.categories : []
    const unknown = l.filter((c) => !catIds.has(c))
    if (unknown.length) errors.push(`${where}: دستهٔ ناشناخته (${unknown.join('، ')}). دسته‌های مجاز: ${[...catIds].join('، ')}`)
    return l.length ? l : catIds.has('other') ? ['other'] : []
  }
  const common = (item, i) => ({ order: Number.isFinite(item.order) ? item.order : i + 1, pinned: item.pinned === true, addedAt: '' })

  const seen = new Set()
  const claim = (where, id) => (seen.has(id) ? (errors.push(`${where}: شناسهٔ تکراری (${id})`), false) : (seen.add(id), true))

  // ----- دعاها -----
  const prayers = []
  for (const [i, p] of list('prayers').entries()) {
    const where = `prayers[${i}]${p?.title ? ` «${p.title}»` : ''}`
    if (!p || !p.title) { errors.push(`${where}: «title» لازم است`); continue }
    if (!ID_RE.test(p.id ?? '')) { errors.push(`${where}: «id» لازم است (فقط حروف انگلیسی کوچک، عدد، - و _؛ مثلاً "tavassol")`); continue }
    if (!claim(where, `prayer:${p.id}`)) continue
    if (p.audio !== undefined && !linkOk(p.audio)) { badLink(where, 'audio'); continue }
    const file = join(dataDir, 'prayers', `${p.id}.md`)
    const md = (await exists(file)) ? await readFile(file, 'utf8') : `# ${p.title}\n`
    texts[p.id] = md
    prayers.push({ id: p.id, title: p.title, text: `prayers/${p.id}.md`, ...(p.audio ? { audio: p.audio } : {}), ...common(p, i), categories: cats(p, where) })
  }

  // ----- نواها -----
  const music = []
  for (const [i, m] of list('music').entries()) {
    const where = `music[${i}]${m?.title ? ` «${m.title}»` : ''}`
    if (!m || !m.title) { errors.push(`${where}: «title» لازم است`); continue }
    if (!m.src || !linkOk(m.src)) { badLink(where, 'src'); continue }
    const id = m.id ?? hashId('m', m.title, m.src)
    if (!ID_RE.test(id)) { errors.push(`${where}: «id» نامعتبر`); continue }
    if (!claim(where, `music:${id}`)) continue
    if (m.cover !== undefined && !httpsOk(m.cover)) { errors.push(`${where}: «cover» باید لینک https تصویر باشد`); continue }
    music.push({ id, title: m.title, artist: m.artist ?? '', src: m.src, ...(m.cover ? { cover: m.cover } : {}), ...common(m, i), categories: cats(m, where) })
  }

  // ----- ویدیوها (آپارات) -----
  const videos = []
  for (const [i, v] of list('videos').entries()) {
    const where = `videos[${i}]${v?.title ? ` «${v.title}»` : ''}`
    if (!v || !v.title) { errors.push(`${where}: «title» لازم است`); continue }
    if (typeof v.aparat !== 'string' || !HASH_RE.test(v.aparat)) { errors.push(`${where}: «aparat» باید شناسهٔ ویدیو باشد (مثلاً ckn3o4e؛ بخش بعد از videohash/ در لینک embed آپارات)`); continue }
    const id = v.id ?? hashId('v', v.aparat)
    if (!ID_RE.test(id)) { errors.push(`${where}: «id» نامعتبر`); continue }
    if (!claim(where, `video:${id}`)) continue
    if (v.poster !== undefined && !httpsOk(v.poster)) { errors.push(`${where}: «poster» باید لینک https تصویر باشد`); continue }
    videos.push({ id, title: String(v.title).slice(0, 120), aparat: v.aparat, featured: v.featured === true, ...(v.poster ? { poster: v.poster } : {}), ...common(v, i), categories: [] })
  }
  if (videos.filter((v) => v.featured).length > 1) warnings.push('videos: بیش از یک ویدیو featured است؛ فقط اولی در صدر نمایش داده می‌شود')

  // ----- بنرها -----
  const banners = []
  const bseen = new Set()
  for (const [i, b] of list('banners').entries()) {
    const where = `banners[${i}]`
    if (!b || !ID_RE.test(b.id ?? '')) { errors.push(`${where}: «id» لازم است (انگلیسی، مثلاً "ramadan-1405")`); continue }
    if (bseen.has(b.id)) { errors.push(`${where}: id تکراری (${b.id})`); continue }
    bseen.add(b.id)
    if (b.enabled === false) continue
    const kind = b.kind ?? 'campaign'
    const placement = b.placement ?? 'both'
    if (!BANNER_KINDS.includes(kind)) { errors.push(`${where}: kind باید ad یا campaign باشد`); continue }
    if (!BANNER_PLACEMENTS.includes(placement)) { errors.push(`${where}: placement باید home یا messages یا both باشد`); continue }
    if (!b.image && !b.title) { errors.push(`${where}: «image» یا «title» لازم است`); continue }
    let image
    if (b.image) {
      if (httpsOk(b.image)) image = b.image
      else if (typeof b.image === 'string' && /^[\w.-]+$/.test(b.image) && IMG_EXT.test(b.image) && await exists(join(dataDir, 'banners', b.image))) {
        image = `banners/${b.image}`
        copies.push({ from: join(dataDir, 'banners', b.image), to: image })
      } else { errors.push(`${where}: تصویر پیدا نشد. یا لینک https بدهید، یا فایل را در data/banners/ بگذارید و فقط نام فایل را بنویسید (${b.image})`); continue }
    }
    if (b.href !== undefined && !safeHref(b.href)) { errors.push(`${where}: href باید با https:// یا / شروع شود`); continue }
    if (!isDate(b.startsAt) || !isDate(b.endsAt)) { errors.push(`${where}: startsAt/endsAt باید تاریخ باشد، مثل 2026-12-01`); continue }
    if (kind === 'ad' && !b.sponsor) warnings.push(`${where}: تبلیغ بدون sponsor (نام حامی)`)
    banners.push({
      id: b.id, kind, placement, ...(image ? { image } : {}),
      ...(b.title ? { title: String(b.title).slice(0, 80) } : {}), ...(b.text ? { text: String(b.text).slice(0, 160) } : {}),
      ...(b.alt ? { alt: String(b.alt).slice(0, 120) } : {}), ...(b.sponsor ? { sponsor: String(b.sponsor).slice(0, 60) } : {}),
      ...(b.href ? { href: b.href } : {}), ...(b.startsAt ? { startsAt: b.startsAt } : {}), ...(b.endsAt ? { endsAt: b.endsAt } : {}),
      weight: Number.isFinite(b.weight) ? b.weight : 0,
    })
  }
  banners.sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))

  const byPriority = (a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order || a.id.localeCompare(b.id)
  prayers.sort(byPriority); music.sort(byPriority); videos.sort(byPriority)

  return {
    manifest: { version: 1, generatedAt: now.toISOString(), categories: [...categories].sort((a, b) => a.order - b.order), banners, videos, prayers, music },
    texts, copies, errors, warnings,
  }
}
