import type { Cause, CauseAccount, CausesFile } from '../types'
import type { Api, HelpApi } from '../contract'
import { ApiError } from '../errors'

/**
 * پروتکل: GET ?action=...&... ؛ POST با Content-Type: text/plain و بدنه JSON
 * (تا preflight CORS رخ ندهد). پاسخ: { ok: true, data } | { ok: false, code, error }
 */
interface Envelope<T> { ok: boolean; data?: T; code?: string; error?: string }

const CODES = ['network', 'rate_limited', 'validation', 'server', 'not_found'] as const

async function unwrap<T>(res: Response): Promise<T> {
  let body: Envelope<T>
  try {
    body = (await res.json()) as Envelope<T>
  } catch {
    throw new ApiError('server', 'پاسخ سرور نامعتبر است')
  }
  if (!body.ok) {
    const code = CODES.find((c) => c === body.code) ?? 'server'
    throw new ApiError(code, body.error ?? 'خطای سرور')
  }
  return body.data as T
}

function makeTransport(baseUrl: string) {
  if (!baseUrl) throw new ApiError('server', 'VITE_APPS_SCRIPT_URL تنظیم نشده')
  const get = async <T>(params: Record<string, string | number | undefined>): Promise<T> => {
    const u = new URL(baseUrl)
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') u.searchParams.set(k, String(v))
    try {
      return await unwrap<T>(await fetch(u, { redirect: 'follow' }))
    } catch (e) {
      throw e instanceof ApiError ? e : new ApiError('network', 'اتصال برقرار نشد')
    }
  }
  const post = async <T>(body: Record<string, unknown>): Promise<T> => {
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        redirect: 'follow',
      })
      return await unwrap<T>(res)
    } catch (e) {
      throw e instanceof ApiError ? e : new ApiError('network', 'اتصال برقرار نشد')
    }
  }
  return { get, post }
}

export function createAppsScriptApi(baseUrl: string, clientId: () => string): Api {
  const t = makeTransport(baseUrl)
  return {
    listMessages: ({ cursor, limit }) => t.get({ action: 'messages', cursor, limit }),
    postMessage: async (i) => {
      await t.post<unknown>({ action: 'postMessage', clientId: clientId(), ...i })
    },
    getStats: () => t.get({ action: 'stats' }),
    addSalavat: (count = 1) => t.post({ action: 'addSalavat', clientId: clientId(), count }),
  }
}

/**
 * کارت‌های ایستا (data/causes.json) مرجع عنوان/بانک‌اند؛ Apps Script فقط «جمع مبلغ» و «آنلاین بودن» را اضافه می‌کند
 * و کارت‌هایی که فقط در شیت هستند (افزودهٔ کاربران) را هم نگه می‌دارد. اگر شیت در دسترس نبود، کارت‌های ایستا (آنلاین=خاموش) نمایش داده می‌شود.
 */
export function mergeCauses(staticFile: CausesFile | null, sheet: Cause[]): Cause[] {
  const byId = new Map(sheet.map((c) => [c.id, c]))
  const out: Cause[] = []
  for (const s of staticFile?.causes ?? []) {
    const live = byId.get(s.id)
    byId.delete(s.id)
    const liveAcc = new Map((live?.accounts ?? []).map((a) => [a.id, a]))
    out.push({
      id: s.id, title: s.title, description: s.description,
      bank: s.bank, online: live?.online === true, totalToman: live?.totalToman ?? 0,
      accounts: s.accounts.map((a): CauseAccount => ({ id: a.id, title: a.title, bank: a.bank, online: liveAcc.get(a.id)?.online === true, totalToman: liveAcc.get(a.id)?.totalToman ?? 0 })),
    })
  }
  return [...out, ...byId.values()]
}

async function loadStatic(url: string): Promise<CausesFile | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const j = (await res.json()) as CausesFile
    return Array.isArray(j.causes) ? j : null
  } catch { return null }
}

export function createAppsScriptHelpApi(baseUrl: string, staticUrl = ''): HelpApi {
  const t = makeTransport(baseUrl)
  const sheet = () => t.get<Cause[]>({ action: 'causes' }).catch(() => [] as Cause[])
  return {
    listCauses: async () => {
      const [file, live] = await Promise.all([staticUrl ? loadStatic(staticUrl) : null, sheet()])
      if (!file) return t.get({ action: 'causes' }) // بدون فایل ایستا: رفتار قبلی (شیت)
      return mergeCauses(file, live)
    },
    getCause: async (id) => {
      const [file, live] = await Promise.all([staticUrl ? loadStatic(staticUrl) : null, sheet()])
      const one = mergeCauses(file, live).find((c) => c.id === id)
      if (!one) throw new ApiError('not_found', 'مقصد پیدا نشد')
      return one
    },
    addCause: (i) => t.post({ action: 'addCause', ...i }),
    startPayment: (i) => t.post({ action: 'startPayment', ...i }),
    listMyPayments: (clientId) => t.get({ action: 'myPayments', clientId }),
    getHelpTotal: () => t.get({ action: 'helpTotal' }),
    getConfig: () => t.get({ action: 'config' }),
  }
}
