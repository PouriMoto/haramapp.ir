import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import { useToast } from './toast'

const ICON = { ok: IconCircleCheck, warn: IconAlertTriangle, info: IconInfoCircle }

export function Toaster() {
  const t = useToast()
  const Icon = t ? ICON[t.kind] : IconInfoCircle
  return (
    <div className="toaster" role="status" aria-live="polite">
      {t && (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <Icon size={18} aria-hidden />
          <span>{t.text}</span>
        </div>
      )}
    </div>
  )
}
