import { GatewayError } from './errors.mjs'

// مبلغ در API زرین‌پال به «ریال» است؛ ما تومان می‌گیریم و ×۱۰ می‌کنیم.
// نشانی‌ها از مستندات/پیاده‌سازی‌های عمومی v4؛ قبل از اجرای واقعی با sandbox آزمایش شود.
const PROD = { api: 'https://payment.zarinpal.com/pg/v4/payment', pay: 'https://www.zarinpal.com/pg/StartPay/' }
const SANDBOX = { api: 'https://sandbox.zarinpal.com/pg/v4/payment', pay: 'https://sandbox.zarinpal.com/pg/StartPay/' }

export function createZarinpal({ sandbox = false, fetch: f = globalThis.fetch, timeoutMs = 10_000 } = {}) {
  const u = sandbox ? SANDBOX : PROD

  async function call(path, body) {
    let res
    try {
      res = await f(`${u.api}/${path}.json`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch {
      throw new GatewayError('network', 'ارتباط با درگاه برقرار نشد')
    }
    let json
    try { json = await res.json() } catch { throw new GatewayError('bad_response', 'پاسخ درگاه نامعتبر است') }
    const errs = json?.errors
    const err = Array.isArray(errs) ? errs[0] : errs && Object.keys(errs).length ? errs : null
    if (err) throw new GatewayError(String(err.code ?? 'gateway'), String(err.message ?? 'خطای درگاه'))
    return json?.data ?? {}
  }

  return {
    name: 'zarinpal',
    async request({ merchantId, amountToman, callbackUrl, description }) {
      const d = await call('request', { merchant_id: merchantId, amount: amountToman * 10, callback_url: callbackUrl, description })
      if (d.code !== 100 || !d.authority) throw new GatewayError(String(d.code ?? 'gateway'), 'درگاه تراکنش را نپذیرفت')
      return { authority: String(d.authority), payUrl: `${u.pay}${encodeURIComponent(d.authority)}` }
    },
    /** query: URLSearchParams بازگشتی از درگاه (Authority, Status) */
    async verify({ merchantId, amountToman, query }) {
      const authority = query.get('Authority')
      if (!authority) return { ok: false, authority: '' }
      try {
        const d = await call('verify', { merchant_id: merchantId, amount: amountToman * 10, authority })
        // ۱۰۰ = تأیید تازه، ۱۰۱ = قبلاً تأیید شده (تکرار callback)
        return d.code === 100 || d.code === 101 ? { ok: true, authority, refId: String(d.ref_id ?? '') } : { ok: false, authority }
      } catch (e) {
        if (e instanceof GatewayError && e.code === 'network') throw e // قطعی نیست؛ بالاتر مدیریت شود
        return { ok: false, authority }
      }
    },
  }
}
