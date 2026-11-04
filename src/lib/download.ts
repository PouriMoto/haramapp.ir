import { toast } from '../components/toast'

const clean = (s: string) => s.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) || 'haram'

function extOf(url: string): string {
  try { return new URL(url).pathname.match(/\.(mp3|m4a|ogg)$/i)?.[1].toLowerCase() ?? 'mp3' } catch { return 'mp3' }
}

/**
 * دانلود به گوشی/رایانهٔ کاربر. اگر میزبان CORS بدهد، فایل با نام خوانا ذخیره می‌شود؛
 * وگرنه فایل در تب جدید باز می‌شود تا کاربر از منوی مرورگر «ذخیره» کند (بدون هیچ سروری از ما).
 */
export async function downloadAudio(url: string, title: string): Promise<void> {
  const name = `${clean(title)}.${extOf(url)}`
  toast('دانلود شروع شد…')
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(String(res.status))
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    toast('ذخیره شد؛ در پوشهٔ دانلودها', 'ok')
  } catch {
    window.open(url, '_blank', 'noopener')
    toast('فایل در تب جدید باز شد؛ از منوی مرورگر «ذخیره» را بزنید', 'info', 4500)
  }
}
