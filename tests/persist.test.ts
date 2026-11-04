import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { persistCache, restoreCache } from '../src/app/persist'

function store() {
  const m = new Map<string, string>()
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
}

describe('query cache persistence', () => {
  it('فقط کلیدهای مجاز ذخیره و بازیابی می‌شوند', async () => {
    const s = store()
    const a = new QueryClient()
    a.setQueryData(['manifest'], { v: 1 })
    a.setQueryData(['myPayments', 'x'], [{ secret: 1 }])
    const stop = persistCache(a, s, 'b1', 0)
    a.setQueryData(['stats'], { total: 5 })
    await new Promise((r) => setTimeout(r, 20))
    stop()
    const b = new QueryClient()
    restoreCache(b, s, 'b1')
    expect(b.getQueryData(['stats'])).toEqual({ total: 5 })
    expect(b.getQueryData(['myPayments', 'x'])).toBeUndefined()
  })
  it('نسخهٔ build یا عمر گذشته بی‌اعتبار است', async () => {
    const s = store()
    s.m.set('haram.qcache.v1', JSON.stringify({ t: Date.now(), build: 'old', state: { mutations: [], queries: [] } }))
    restoreCache(new QueryClient(), s, 'new')
    expect(s.m.size).toBe(0)
    s.m.set('haram.qcache.v1', JSON.stringify({ t: 0, build: 'b', state: { mutations: [], queries: [] } }))
    restoreCache(new QueryClient(), s, 'b', 1e12)
    expect(s.m.size).toBe(0)
  })
  it('داده خراب بی‌صدا پاک می‌شود', () => {
    const s = store()
    s.m.set('haram.qcache.v1', '{bad')
    expect(() => restoreCache(new QueryClient(), s, 'b')).not.toThrow()
    expect(s.m.size).toBe(0)
  })
})
