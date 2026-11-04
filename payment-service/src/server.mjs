import { createGateway } from './gateways/index.mjs'
import { GatewayError } from './gateways/errors.mjs'
import { confirmToAppsScript } from './notify.mjs'
import { safeEqual, sign, verifySig } from './state.mjs'

const ID = /^[A-Za-z0-9_-]{1,64}$/
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function limiter(max, windowMs, now) {
  const hits = new Map()
  return (key) => {
    const t = now()
    const arr = (hits.get(key) ?? []).filter((x) => t - x < windowMs)
    arr.push(t)
    hits.set(key, arr)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((x) => t - x < windowMs)) hits.delete(k)
    return arr.length <= max
  }
}

/** @returns {(req, res) => Promise<void>} هندلر http. وابستگی‌ها برای تست تزریق می‌شوند. */
export function createApp(cfg, deps = {}) {
  const fetch = deps.fetch ?? globalThis.fetch
  const now = deps.now ?? Date.now
  const log = deps.log ?? ((o) => console.log(JSON.stringify({ t: new Date(now()).toISOString(), ...o })))
  const gateway = deps.gateway ?? createGateway(cfg, fetch)
  const sleep = deps.sleep
  const okStart = limiter(30, 60_000, now)
  const okCb = limiter(60, 60_000, now)

  const json = (res, code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(obj))
  }
  const redirect = (res, location) => { res.writeHead(302, { location, 'cache-control': 'no-store' }); res.end() }
  const html = (res, code, body) => {
    res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
    res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body dir="rtl" style="font-family:system-ui;padding:24px;line-height:2">${body}</body>`)
  }
  const ip = (req) => (cfg.trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || '?'
  const resultUrl = (status, id) => `${cfg.siteUrl}/help/result?status=${status}&id=${encodeURIComponent(id)}`

  const readBody = (req, max = 4096) => new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('too_large')); req.destroy() } else chunks.push(c) })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })

  const merchantFor = (causeId, accountId) => {
    const keys = accountId ? [`${causeId}/${accountId}`, causeId] : [causeId]
    for (const k of keys) if (typeof cfg.merchants[k] === 'string' && cfg.merchants[k]) return { key: k, id: cfg.merchants[k] }
    return null
  }

  async function start(req, res) {
    if (!safeEqual(req.headers['x-auth'] ?? '', cfg.sharedSecret)) return json(res, 401, { ok: false, error: 'unauthorized' })
    if (!okStart(ip(req))) return json(res, 429, { ok: false, error: 'rate_limited' })
    if (!cfg.paymentsEnabled) return json(res, 503, { ok: false, error: 'payments_disabled' })
    let b
    try { b = JSON.parse(await readBody(req)) } catch { return json(res, 400, { ok: false, error: 'bad_body' }) }
    const { paymentId, amountToman, causeId } = b ?? {}
    const accountId = b?.accountId ?? ''
    if (!ID.test(paymentId ?? '') || !ID.test(causeId ?? '') || (accountId && !ID.test(accountId))) return json(res, 400, { ok: false, error: 'bad_fields' })
    if (!Number.isSafeInteger(amountToman) || amountToman < cfg.minToman || amountToman > cfg.maxToman) return json(res, 400, { ok: false, error: 'bad_amount' })
    const m = merchantFor(causeId, accountId)
    if (!m) { log({ ev: 'no_merchant', causeId, accountId }); return json(res, 422, { ok: false, error: 'merchant_not_configured' }) }

    const state = { p: paymentId, a: amountToman, k: m.key }
    const qs = new URLSearchParams({ p: state.p, a: String(state.a), k: state.k, s: sign(cfg.signingSecret, state) })
    try {
      const r = await gateway.request({ merchantId: m.id, amountToman, callbackUrl: `${cfg.publicUrl}/callback?${qs}`, description: 'همیاری' })
      log({ ev: 'start', paymentId, key: m.key, amountToman })
      return json(res, 200, { ok: true, payUrl: r.payUrl, authority: r.authority })
    } catch (e) {
      log({ ev: 'start_failed', paymentId, key: m.key, code: e instanceof GatewayError ? e.code : 'internal' })
      return json(res, 502, { ok: false, error: 'gateway_error' })
    }
  }

  async function callback(req, res, url) {
    if (!okCb(ip(req))) return html(res, 429, 'درخواست‌ها زیاد است.')
    const q = url.searchParams
    const state = { p: q.get('p') ?? '', a: q.get('a') ?? '', k: q.get('k') ?? '' }
    if (!ID.test(state.p) || !/^\d{1,12}$/.test(state.a) || !verifySig(cfg.signingSecret, state, q.get('s'))) {
      log({ ev: 'callback_bad_sig' })
      return html(res, 400, 'پیوند نامعتبر است.')
    }
    const merchantId = cfg.merchants[state.k]
    if (typeof merchantId !== 'string' || !merchantId) return html(res, 400, 'پیکربندی نامعتبر است.')
    const amountToman = Number(state.a)

    let status = 'failed', refId = '', authority = q.get('Authority') ?? ''
    if (q.get('Status') === 'OK') {
      try {
        const v = await gateway.verify({ merchantId, amountToman, query: q })
        authority = v.authority || authority
        if (v.ok) { status = 'paid'; refId = v.refId ?? '' }
      } catch (e) {
        // وضعیت نامعلوم (قطع ارتباط): pending می‌ماند تا مدیر از پنل درگاه تطبیق دهد
        log({ ev: 'verify_unreachable', paymentId: state.p, code: e instanceof GatewayError ? e.code : 'internal' })
        return html(res, 503, 'تأیید پرداخت در حال حاضر ممکن نیست. اگر مبلغ کسر شده، نتیجه بعداً ثبت می‌شود. کد پیگیری: ' + esc(state.p))
      }
    }
    const saved = await confirmToAppsScript(cfg, { paymentId: state.p, status, refId, authority }, fetch, sleep)
    log({ ev: 'callback', paymentId: state.p, status, saved })
    return redirect(res, resultUrl(status === 'paid' ? 'ok' : 'fail', state.p))
  }

  function mockPay(res, url) {
    const cb = url.searchParams.get('cb') ?? ''
    const authority = url.searchParams.get('authority') ?? ''
    if (!cb.startsWith(`${cfg.publicUrl}/callback?`) || !/^MOCK[0-9a-f]{16}$/.test(authority)) return html(res, 400, 'نامعتبر')
    const ok = `${cb}&Authority=${authority}&Status=OK`, no = `${cb}&Authority=${authority}&Status=NOK`
    return html(res, 200, `<h2>درگاه آزمایشی</h2><p>این صفحه فقط برای آزمایش است؛ پولی کسر نمی‌شود.</p><p><a href="${esc(ok)}">پرداخت موفق</a></p><p><a href="${esc(no)}">انصراف / ناموفق</a></p>`)
  }

  return async function handler(req, res) {
    try {
      const url = new URL(req.url ?? '/', 'http://x')
      if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { ok: true, gateway: gateway.name, enabled: cfg.paymentsEnabled })
      if (req.method === 'POST' && url.pathname === '/start') return await start(req, res)
      if (req.method === 'GET' && url.pathname === '/callback') return await callback(req, res, url)
      if (req.method === 'GET' && url.pathname === '/mock-pay' && cfg.gateway === 'mock') return mockPay(res, url)
      return json(res, 404, { ok: false, error: 'not_found' })
    } catch (e) {
      log({ ev: 'internal_error', msg: e instanceof Error ? e.message : 'unknown' })
      if (!res.headersSent) json(res, 500, { ok: false, error: 'internal' })
    }
  }
}
