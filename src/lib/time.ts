const nf = new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false })

/** ۶۵ → «۰۱:۰۵» (ارقام فارسی) */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return nf.format(0) + ':' + nf.format(0)
  const s = Math.floor(sec)
  return `${nf.format(Math.floor(s / 60))}:${nf.format(s % 60)}`
}
