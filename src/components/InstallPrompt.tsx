import { IconDownload, IconX } from '@tabler/icons-react'
import { dismissInstall, runInstall, useInstallMode } from '../pwa/install'

/** از همان بازدید اول نشان داده می‌شود؛ «بعداً» ۱۴ روز مخفی‌اش می‌کند. بدون محاسبهٔ تعداد بازدید. */
export function InstallPrompt() {
  const mode = useInstallMode()
  if (!mode) return null
  return (
    <div className="install" role="region" aria-label="نصب برنامه">
      <IconDownload size={26} aria-hidden />
      <div className="install__text">
        <strong>نصب «حرم رضوی» روی گوشی</strong>
        <span>{mode === 'ios'
          ? 'در Safari دکمهٔ اشتراک‌گذاری را بزنید و «Add to Home Screen» را انتخاب کنید.'
          : 'مثل یک برنامه، سریع‌تر و حتی با اینترنت ضعیف باز می‌شود.'}</span>
      </div>
      {mode === 'native' && <button type="button" className="btn" onClick={() => void runInstall()}>نصب</button>}
      <button type="button" className="install__x" onClick={dismissInstall} aria-label="بعداً"><IconX size={18} aria-hidden /></button>
    </div>
  )
}
