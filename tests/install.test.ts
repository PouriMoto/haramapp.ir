import { describe, expect, it } from 'vitest'
import { installDue } from '../src/pwa/install'

const DAY = 86_400_000
describe('زمان‌بندی پیشنهاد نصب', () => {
  it('بازدید اول و دوم نمایش، سپس ۷ روز، سپس هر ۱۴ روز', () => {
    const t = 1_000_000_000
    expect(installDue({ count: 0, last: 0 }, t)).toBe(true)
    expect(installDue({ count: 1, last: t }, t + 1000)).toBe(true) // بازدید بعدی
    expect(installDue({ count: 2, last: t }, t + 6 * DAY)).toBe(false)
    expect(installDue({ count: 2, last: t }, t + 7 * DAY)).toBe(true)
    expect(installDue({ count: 3, last: t }, t + 13 * DAY)).toBe(false)
    expect(installDue({ count: 3, last: t }, t + 14 * DAY)).toBe(true)
    expect(installDue({ count: 9, last: t }, t + 14 * DAY)).toBe(true)
  })
})
