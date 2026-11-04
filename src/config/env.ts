// تنها فایلی که import.meta.env را می‌خواند. بقیهٔ کد فقط `env` را import می‌کند.

export const DATA_PROVIDERS = ['mock', 'appsscript', 'supabase'] as const
export type DataProvider = (typeof DATA_PROVIDERS)[number]

const raw = import.meta.env

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.find((a) => a === value) ?? fallback
}

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function cleanUrl(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '')
}

// تنظیمات اصلی از data/site.json می‌آید (vite آن را به __SITE__ تزریق می‌کند). متغیرهای VITE_* فقط «جایگزین» اختیاری‌اند.
const site = typeof __SITE__ === 'undefined' ? {} : __SITE__
const appsScriptUrl = cleanUrl(raw.VITE_APPS_SCRIPT_URL) || cleanUrl(site.appsScriptUrl)

export const env = Object.freeze({
  // آدرس Apps Script پر باشد → اپ واقعی (appsscript)، خالی → داده نمایشی (mock)
  dataProvider: oneOf(raw.VITE_DATA_PROVIDER, DATA_PROVIDERS, appsScriptUrl ? 'appsscript' : 'mock'),
  appsScriptUrl,
  supabaseUrl: cleanUrl(raw.VITE_SUPABASE_URL),
  supabaseAnonKey: (raw.VITE_SUPABASE_ANON_KEY ?? '').trim(),
  // محتوا (manifest و متن دعاها) در همین سایت و پوشهٔ content/ است؛ با VITE_MEDIA_BASE_URL می‌شود به میزبان دیگری برد.
  mediaBaseUrl: cleanUrl(raw.VITE_MEDIA_BASE_URL) || cleanUrl(`${raw.BASE_URL}content`),
  homeLimit: positiveInt(raw.VITE_HOME_LIMIT ?? String(site.homeLimit ?? ''), 3),
  basePath: import.meta.env.BASE_URL,
})

export type Env = typeof env
