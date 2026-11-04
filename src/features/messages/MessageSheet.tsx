import { IconCheck } from '@tabler/icons-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { ApiError, ValidationError } from '../../data/errors'
import { usePostMessage } from '../../data/hooks/useMessages'

const MAX = 1000

export function MessageSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const uid = useId()
  const post = usePostMessage()
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const { reset } = post

  useEffect(() => { if (open) reset() }, [open, reset])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    post.mutate({ message, name, phone, website }, {
      onSuccess: () => { setMessage(''); setName(''); setPhone('') },
    })
  }

  const err = post.error
  const fieldErr = (f: string) => (err instanceof ValidationError && err.field === f ? err.message : null)
  const generalErr = err && !(err instanceof ValidationError) ? (err instanceof ApiError ? err.message : 'ثبت انجام نشد؛ دوباره تلاش کنید.') : null

  return (
    <Sheet open={open} onClose={onClose} title="درد و دل با امام رضا (ع)">

        {post.isSuccess ? (
          <div className="sheet__done" role="status">
            <span className="sheet__check"><IconCheck size={28} aria-hidden /></span>
            <p><strong>درد و دل شما ثبت شد.</strong></p>
            <p className="muted">پس از بررسی و تأیید، در لیست نمایش داده می‌شود.</p>
            <button type="button" className="btn" onClick={onClose}>بستن</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor={`${uid}-m`}>آنچه در دل دارید</label>
            <textarea id={`${uid}-m`} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={MAX} required placeholder="بنویسید…" aria-invalid={!!fieldErr('message')} />
            <div className="sheet__row"><span className="field-err" role="alert">{fieldErr('message')}</span><span className="muted">{message.length.toLocaleString('fa-IR')}/{MAX.toLocaleString('fa-IR')}</span></div>

            <label htmlFor={`${uid}-n`}>نام (اختیاری)</label>
            <input id={`${uid}-n`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="given-name" />
            <span className="field-err" role="alert">{fieldErr('name')}</span>

            <label htmlFor={`${uid}-p`}>شمارهٔ موبایل (اختیاری)</label>
            <input id={`${uid}-p`} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="tel" dir="ltr" placeholder="09…" aria-describedby={`${uid}-ph`} />
            <span id={`${uid}-ph`} className="muted">شماره هرگز نمایش داده نمی‌شود.</span>
            <span className="field-err" role="alert">{fieldErr('phone')}</span>

            {/* تله ضد ربات: برای کاربر نامرئی */}
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />

            {generalErr && <p className="field-err" role="alert">{generalErr}</p>}
            <button type="submit" className="btn btn--block" disabled={post.isPending}>{post.isPending ? 'در حال ارسال…' : 'ارسال'}</button>
          </form>
        )}
    </Sheet>
  )
}
