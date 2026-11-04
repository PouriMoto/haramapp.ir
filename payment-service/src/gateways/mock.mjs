import { randomBytes } from 'node:crypto'

/** درگاه آزمایشی: بدون پول واقعی. صفحهٔ /mock-pay را خود سرور نشان می‌دهد. */
export function createMock({ publicUrl }) {
  return {
    name: 'mock',
    async request({ callbackUrl }) {
      const authority = `MOCK${randomBytes(8).toString('hex')}`
      const payUrl = `${publicUrl}/mock-pay?authority=${authority}&cb=${encodeURIComponent(callbackUrl)}`
      return { authority, payUrl }
    },
    async verify({ query }) {
      const authority = query.get('Authority') ?? ''
      return /^MOCK[0-9a-f]{16}$/.test(authority) ? { ok: true, authority, refId: `M${authority.slice(4, 12)}` } : { ok: false, authority }
    },
  }
}
