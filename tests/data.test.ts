import { describe, expect, it } from 'vitest'
import { createMockApi } from '../src/data/adapters/mock'
import { createMockHelpApi } from '../src/data/adapters/mockHelp'
import { parseToman, validateBank, validateMessage, validatePayment } from '../src/data/validation'
import { normalizeSearch } from '../src/lib/text'
import causesSeed from '../data/causes.json'

describe('validation', () => {
  it('پیام کوتاه/بلند و موبایل نامعتبر رد می‌شود', () => {
    expect(() => validateMessage({ message: 'ab' })).toThrow()
    expect(() => validateMessage({ message: 'x'.repeat(1001) })).toThrow()
    expect(() => validateMessage({ message: 'سلام آقا', phone: '123' })).toThrow()
    expect(validateMessage({ message: ' سلام آقا ', phone: '۰۹۱۲۳۴۵۶۷۸۹' }).phone).toBe('09123456789')
  })
  it('مبلغ', () => {
    expect(parseToman('۱۰۰٬۰۰۰')).toBe(100000)
    expect(() => parseToman('abc')).toThrow()
    const base = { causeId: 'a', clientId: 'c' }
    expect(() => validatePayment({ ...base, amountToman: 5 })).toThrow()
    expect(() => validatePayment({ ...base, amountToman: 1e12 })).toThrow()
    expect(validatePayment({ ...base, amountToman: 50000 }).amountToman).toBe(50000)
  })
})

describe('mock api', () => {
  it('صفحه‌بندی تا انتها', async () => {
    const api = createMockApi({ latencyMs: 0 })
    let cursor: string | undefined
    let n = 0
    for (let i = 0; i < 10; i++) {
      const p = await api.listMessages({ cursor, limit: 10 })
      n += p.items.length
      if (!p.nextCursor) break
      cursor = p.nextCursor
    }
    expect(n).toBe(27)
  })
  it('صلوات یکی زیاد می‌شود', async () => {
    const api = createMockApi({ latencyMs: 0 })
    const a = await api.getStats()
    expect((await api.addSalavat()).salavat).toBe(a.salavat + 1)
    expect((await api.addSalavat(10)).salavat).toBe(a.salavat + 11)
    await expect(api.addSalavat(0)).rejects.toThrow()
  })
})

describe('mock help', () => {
  it('۴ کارت اولیه و جستجو', async () => {
    const h = createMockHelpApi({ latencyMs: 0 })
    expect(await h.listCauses({})).toHaveLength(4)
    expect(await h.listCauses({ q: 'جهادي' })).toHaveLength(1) // ی عربی
    expect(await h.listCauses({ q: 'عمرانی' })).toHaveLength(1) // جستجو در نام حساب
    expect(await h.listCauses({ q: 'zzz' })).toHaveLength(0)
  })
  it('پرداخت، جمع کل و پرداخت‌های من', async () => {
    const h = createMockHelpApi({ latencyMs: 0 })
    await h.startPayment({ causeId: 'jihadi', amountToman: 100000, clientId: 'dev-A' })
    await h.startPayment({ causeId: 'multi', accountId: 'civil', amountToman: 50000, clientId: 'dev-B' })
    await expect(h.startPayment({ causeId: 'multi', amountToman: 50000, clientId: 'dev-B' })).rejects.toThrow()
    expect((await h.getHelpTotal()).totalToman).toBe(150000)
    expect((await h.getCause('multi')).accounts.find((a) => a.id === 'civil')?.totalToman).toBe(50000)
    const mine = await h.listMyPayments('dev-A')
    expect(mine).toHaveLength(1)
    expect(mine[0]).not.toHaveProperty('clientId')
  })
  it('داده‌محور: seed از JSON و bank خالی حذف می‌شود', async () => {
    const h = createMockHelpApi({ latencyMs: 0 })
    const list = await h.listCauses({})

    // ترتیب و مجموعه‌ی idها از خود seed خوانده می‌شود (با افزودن کارت جدید نمی‌شکند)
    const seedIds = causesSeed.causes.map((c) => c.id)
    expect(list.map((c) => c.id)).toEqual(seedIds)

    const seedById = new Map(causesSeed.causes.map((c) => [c.id, c]))

    const isBankEmpty = (bank?: Record<string, unknown>) =>
      !bank || Object.values(bank).every((v) => !v || v === '')

    const assertBank = (actual: any, seedBank: any, label: string) => {
      if (isBankEmpty(seedBank)) {
        expect(actual, `${label}: bank خالی باید حذف شود`).toBeUndefined()
      } else {
        expect(actual, `${label}: bank باید حفظ شود`).toBeDefined()
        expect(actual?.cardNumber).toBe(seedBank.cardNumber)
        expect(actual?.iban ?? '').toBe(seedBank.iban ?? '')
        expect(actual?.ownerName ?? '').toBe(seedBank.ownerName ?? '')
        expect(actual?.bankName ?? '').toBe(seedBank.bankName ?? '')
      }
    }

    for (const cause of list) {
      const seed = seedById.get(cause.id)
      if (!seed) continue
      assertBank(cause.bank, seed.bank, `cause:${cause.id}`)

      // عنوان حساب‌ها هم داده‌محور بررسی می‌شود
      if (seed.accounts?.length) {
        expect(cause.accounts.map((a) => a.title)).toEqual(seed.accounts.map((a) => a.title))
      }

      for (const acc of cause.accounts ?? []) {
        const seedAcc = (seed.accounts ?? []).find((a) => a.id === acc.id)
        if (!seedAcc) continue
        assertBank(acc.bank, seedAcc.bank, `cause:${cause.id}/account:${acc.id}`)
      }
    }
  })
  it('bank: نرمال‌سازی و اعتبارسنجی', () => {
    expect(validateBank({ bankName: ' ملی ', ownerName: 'الف', cardNumber: '۶۰۳۷ ۹۹۷۱ ۱۲۳۴ ۵۶۷۸', iban: 'ir ۰۶۲۰۱۰۰۰۰۰۰۰۱۲۳۴۵۶۷۸۹۰۱۲' })).toEqual({
      bankName: 'ملی', ownerName: 'الف', cardNumber: '6037997112345678', iban: 'IR062010000000123456789012',
    })
    expect(validateBank({ bankName: '', ownerName: '', cardNumber: '', iban: '' })).toBeUndefined()
    expect(() => validateBank({ bankName: '', ownerName: '', cardNumber: '123', iban: '' })).toThrow()
    expect(() => validateBank({ bankName: '', ownerName: '', cardNumber: '', iban: 'IR12' })).toThrow()
  })
  it('افزودن کارت با bank', async () => {
    const h = createMockHelpApi({ latencyMs: 0 })
    const c = await h.addCause({ adminToken: 't', title: 'ک', bank: { bankName: 'ملی', ownerName: 'ف', cardNumber: '6037997112345678', iban: '' } })
    expect(c.bank?.cardNumber).toBe('6037997112345678')
  })
  it('افزودن کارت', async () => {
    const h = createMockHelpApi({ latencyMs: 0 })
    const c = await h.addCause({ adminToken: 't', title: 'کتابخانه', accounts: [{ title: 'الف' }, { title: 'ب' }] })
    expect(c.accounts).toHaveLength(2)
    expect(await h.listCauses({})).toHaveLength(5)
  })
})

describe('text', () => {
  it('normalizeSearch', () => expect(normalizeSearch('كتاب‌خانه ۱')).toBe('کتاب خانه 1'))
})

describe('mock help: کلید و upsert', () => {
  it('getConfig و online، و upsert با id', async () => {
    const h = createMockHelpApi({ latencyMs: 0 })
    expect(await h.getConfig()).toEqual({ paymentsEnabled: true })
    expect((await h.listCauses({}))[0].online).toBe(true)
  })
})

import { mergeCauses } from '../src/data/adapters/appsScript'
describe('mergeCauses (ایستا + شیت)', () => {
  const file = { version: 1 as const, causes: [{ id: 'a', title: 'الف', accounts: [] }, { id: 'm', title: 'چندحسابه', accounts: [{ id: 'x', title: 'ایکس' }] }] }
  it('ایستا مرجع عنوان؛ شیت فقط مبلغ و online؛ کارت فقط‌شیتی حفظ می‌شود', () => {
    const live = [
      { id: 'a', title: 'قدیمی', totalToman: 500, online: true, accounts: [] },
      { id: 'm', title: 'م', totalToman: 0, online: false, accounts: [{ id: 'x', title: 'x', totalToman: 70, online: true }] },
      { id: 'u', title: 'کاربر', totalToman: 0, accounts: [] },
    ]
    const r = mergeCauses(file, live)
    expect(r.map((c) => [c.id, c.title])).toEqual([['a', 'الف'], ['m', 'چندحسابه'], ['u', 'کاربر']])
    expect(r[0]).toMatchObject({ totalToman: 500, online: true })
    expect(r[1].accounts[0]).toMatchObject({ totalToman: 70, online: true })
  })
  it('شیت در دسترس نیست → کارت‌های ایستا با آنلاین=خاموش', () => {
    const r = mergeCauses(file, [])
    expect(r).toHaveLength(2)
    expect(r.every((c) => c.online === false && c.totalToman === 0)).toBe(true)
  })
})