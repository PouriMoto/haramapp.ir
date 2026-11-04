import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error JS خالص
import { loadConfig } from '../payment-service/src/config.mjs'
// @ts-expect-error JS خالص
import { createZarinpal } from '../payment-service/src/gateways/zarinpal.mjs'
// @ts-expect-error JS خالص
import { createApp } from '../payment-service/src/server.mjs'

const servers: Server[] = []
const listen = (s: Server) => new Promise<string>((r) => { servers.push(s); s.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })
afterEach(() => { for (const s of servers.splice(0)) s.close() })

const SECRET = 'shared-secret-1234567890'
const SIGN = 'signing-secret-1234567890'

/** سرور ساختگی اپ‌اسکریپت: confirmPayment را ثبت می‌کند */
async function fakeAppsScript(ok = true) {
  const calls: Record<string, unknown>[] = []
  const url = await listen(createServer((req, res) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => { calls.push(JSON.parse(b)); res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok })) })
  }))
  return { url, calls }
}

async function setup(over: Record<string, string> = {}, gatewayFetch?: typeof fetch) {
  const as = await fakeAppsScript()
  const app: { url: string } = { url: '' }
  const env = {
    GATEWAY: 'mock', SHARED_SECRET: SECRET, SIGNING_SECRET: SIGN, SITE_URL: 'https://site.example/haram-app', CONFIRM_URL: as.url,
    PUBLIC_URL: 'http://placeholder', MERCHANTS_JSON: JSON.stringify({ hosseiniyeh: 'M-HOSS', 'multi/civil': 'M-CIVIL', multi: 'M-MULTI' }), ...over,
  }
  // PUBLIC_URL باید همان آدرس واقعی سرور تست باشد؛ ابتدا پورت می‌گیریم
  const holder: { handler?: (q: unknown, r: unknown) => Promise<void> } = {}
  const srv = createServer((q, r) => void holder.handler!(q, r))
  app.url = await listen(srv)
  const { cfg, errors } = loadConfig({ ...env, PUBLIC_URL: app.url })
  expect(errors).toEqual([])
  holder.handler = createApp(cfg, { log: () => undefined, sleep: async () => undefined, ...(gatewayFetch ? { fetch: gatewayFetch } : {}) })
  return { app, as, cfg }
}

const start = (url: string, body: unknown, auth = SECRET) =>
  fetch(`${url}/start`, { method: 'POST', headers: { 'x-auth': auth, 'content-type': 'application/json' }, body: JSON.stringify(body) })

describe('payment-service (mock gateway)', () => {
  it('جریان کامل: start → درگاه → callback → confirm به اپ‌اسکریپت → ریدایرکت به سایت', async () => {
    const { app, as } = await setup()
    const r = await start(app.url, { paymentId: 'pay12345', amountToman: 50000, causeId: 'hosseiniyeh' })
    const j = await r.json()
    expect(r.status).toBe(200)
    expect(j.payUrl).toContain('/mock-pay')

    const page = await (await fetch(j.payUrl)).text()
    const okLink = page.match(/href="([^"]+)"/)![1].replace(/&amp;/g, '&')
    const cb = await fetch(okLink, { redirect: 'manual' })
    expect(cb.status).toBe(302)
    expect(cb.headers.get('location')).toBe('https://site.example/haram-app/help/result?status=ok&id=pay12345')
    expect(as.calls).toHaveLength(1)
    expect(as.calls[0]).toMatchObject({ action: 'confirmPayment', secret: SECRET, paymentId: 'pay12345', status: 'paid', authority: j.authority })
    expect(String(as.calls[0].refId)).not.toBe('')
  })

  it('انصراف کاربر → failed', async () => {
    const { app, as } = await setup()
    const j = await (await start(app.url, { paymentId: 'pay12345', amountToman: 50000, causeId: 'hosseiniyeh' })).json()
    const page = await (await fetch(j.payUrl)).text()
    const links = [...page.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))
    const cb = await fetch(links[1], { redirect: 'manual' })
    expect(cb.headers.get('location')).toContain('status=fail')
    expect(as.calls[0]).toMatchObject({ status: 'failed' })
  })

  it('احراز هویت، ورودی نامعتبر، حدود مبلغ، مرچنت‌نداشته', async () => {
    const { app } = await setup()
    expect((await start(app.url, { paymentId: 'pay12345', amountToman: 50000, causeId: 'hosseiniyeh' }, 'wrong')).status).toBe(401)
    expect((await start(app.url, { paymentId: 'x y', amountToman: 50000, causeId: 'hosseiniyeh' })).status).toBe(400)
    expect((await start(app.url, { paymentId: 'pay12345', amountToman: 5, causeId: 'hosseiniyeh' })).status).toBe(400)
    expect((await start(app.url, { paymentId: 'pay12345', amountToman: 1.5e9, causeId: 'hosseiniyeh' })).status).toBe(400)
    expect((await start(app.url, { paymentId: 'pay12345', amountToman: 50000, causeId: 'jihadi' })).status).toBe(422)
    expect((await fetch(`${app.url}/start`, { method: 'POST', headers: { 'x-auth': SECRET }, body: 'x'.repeat(10_000) }).catch(() => ({ status: 0 }))).status).not.toBe(200)
  })

  it('هر مقصد مرچنت خودش: «کارت/حساب» بر «کارت» مقدم است', async () => {
    const seen: string[] = []
    const f = (async (_u: string, o: { body: string }) => {
      seen.push(JSON.parse(o.body).merchant_id)
      return new Response(JSON.stringify({ data: { code: 100, authority: 'A'.repeat(36) }, errors: [] }))
    }) as unknown as typeof fetch
    const { app } = await setup({ GATEWAY: 'zarinpal', ZARINPAL_SANDBOX: 'true' }, f)
    await start(app.url, { paymentId: 'p1111111', amountToman: 50000, causeId: 'multi', accountId: 'civil' })
    await start(app.url, { paymentId: 'p2222222', amountToman: 50000, causeId: 'multi', accountId: 'culture' })
    await start(app.url, { paymentId: 'p3333333', amountToman: 50000, causeId: 'hosseiniyeh' })
    expect(seen).toEqual(['M-CIVIL', 'M-MULTI', 'M-HOSS'])
  })

  it('callback جعلی/دست‌کاری‌شده رد می‌شود و چیزی به اپ‌اسکریپت نمی‌رود', async () => {
    const { app, as } = await setup()
    const j = await (await start(app.url, { paymentId: 'pay12345', amountToman: 50000, causeId: 'hosseiniyeh' })).json()
    const page = await (await fetch(j.payUrl)).text()
    const okLink = page.match(/href="([^"]+)"/)![1].replace(/&amp;/g, '&')
    const tampered = okLink.replace('a=50000', 'a=10000') // کاهش مبلغ
    expect((await fetch(tampered, { redirect: 'manual' })).status).toBe(400)
    expect((await fetch(okLink.replace(/&s=[0-9a-f]+/, '&s=00'), { redirect: 'manual' })).status).toBe(400)
    expect((await fetch(`${app.url}/callback?p=pay12345&a=50000&k=hosseiniyeh&Status=OK`, { redirect: 'manual' })).status).toBe(400)
    expect(as.calls).toHaveLength(0)
  })

  it('mock-pay: cb خارجی (open redirect) پذیرفته نمی‌شود', async () => {
    const { app } = await setup()
    const r = await fetch(`${app.url}/mock-pay?authority=MOCK0123456789abcdef&cb=${encodeURIComponent('https://evil.example/x?')}`)
    expect(r.status).toBe(400)
  })

  it('پرداخت‌ها با PAYMENTS_ENABLED=false خاموش است', async () => {
    const { app } = await setup({ PAYMENTS_ENABLED: 'false' })
    expect((await start(app.url, { paymentId: 'pay12345', amountToman: 50000, causeId: 'hosseiniyeh' })).status).toBe(503)
    expect((await (await fetch(`${app.url}/healthz`)).json()).enabled).toBe(false)
  })
})

describe('zarinpal gateway (fetch ساختگی)', () => {
  const resp = (o: unknown) => new Response(JSON.stringify(o))

  it('request: مبلغ ×۱۰ (ریال)، آدرس sandbox و StartPay', async () => {
    let seen: { url: string; body: Record<string, unknown> } | null = null
    const g = createZarinpal({ sandbox: true, fetch: (async (url: string, o: { body: string }) => { seen = { url, body: JSON.parse(o.body) }; return resp({ data: { code: 100, authority: 'A0001' }, errors: [] }) }) as unknown as typeof fetch })
    const r = await g.request({ merchantId: 'M', amountToman: 12345, callbackUrl: 'https://cb', description: 'همیاری' })
    expect(seen!.url).toBe('https://sandbox.zarinpal.com/pg/v4/payment/request.json')
    expect(seen!.body).toMatchObject({ merchant_id: 'M', amount: 123450, callback_url: 'https://cb' })
    expect(r).toEqual({ authority: 'A0001', payUrl: 'https://sandbox.zarinpal.com/pg/StartPay/A0001' })
  })
  it('request: خطای درگاه → GatewayError بدون درز مرچنت', async () => {
    const g = createZarinpal({ fetch: (async () => resp({ data: [], errors: { code: -9, message: 'خطای اعتبارسنجی' } })) as unknown as typeof fetch })
    await expect(g.request({ merchantId: 'SECRET-MERCHANT', amountToman: 10000, callbackUrl: 'x', description: 'd' })).rejects.toThrow('خطای اعتبارسنجی')
    await g.request({ merchantId: 'SECRET-MERCHANT', amountToman: 10000, callbackUrl: 'x', description: 'd' }).catch((e: Error) => expect(e.message).not.toContain('SECRET-MERCHANT'))
  })
  it('verify: ۱۰۰ و ۱۰۱ موفق؛ سایر کدها ناموفق؛ بدون Authority ناموفق', async () => {
    const mk = (code: number) => createZarinpal({ fetch: (async () => resp({ data: { code, ref_id: 777 }, errors: [] })) as unknown as typeof fetch })
    const q = new URLSearchParams({ Authority: 'A1', Status: 'OK' })
    expect(await mk(100).verify({ merchantId: 'M', amountToman: 10000, query: q })).toMatchObject({ ok: true, refId: '777' })
    expect((await mk(101).verify({ merchantId: 'M', amountToman: 10000, query: q })).ok).toBe(true)
    expect((await mk(-50).verify({ merchantId: 'M', amountToman: 10000, query: q })).ok).toBe(false)
    expect((await mk(100).verify({ merchantId: 'M', amountToman: 10000, query: new URLSearchParams() })).ok).toBe(false)
  })
})

describe('loadConfig', () => {
  it('پیکربندی ناقص خطا می‌دهد', () => {
    expect(loadConfig({ GATEWAY: 'zarinpal' }).errors.length).toBeGreaterThan(3)
    expect(loadConfig({ GATEWAY: 'foo', MERCHANTS_JSON: '[]' }).errors.join()).toMatch(/GATEWAY|MERCHANTS/)
  })
})
