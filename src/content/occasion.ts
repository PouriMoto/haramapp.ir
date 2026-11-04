export interface Occasion { cat: 'fatemiyeh' | 'muharram' | 'ramadan' | 'qadr'; text: string }

/** ماه و روز قمری (ام‌القری). با تقویم رسمی ایران ممکن است ±۱ تا ۲ روز اختلاف داشته باشد؛ فقط برای نمایش پیشنهاد است. */
function hijri(d: Date): { m: number; d: number } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' }).formatToParts(d)
    const m = Number(parts.find((p) => p.type === 'month')?.value)
    const day = Number(parts.find((p) => p.type === 'day')?.value)
    return Number.isFinite(m) && Number.isFinite(day) ? { m, d: day } : null
  } catch { return null }
}

export function currentOccasion(now: Date = new Date()): Occasion | null {
  const h = hijri(now)
  if (!h) return null
  if (h.m === 9 && h.d >= 19 && h.d <= 23) return { cat: 'qadr', text: 'شب‌های قدر؛ نوا و دعاهای ویژه' }
  if (h.m === 9) return { cat: 'ramadan', text: 'ماه مبارک رمضان؛ دعاها و نواهای این ماه' }
  if (h.m === 1 && h.d <= 12) return { cat: 'muharram', text: 'ایام عزای حسینی؛ نوا و دعاهای محرم' }
  if ((h.m === 5 && h.d >= 13) || (h.m === 6 && h.d <= 3)) return { cat: 'fatemiyeh', text: 'ایام فاطمیه؛ نوا و دعاهای ویژه' }
  return null
}
