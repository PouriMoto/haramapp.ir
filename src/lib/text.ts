const FA = '۰۱۲۳۴۵۶۷۸۹'
const AR = '٠١٢٣٤٥٦٧٨٩'

/** ارقام فارسی/عربی → لاتین */
export function normalizeDigits(s: string): string {
  return s.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = FA.indexOf(d)
    return String(i >= 0 ? i : AR.indexOf(d))
  })
}

/** نرمال‌سازی برای جستجو: ی/ک عربی، ZWNJ، ارقام، حروف کوچک */
export function normalizeSearch(s: string): string {
  return normalizeDigits(s)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[‌‏‎]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function formatToman(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n)
}
