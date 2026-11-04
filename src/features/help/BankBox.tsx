import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import type { BankInfo } from '../../data/types'
import { toast } from '../../components/toast'
import { copyText, formatCard, ibanForCopy } from '../../lib/copy'

function CopyRow({ label, value, shown, mono, hint }: { label: string; value: string; shown?: string; mono?: boolean; hint?: string }) {
  const [done, setDone] = useState<'ok' | 'fail' | null>(null)
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])

  const copy = async () => {
    const ok = await copyText(value)
    setDone(ok ? 'ok' : 'fail')
    toast(ok ? `${label} کپی شد` : 'کپی انجام نشد؛ دستی انتخاب کنید', ok ? 'ok' : 'warn')
    clearTimeout(t.current)
    t.current = setTimeout(() => setDone(null), 1800)
  }

  return (
    <div className="copy-row">
      <div className="copy-row__text">
        <span className="muted">{label}</span>
        <bdo dir="ltr" className={mono ? 'copy-row__val copy-row__val--mono' : 'copy-row__val'}>{shown ?? value}</bdo>
        {hint && <span className="muted">{hint}</span>}
      </div>
      <button type="button" className="copy-btn" onClick={() => void copy()} aria-label={`کپی ${label}`}>
        {done === 'ok' ? <IconCheck size={18} aria-hidden /> : <IconCopy size={18} aria-hidden />}
        <span aria-live="polite">{done === 'ok' ? 'کپی شد' : done === 'fail' ? 'ناموفق' : 'کپی'}</span>
      </button>
    </div>
  )
}

/** واریز مستقیم برای کسانی که از لینک پرداخت نمی‌کنند. bank خالی = چیزی نمایش داده نمی‌شود. */
export function BankBox({ bank, title }: { bank?: BankInfo; title?: string }) {
  if (!bank || (!bank.cardNumber && !bank.iban)) return null
  return (
    <div className="bank-box">
      <h3>واریز مستقیم{title ? ` — ${title}` : ''}</h3>
      {(bank.bankName || bank.ownerName) && (
        <p className="muted">{[bank.bankName && `بانک ${bank.bankName}`, bank.ownerName && `به نام ${bank.ownerName}`].filter(Boolean).join(' · ')}</p>
      )}
      {bank.cardNumber && <CopyRow label="شماره کارت" value={bank.cardNumber} shown={formatCard(bank.cardNumber)} mono />}
      {bank.iban && <CopyRow label="شماره شبا" value={ibanForCopy(bank.iban)} shown={bank.iban} mono hint="هنگام کپی، IR حذف می‌شود" />}
    </div>
  )
}
