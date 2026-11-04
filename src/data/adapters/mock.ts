import type { Api } from '../contract'
import { ApiError } from '../errors'
import type { Message, Page, Stats } from '../types'
import { validateMessage } from '../validation'

const delay = (ms = 120) => new Promise<void>((r) => setTimeout(r, ms))

function seed(): Message[] {
  const base = Date.UTC(2026, 0, 1)
  return Array.from({ length: 27 }, (_, i) => ({
    id: `m${i + 1}`,
    name: i % 3 === 0 ? '' : `زائر ${i + 1}`,
    message: `درد و دل نمونه شماره ${i + 1}`,
    createdAt: new Date(base + i * 3_600_000).toISOString(),
  })).reverse() // جدیدترین اول
}

export function createMockApi(opts: { latencyMs?: number } = {}): Api {
  const wait = () => delay(opts.latencyMs ?? 120)
  const messages = seed()
  const stats: Stats = { salavat: 1234, messages: messages.length }

  return {
    async listMessages({ cursor, limit }): Promise<Page<Message>> {
      await wait()
      const start = cursor ? Number(cursor) : 0
      if (!Number.isInteger(start) || start < 0) throw new ApiError('validation', 'cursor نامعتبر')
      const items = messages.slice(start, start + limit)
      const next = start + limit
      return { items, nextCursor: next < messages.length ? String(next) : null }
    },
    async postMessage(i) {
      await wait()
      if (i.website) return // honeypot: بی‌صدا نادیده
      validateMessage(i) // مثل سرور واقعی: پیام تا تأیید دیده نمی‌شود، پس به لیست اضافه نمی‌شود
    },
    async getStats() {
      await wait()
      return { ...stats }
    },
    async addSalavat(count = 1) {
      await wait()
      if (!Number.isInteger(count) || count < 1 || count > 100) throw new ApiError('validation', 'تعداد نامعتبر')
      stats.salavat += count
      return { ...stats }
    },
  }
}
