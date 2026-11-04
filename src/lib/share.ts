import { toast } from '../components/toast'
import { env } from '../config/env'
import { copyText } from './copy'

/** اشتراک‌گذاری پیوند اپ؛ اگر Web Share نبود، کپی + toast. path با «/» شروع می‌شود. */
export async function shareLink(title: string, path = '/') {
  const url = location.origin + env.basePath.replace(/\/$/, '') + path
  try {
    if (navigator.share) { await navigator.share({ title, url }); return }
  } catch (e) {
    if ((e as DOMException).name === 'AbortError') return
  }
  const ok = await copyText(url)
  toast(ok ? 'پیوند کپی شد' : 'کپی انجام نشد', ok ? 'ok' : 'warn')
}
