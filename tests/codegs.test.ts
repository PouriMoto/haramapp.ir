import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { beforeEach, describe, expect, it } from 'vitest'

type Row = unknown[]
const HEADERS: Record<string, string[]> = {
  Messages: ['id', 'createdAt', 'name', 'phone', 'message', 'approved', 'clientId'],
  Causes: ['id', 'title', 'description', 'accounts'],
  Payments: ['id', 'createdAt', 'clientId', 'causeId', 'accountId', 'amount', 'status', 'authority', 'refId'],
}

function makeEnv(props: Record<string, string>, fetchImpl?: (url: string, o: unknown) => { code: number; body: string }) {
  const data: Record<string, Row[]> = { Messages: [], Causes: [], Payments: [] }
  const cache = new Map<string, string>()
  let uid = 0
  const sheetFor = (name: string) => ({
    getLastRow: () => data[name].length + 1,
    getMaxRows: () => 1000,
    appendRow: (r: Row) => void data[name].push(r),
    getRange: (row: number, col: number, nr = 1, nc = 1) => ({
      getValues: () => data[name].slice(row - 2, row - 2 + nr).map((r) => r.slice(col - 1, col - 1 + nc)),
      setValues: (vals: Row[]) => { if (row >= 2) vals.forEach((v, i) => { data[name][row - 2 + i] = v }) },
      setNumberFormat: () => undefined,
      setValue: (v: unknown) => { data[name][row - 2][col - 1] = v },
    }),
    setFrozenRows: () => undefined,
  })
  const sheets = new Map<string, ReturnType<typeof sheetFor>>()
  const ctx = {
    console,
    JSON, Math, Number, String, Date, Object, Array, RegExp, Error, isFinite, parseInt,
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (t: string) => ({ text: t, setMimeType() { return this } }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => props[k] ?? null,
        setProperty: (k: string, v: string) => void (props[k] = v),
      }),
    },
    CacheService: {
      getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => void cache.set(k, v) }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => undefined }) },
    Utilities: { getUuid: () => `0000-${(uid++).toString(16).padStart(12, '0')}-aaaa` },
    UrlFetchApp: {
      fetch: (url: string, o: unknown) => {
        const r = fetchImpl ? fetchImpl(url, o) : { code: 500, body: '' }
        return { getResponseCode: () => r.code, getContentText: () => r.body }
      },
    },
    SpreadsheetApp: {
      getActive: () => ({
        getSheetByName: (n: string) => sheets.get(n) ?? null,
        insertSheet: (n: string) => {
          expect(HEADERS[n]).toBeDefined()
          const s = sheetFor(n)
          sheets.set(n, s)
          return s
        },
      }),
    },
  }
  vm.createContext(ctx)
  vm.runInContext(readFileSync('backend/apps-script/Code.gs', 'utf8'), ctx)
  const g = (params: Record<string, string>) => JSON.parse((vm.runInContext('doGet', ctx) as (e: unknown) => { text: string })({ parameter: params }).text)
  const p = (body: unknown) =>
    JSON.parse((vm.runInContext('doPost', ctx) as (e: unknown) => { text: string })({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).text)
  return { data, props, g, p }
}

const CID = 'client-0001-abcd'

describe('Code.gs', () => {
  let e: ReturnType<typeof makeEnv>
  beforeEach(() => { e = makeEnv({ ADMIN_TOKEN: 'adm', PAYMENT_SHARED_SECRET: 's3' }) })

  it('پیام جدید تا تأیید دیده نمی‌شود و phone هرگز برنمی‌گردد', () => {
    expect(e.p({ action: 'postMessage', clientId: CID, message: 'سلام آقا', phone: '۰۹۱۲۳۴۵۶۷۸۹' }).ok).toBe(true)
    expect(e.g({ action: 'messages' }).data.items).toHaveLength(0)
    e.data.Messages[0][5] = 'true'
    const items = e.g({ action: 'messages' }).data.items
    expect(items).toHaveLength(1)
    expect(JSON.stringify(items)).not.toContain('0912')
    expect(items[0]).not.toHaveProperty('clientId')
  })
  it('AUTO_APPROVE', () => {
    const a = makeEnv({ AUTO_APPROVE: 'true' })
    a.p({ action: 'postMessage', clientId: CID, message: 'سلام آقا' })
    expect(a.g({ action: 'messages' }).data.items).toHaveLength(1)
  })
  it('honeypot بی‌صدا موفق و ذخیره نمی‌شود', () => {
    expect(e.p({ action: 'postMessage', clientId: CID, message: 'سلام آقا', website: 'x' }).ok).toBe(true)
    expect(e.data.Messages).toHaveLength(0)
  })
  it('اعتبارسنجی و بدنه خراب', () => {
    expect(e.p({ action: 'postMessage', clientId: CID, message: 'a' }).code).toBe('validation')
    expect(e.p({ action: 'postMessage', clientId: 'x', message: 'سلام آقا' }).code).toBe('validation')
    expect(e.p('not json').code).toBe('validation')
    expect(e.g({ action: 'nope' }).code).toBe('validation')
  })
  it('rate limit پیام: سه تا مجاز، چهارمی رد', () => {
    for (let i = 0; i < 3; i++) expect(e.p({ action: 'postMessage', clientId: CID, message: 'سلام آقا' }).ok).toBe(true)
    expect(e.p({ action: 'postMessage', clientId: CID, message: 'سلام آقا' }).code).toBe('rate_limited')
  })
  it('formula injection خنثی و در خروجی برمی‌گردد به متن اصلی', () => {
    e.p({ action: 'postMessage', clientId: CID, message: '=HYPERLINK("http://x")', name: '+cmd' })
    expect(e.data.Messages[0][4]).toBe("'=HYPERLINK(\"http://x\")")
    e.data.Messages[0][5] = 'true'
    expect(e.g({ action: 'messages' }).data.items[0].message).toBe('=HYPERLINK("http://x")')
  })
  it('cursor pagination', () => {
    const a = makeEnv({ AUTO_APPROVE: 'true' })
    for (let i = 0; i < 5; i++) a.p({ action: 'postMessage', clientId: `client-000${i}-abcd`, message: `پیام ${i}` })
    const p1 = a.g({ action: 'messages', limit: '2' }).data
    expect(p1.items.map((x: { message: string }) => x.message)).toEqual(['پیام 4', 'پیام 3'])
    const p2 = a.g({ action: 'messages', limit: '2', cursor: p1.nextCursor }).data
    const p3 = a.g({ action: 'messages', limit: '2', cursor: p2.nextCursor }).data
    expect(p3.items).toHaveLength(1)
    expect(p3.nextCursor).toBeNull()
    expect(a.g({ action: 'messages', cursor: '-1' }).code).toBe('validation')
  })
  it('صلوات شمارنده', () => {
    e.p({ action: 'addSalavat', clientId: CID })
    expect(e.p({ action: 'addSalavat', clientId: CID }).data.salavat).toBe(2)
    expect(e.p({ action: 'addSalavat', clientId: CID, count: 10 }).data.salavat).toBe(12)
    expect(e.p({ action: 'addSalavat', clientId: CID, count: 101 }).code).toBe('validation')
    expect(e.p({ action: 'addSalavat', clientId: CID, count: 0 }).code).toBe('validation')
    expect(e.p({ action: 'addSalavat', clientId: CID, count: 1.5 }).code).toBe('validation')
  })
  it('همیاری: ادمین، جستجو، افزودن/upsert، پرداخت خاموش/روشن، تأیید، پرداخت‌های من', () => {
    expect(e.p({ action: 'addCause', title: 'الف' }).ok).toBe(false)
    const c = e.p({ action: 'addCause', adminToken: 'adm', title: 'مسجد', accounts: ['عمرانی', { title: 'فرهنگی', bank: { bankName: 'ملی', ownerName: 'ف', cardNumber: '۶۰۳۷۹۹۷۱۱۲۳۴۵۶۷۸', iban: '' } }] }).data
    expect(c.accounts).toHaveLength(2)
    expect(c.accounts[1].bank.cardNumber).toBe('6037997112345678')
    expect(c.accounts[0].bank).toBeUndefined()
    expect(c.online).toBe(false)
    expect(e.p({ action: 'addCause', adminToken: 'adm', title: 'x', bank: { cardNumber: '12' } }).code).toBe('validation')
    expect(e.g({ action: 'causes', q: 'فرهنگي' }).data).toHaveLength(1)
    expect(e.g({ action: 'config' }).data).toEqual({ paymentsEnabled: false })

    // upsert با id ثابت (seed از causes.json): بار دوم به‌روزرسانی می‌کند، ردیف جدید نمی‌سازد
    e.p({ action: 'addCause', adminToken: 'adm', id: 'mosque', title: 'مسجد ۱', online: false })
    e.p({ action: 'addCause', adminToken: 'adm', id: 'mosque', title: 'مسجد ۲', online: true, accounts: [{ id: 'civil', title: 'عمرانی', online: true }] })
    const m = e.g({ action: 'cause', id: 'mosque' }).data
    expect(m.title).toBe('مسجد ۲'); expect(m.online).toBe(true); expect(m.accounts[0]).toMatchObject({ id: 'civil', online: true })
    expect(e.g({ action: 'causes' }).data.filter((x: { id: string }) => x.id === 'mosque')).toHaveLength(1)
    expect(e.p({ action: 'addCause', adminToken: 'adm', id: 'BAD ID', title: 'x' }).code).toBe('validation')

    // بدون endpoint یا خاموش → خطا
    expect(e.p({ action: 'startPayment', clientId: CID, causeId: 'mosque', accountId: 'civil', amountToman: 50000 }).ok).toBe(false)
  })
  it('پرداخت: روشن/خاموش، online هر مقصد، header راز، تأیید با authority', () => {
    const fetched: { url: string; opts: { headers: Record<string, string> } }[] = []
    const f = makeEnv(
      { ADMIN_TOKEN: 'adm', PAYMENT_SHARED_SECRET: 's3s3s3s3s3s3s3s3', PAYMENT_ENDPOINT: 'https://pay.example/start', PAYMENTS_ENABLED: 'true' },
      (url, opts) => { fetched.push({ url, opts: opts as { headers: Record<string, string> } }); return { code: 200, body: JSON.stringify({ ok: true, payUrl: 'https://gw/pay/1', authority: 'AUTH1' }) } },
    )
    f.p({ action: 'addCause', adminToken: 'adm', id: 'on', title: 'روشن', online: true })
    f.p({ action: 'addCause', adminToken: 'adm', id: 'off', title: 'خاموش', online: false })
    f.p({ action: 'addCause', adminToken: 'adm', id: 'multi', title: 'چندحسابه', accounts: [{ id: 'civil', title: 'ع', online: true }, { id: 'other', title: 'س', online: false }] })
    const pay = (causeId: string, accountId?: string, amountToman = 50000) => f.p({ action: 'startPayment', clientId: CID, causeId, accountId, amountToman })

    expect(f.g({ action: 'config' }).data.paymentsEnabled).toBe(true)
    expect(pay('off').ok).toBe(false)                         // online نیست
    expect(pay('multi', 'other').ok).toBe(false)              // حساب online نیست
    expect(pay('on', undefined, 5).code).toBe('validation')   // کمتر از حداقل
    expect(fetched).toHaveLength(0)
    const r = pay('on')
    expect(r.data.payUrl).toBe('https://gw/pay/1')
    expect(fetched[0].opts.headers['X-Auth']).toBe('s3s3s3s3s3s3s3s3')
    expect(pay('multi', 'civil').ok).toBe(true)

    const [p1, p2] = f.data.Payments.map((x) => x[0])
    const conf = (paymentId: unknown, o: Record<string, unknown>) => f.p({ action: 'confirmPayment', secret: 's3s3s3s3s3s3s3s3', paymentId, ...o })
    expect(conf(p1, { status: 'paid', authority: 'WRONG' }).code).toBe('validation')        // authority نامطابق
    expect(f.g({ action: 'helpTotal' }).data.totalToman).toBe(0)
    expect(conf(p1, { status: 'paid', authority: 'AUTH1', refId: 'R1' }).ok).toBe(true)
    expect(conf(p1, { status: 'paid', authority: 'AUTH1', refId: 'R1' }).ok).toBe(true)     // تکرار بی‌اثر
    expect(conf(p1, { status: 'failed' }).code).toBe('validation')                          // paid قابل تغییر نیست
    expect(conf(p2, { status: 'paid', authority: 'AUTH1' }).ok).toBe(true)                  // authority همان است (mock یکسان برمی‌گرداند)
    expect(f.g({ action: 'helpTotal' }).data.totalToman).toBe(100000)
    expect(f.p({ action: 'confirmPayment', secret: 'bad', paymentId: p1, status: 'paid' }).ok).toBe(false)
    expect(conf('nope', { status: 'failed' }).code).toBe('not_found')

    const off = makeEnv({ ADMIN_TOKEN: 'adm', PAYMENT_ENDPOINT: 'https://x', PAYMENT_SHARED_SECRET: 's3s3s3s3s3s3s3s3' })
    off.p({ action: 'addCause', adminToken: 'adm', id: 'on', title: 'روشن', online: true })
    expect(off.g({ action: 'config' }).data.paymentsEnabled).toBe(false)
    expect(off.p({ action: 'startPayment', clientId: CID, causeId: 'on', amountToman: 50000 }).ok).toBe(false) // سراسری خاموش
  })
  it('شکست ساخت تراکنش → failed و خطا', () => {
    const f = makeEnv({ ADMIN_TOKEN: 'adm', PAYMENT_ENDPOINT: 'https://x', PAYMENT_SHARED_SECRET: 's3s3s3s3s3s3s3s3', PAYMENTS_ENABLED: 'true' }, () => ({ code: 500, body: '' }))
    const c = f.p({ action: 'addCause', adminToken: 'adm', title: 'الف', online: true }).data
    expect(f.p({ action: 'startPayment', clientId: CID, causeId: c.id, amountToman: 50000 }).ok).toBe(false)
    expect(f.data.Payments[0][6]).toBe('failed')
  })
})
