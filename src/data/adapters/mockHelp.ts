import type { HelpApi } from '../contract'
import { ApiError } from '../errors'
import seedFile from '../../../data/causes.json'
import type { BankInfo, Cause, CausesFile, Payment } from '../types'
import { normalizeSearch } from '../../lib/text'
import { validateBank, validateCause, validatePayment } from '../validation'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

interface Stored {
  id: string
  title: string
  description?: string
  bank?: BankInfo
  accounts: { id: string; title: string; bank?: BankInfo }[]
}
// در mock همهٔ مقصدها «آنلاین» هستند تا کل جریان قابل آزمایش باشد (در seed، online برای سرور واقعی است).
interface StoredPayment extends Payment { clientId: string }

/** منبع داده: seed/causes.json (هر ورودی از راه validateBank عبور می‌کند؛ bank خالی حذف می‌شود) */
function loadSeed(file: CausesFile): Stored[] {
  return file.causes.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    bank: validateBank(c.bank),
    accounts: c.accounts.map((a) => ({ id: a.id, title: a.title, bank: validateBank(a.bank) })),
  }))
}

export function createMockHelpApi(opts: { latencyMs?: number } = {}): HelpApi {
  const wait = () => delay(opts.latencyMs ?? 120)
  const causes: Stored[] = loadSeed(seedFile as CausesFile)
  const payments: StoredPayment[] = []
  let seq = 0

  const paidSum = (causeId: string, accountId?: string) =>
    payments
      .filter((p) => p.status === 'paid' && p.causeId === causeId && (accountId === undefined || p.accountId === accountId))
      .reduce((s, p) => s + p.amountToman, 0)

  const view = (c: Stored): Cause => ({
    id: c.id,
    title: c.title,
    description: c.description,
    bank: c.bank,
    online: true,
    accounts: c.accounts.map((a) => ({ ...a, online: true, totalToman: paidSum(c.id, a.id) })),
    totalToman: paidSum(c.id),
  })

  return {
    async listCauses({ q }) {
      await wait()
      const needle = normalizeSearch(q ?? '')
      return causes
        .filter((c) => !needle || normalizeSearch(`${c.title} ${c.description ?? ''} ${c.accounts.map((a) => a.title).join(' ')}`).includes(needle))
        .map(view)
    },
    async getCause(id) {
      await wait()
      const c = causes.find((x) => x.id === id)
      if (!c) throw new ApiError('not_found', 'مقصد پیدا نشد')
      return view(c)
    },
    async addCause(i) {
      await wait()
      if (!i.adminToken) throw new ApiError('server', 'مجاز نیست') // mock: هر توکن غیرخالی
      const v = validateCause(i)
      const id = `c${++seq}`
      const stored: Stored = {
        id,
        title: v.title,
        description: v.description,
        bank: v.bank,
        accounts: (v.accounts ?? []).map((a, n) => ({ id: `${id}a${n + 1}`, title: a.title, bank: a.bank })),
      }
      causes.push(stored)
      return view(stored)
    },
    async startPayment(i) {
      await wait()
      const v = validatePayment(i)
      const c = causes.find((x) => x.id === v.causeId)
      if (!c) throw new ApiError('not_found', 'مقصد پیدا نشد')
      const acc = c.accounts.find((a) => a.id === v.accountId)
      if (c.accounts.length > 0 && !acc) throw new ApiError('validation', 'حساب انتخاب نشده')
      const id = `p${++seq}`
      payments.push({
        id,
        clientId: v.clientId,
        causeId: c.id,
        causeTitle: c.title,
        accountId: acc?.id,
        accountTitle: acc?.title,
        amountToman: v.amountToman,
        status: 'paid', // mock: بلافاصله موفق؛ در واقعیت پس از verify سرور
        createdAt: new Date().toISOString(),
        refId: `MOCK-${id}`,
      })
      return { payUrl: `/help/result?status=ok&id=${id}` }
    },
    async listMyPayments(clientId) {
      await wait()
      return payments
        .filter((p) => p.clientId === clientId)
        .map(({ clientId: _c, ...p }) => p)
        .reverse()
    },
    async getConfig() {
      await wait()
      return { paymentsEnabled: true }
    },
    async getHelpTotal() {
      await wait()
      return { totalToman: payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amountToman, 0) }
    },
  }
}
