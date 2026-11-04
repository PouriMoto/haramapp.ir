// خواندن و اعتبارسنجی تنظیمات فقط از متغیرهای محیطی. رازها هرگز در ریپو نمی‌آیند.
const bool = (v, def) => (v === undefined || v === '' ? def : /^(1|true|yes|on)$/i.test(v))
const int = (v, def) => { const n = Number.parseInt(v ?? '', 10); return Number.isFinite(n) && n > 0 ? n : def }
const url = (v) => (v ?? '').trim().replace(/\/+$/, '')

export function loadConfig(env = process.env, extra = {}) {
  const errors = []
  const gateway = (env.GATEWAY || 'zarinpal').toLowerCase()
  const cfg = {
    port: int(env.PORT, 8787),
    gateway,
    sandbox: bool(env.ZARINPAL_SANDBOX, false),
    paymentsEnabled: bool(env.PAYMENTS_ENABLED, true),
    publicUrl: url(env.PUBLIC_URL),   // آدرس عمومی همین سرویس (https) — درگاه کاربر را به آن برمی‌گرداند
    siteUrl: url(env.SITE_URL),       // آدرس اپ (GitHub Pages) — کاربر پس از پرداخت به آن برمی‌گردد
    confirmUrl: (env.CONFIRM_URL || '').trim(), // آدرس Web App اپ‌اسکریپت برای confirmPayment
    sharedSecret: env.SHARED_SECRET || '',
    signingSecret: env.SIGNING_SECRET || '',
    minToman: int(env.MIN_TOMAN, 10_000),
    maxToman: int(env.MAX_TOMAN, 500_000_000),
    trustProxy: bool(env.TRUST_PROXY, false),
    merchants: {},
    ...extra,
  }
  try {
    const m = JSON.parse(env.MERCHANTS_JSON || '{}')
    if (m === null || typeof m !== 'object' || Array.isArray(m)) throw new Error('not object')
    cfg.merchants = m
  } catch { errors.push('MERCHANTS_JSON باید یک JSON شیء باشد') }

  if (!['zarinpal', 'mock'].includes(gateway)) errors.push(`GATEWAY نامعتبر: ${gateway}`)
  if (cfg.sharedSecret.length < 16) errors.push('SHARED_SECRET حداقل ۱۶ کاراکتر')
  if (cfg.signingSecret.length < 16) errors.push('SIGNING_SECRET حداقل ۱۶ کاراکتر')
  if (!/^https?:\/\//.test(cfg.publicUrl)) errors.push('PUBLIC_URL لازم است')
  if (!/^https?:\/\//.test(cfg.siteUrl)) errors.push('SITE_URL لازم است')
  if (!/^https?:\/\//.test(cfg.confirmUrl)) errors.push('CONFIRM_URL لازم است')
  if (gateway === 'zarinpal' && Object.keys(cfg.merchants).length === 0) errors.push('MERCHANTS_JSON خالی است')
  if (gateway === 'zarinpal' && !cfg.publicUrl.startsWith('https://') && !cfg.sandbox) errors.push('PUBLIC_URL باید https باشد')
  return { cfg, errors }
}
