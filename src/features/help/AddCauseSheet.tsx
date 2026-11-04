import { IconCheck } from '@tabler/icons-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { ApiError, ValidationError } from '../../data/errors'
import { useAddCause } from '../../data/hooks/useHelp'

/** افزودن کارت (مدیر). توکن مدیر فقط همین‌جا تایپ و همراه درخواست فرستاده می‌شود؛ هیچ‌جا ذخیره نمی‌شود. */
export function AddCauseSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const uid = useId()
  const add = useAddCause()
  const { reset } = add
  const [f, setF] = useState({ adminToken: '', title: '', description: '', accounts: '', bankName: '', ownerName: '', cardNumber: '', iban: '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))
  useEffect(() => { if (open) reset() }, [open, reset])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const accounts = f.accounts.split(/[\n،,]/).map((t) => ({ title: t.trim() })).filter((a) => a.title)
    add.mutate({
      adminToken: f.adminToken, title: f.title, description: f.description || undefined, accounts,
      bank: { bankName: f.bankName, ownerName: f.ownerName, cardNumber: f.cardNumber, iban: f.iban },
    }, { onSuccess: () => setF({ adminToken: '', title: '', description: '', accounts: '', bankName: '', ownerName: '', cardNumber: '', iban: '' }) })
  }

  const err = add.error
  const fe = (field: string) => (err instanceof ValidationError && err.field === field ? err.message : null)
  const general = err && !(err instanceof ValidationError) ? (err instanceof ApiError ? err.message : 'ثبت انجام نشد.') : null

  return (
    <Sheet open={open} onClose={onClose} title="افزودن کارت همیاری">
      {add.isSuccess ? (
        <div className="sheet__done" role="status">
          <span className="sheet__check"><IconCheck size={28} aria-hidden /></span>
          <p><strong>کارت اضافه شد.</strong></p>
          <button type="button" className="btn" onClick={onClose}>بستن</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <label htmlFor={`${uid}-tok`}>رمز مدیر</label>
          <input id={`${uid}-tok`} type="password" value={f.adminToken} onChange={set('adminToken')} autoComplete="off" dir="ltr" />
          <label htmlFor={`${uid}-t`}>عنوان</label>
          <input id={`${uid}-t`} value={f.title} onChange={set('title')} maxLength={80} aria-invalid={!!fe('title')} />
          <span className="field-err" role="alert">{fe('title')}</span>
          <label htmlFor={`${uid}-d`}>توضیح (اختیاری)</label>
          <input id={`${uid}-d`} value={f.description} onChange={set('description')} maxLength={300} />
          <label htmlFor={`${uid}-a`}>حساب‌ها (اختیاری؛ با ویرگول یا خط جدید جدا کنید)</label>
          <textarea id={`${uid}-a`} rows={2} value={f.accounts} onChange={set('accounts')} placeholder="عمرانی، فرهنگی، سایر" />
          <span className="field-err" role="alert">{fe('accounts')}</span>
          <p className="muted">واریز مستقیم (اختیاری — برای کارتی که حساب جدا ندارد)</p>
          <input aria-label="نام بانک" placeholder="نام بانک" value={f.bankName} onChange={set('bankName')} />
          <input aria-label="نام صاحب حساب" placeholder="نام صاحب حساب" value={f.ownerName} onChange={set('ownerName')} />
          <input aria-label="شماره کارت" placeholder="شماره کارت ۱۶ رقمی" inputMode="numeric" dir="ltr" value={f.cardNumber} onChange={set('cardNumber')} />
          <input aria-label="شماره شبا" placeholder="IR…" dir="ltr" value={f.iban} onChange={set('iban')} />
          <span className="field-err" role="alert">{fe('bank')}</span>
          {general && <p className="field-err" role="alert">{general}</p>}
          <button type="submit" className="btn btn--block" disabled={add.isPending}>{add.isPending ? 'در حال ثبت…' : 'افزودن'}</button>
        </form>
      )}
    </Sheet>
  )
}
