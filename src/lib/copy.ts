/** کپی در کلیپ‌بورد؛ در مرورگرهای قدیمی/غیر HTTPS به execCommand برمی‌گردد. true = موفق */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** ۱۶ رقم → گروه‌های ۴تایی برای نمایش (کپی با ارقام پیوسته انجام می‌شود) */
export function formatCard(n: string): string {
  return n.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** شبا برای کپی: بدون پیشوند IR (اپ‌های بانکی خودشان IR را اضافه می‌کنند). نمایش همچنان با IR است. */
export function ibanForCopy(iban: string): string {
  return iban.replace(/^IR/i, '')
}
