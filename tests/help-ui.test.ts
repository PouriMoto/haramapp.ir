import { describe, expect, it } from 'vitest'
import { createMockHelpApi } from '../src/data/adapters/mockHelp'
import { safePayRedirect } from '../src/lib/redirect'

describe('safePayRedirect', () => {
  it('فقط https مطلق یا مسیر داخلی نتیجه', () => {
    expect(safePayRedirect('https://www.zarinpal.com/pg/StartPay/A1')).toEqual({ kind: 'external', url: 'https://www.zarinpal.com/pg/StartPay/A1' })
    expect(safePayRedirect('/help/result?status=ok&id=p1')).toEqual({ kind: 'internal', to: '/help/result?status=ok&id=p1' })
    for (const bad of ['javascript:alert(1)', 'http://evil.com', '//evil.com/help/result', '/other', 'data:text/html,x', '']) expect(safePayRedirect(bad)).toBeNull()
  })
})

describe('addCause (مدیر)', () => {
  it('بدون توکن رد می‌شود و توکن ذخیره نمی‌شود', async () => {
    const h = createMockHelpApi({ latencyMs: 0 })
    await expect(h.addCause({ title: 'الف' })).rejects.toThrow()
    const c = await h.addCause({ title: 'الف', adminToken: 'secret-token' })
    expect(JSON.stringify(c)).not.toContain('secret-token')
  })
})
