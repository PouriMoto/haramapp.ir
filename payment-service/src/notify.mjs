/** گزارش نتیجه به اپ‌اسکریپت (confirmPayment) با ۳ بار تلاش. true = ثبت شد. */
export async function confirmToAppsScript(cfg, { paymentId, status, refId, authority }, fetch = globalThis.fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms))) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(cfg.confirmUrl, {
        method: 'POST',
        headers: { 'content-type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'confirmPayment', secret: cfg.sharedSecret, paymentId, status, refId: refId ?? '', authority: authority ?? '' }),
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      })
      const j = await res.json().catch(() => null)
      if (j?.ok) return true
    } catch { /* تلاش دوباره */ }
    await sleep(500 * (i + 1))
  }
  return false
}
