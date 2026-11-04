/** در زمان بیکاریِ مرورگر، تکهٔ سنگین متن دعا را از قبل می‌گیرد تا باز کردن دعا فوری باشد. */
export function prefetchPrayerPage() {
  const run = () => void import('../features/prayers/PrayerPage').catch(() => undefined)
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 5000 })
  else setTimeout(run, 3000)
}
