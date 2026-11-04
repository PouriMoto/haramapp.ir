import { describe, expect, it } from 'vitest'
import { currentOccasion } from '../src/content/occasion'

describe('currentOccasion', () => {
  it('رمضان ۱۴۴۷ و شب‌های قدر', () => {
    expect(currentOccasion(new Date('2026-03-01T12:00:00Z'))?.cat).toBe('ramadan')
    expect(currentOccasion(new Date('2026-03-10T12:00:00Z'))?.cat).toBe('qadr')
  })
  it('محرم و روز عادی', () => {
    expect(currentOccasion(new Date('2026-06-20T12:00:00Z'))?.cat).toBe('muharram')
    expect(currentOccasion(new Date('2026-09-01T12:00:00Z'))).toBeNull()
  })
})
