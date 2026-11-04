import { expect, it } from 'vitest'
import { formatTime } from '../src/lib/time'

it('formatTime با ارقام فارسی و ورودی نامعتبر', () => {
  expect(formatTime(65)).toBe('۰۱:۰۵')
  expect(formatTime(0)).toBe('۰۰:۰۰')
  expect(formatTime(Number.NaN)).toBe('۰۰:۰۰')
  expect(formatTime(Infinity)).toBe('۰۰:۰۰')
})
