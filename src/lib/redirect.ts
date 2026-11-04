/**
 * مقصد ریدایرکت پس از startPayment را بررسی می‌کند (جلوگیری از open redirect / javascript:).
 * https مطلق → { external }، مسیر داخلی `/help/result...` → { internal }، غیر آن null.
 */
export type PayRedirect = { kind: 'external'; url: string } | { kind: 'internal'; to: string }

export function safePayRedirect(payUrl: string): PayRedirect | null {
  if (payUrl.startsWith('/help/result') && !payUrl.startsWith('//')) return { kind: 'internal', to: payUrl }
  try {
    const u = new URL(payUrl)
    return u.protocol === 'https:' ? { kind: 'external', url: u.toString() } : null
  } catch {
    return null
  }
}
