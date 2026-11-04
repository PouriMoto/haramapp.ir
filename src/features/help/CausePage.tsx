import { IconChevronRight } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ListState } from '../../components/ListState'
import { ApiError, ValidationError } from '../../data/errors'
import { PAYMENT_LIMITS, useCause, useHelpConfig, useStartPayment } from '../../data/hooks/useHelp'
import { safePayRedirect } from '../../lib/redirect'
import { formatToman, normalizeDigits } from '../../lib/text'
import { BankBox } from './BankBox'

const CHIPS = [50_000, 100_000, 500_000, 1_000_000]

export function CausePage() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const q = useCause(id)
  const pay = useStartPayment()
  const config = useHelpConfig()
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')

  const back = <Link to="/help" className="back-link"><IconChevronRight size={18} aria-hidden /> همیاری</Link>

  if (q.isPending || q.isError) {
    return (
      <section>
        {back}
        <ListState loading={q.isPending} error={q.isError} empty={false} emptyText="" onRetry={() => void q.refetch()}>{null}</ListState>
      </section>
    )
  }
  const cause = q.data
  const multi = cause.accounts.length > 0
  const account = cause.accounts.find((a) => a.id === accountId)
  const bank = account ? account.bank : cause.bank
  const enabled = config.data?.paymentsEnabled === true
  // آنلاین فقط وقتی کلید کل روشن باشد و مقصد (کارت یا حساب انتخابی) مرچنت جدا داشته باشد
  const showPay = enabled && (multi ? cause.accounts.some((a) => a.online) : cause.online === true)
  const targetOnline = multi ? account?.online === true : cause.online === true
  const amountNum = Number(normalizeDigits(amount).replace(/[^\d]/g, '')) || 0

  const onAmount = (v: string) => {
    const digits = normalizeDigits(v).replace(/[^\d]/g, '')
    setAmount(digits ? Number(digits).toLocaleString('fa-IR') : '')
    pay.reset()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (multi && !account) return
    pay.mutate({ causeId: cause.id, accountId: account?.id, amountText: amount }, {
      onSuccess: ({ payUrl }) => {
        const r = safePayRedirect(payUrl)
        if (!r) return
        if (r.kind === 'internal') void nav(r.to)
        else window.location.assign(r.url)
      },
    })
  }

  const err = pay.error
  const amountErr = err instanceof ValidationError && err.field === 'amount' ? err.message : null
  const general = err && !amountErr ? (err instanceof ApiError ? err.message : 'شروع پرداخت انجام نشد.') : null
  const badRedirect = pay.isSuccess && !safePayRedirect(pay.data.payUrl)

  return (
    <section>
      {back}
      <h2 className="page-title">{cause.title}</h2>
      {cause.description && <p className="muted" style={{ marginBottom: 8 }}>{cause.description}</p>}
      <div className="help-total"><span>کمک‌های دریافتی</span><strong>{formatToman(cause.totalToman)} تومان</strong></div>

      {showPay ? (
      <form onSubmit={submit} noValidate className="pay-form">
        {multi && (
          <fieldset className="acc-group">
            <legend>انتخاب حساب</legend>
            {cause.accounts.map((a) => (
              <label key={a.id} className={a.id === accountId ? 'acc acc--on' : 'acc'}>
                <input type="radio" name="account" value={a.id} checked={a.id === accountId} onChange={() => setAccountId(a.id)} />
                <span>{a.title}</span>
                <small className="muted">{formatToman(a.totalToman)} تومان</small>
              </label>
            ))}
          </fieldset>
        )}

        {multi && account && !targetOnline && <p className="muted">برای این حساب پرداخت آنلاین فعال نیست؛ از واریز مستقیم استفاده کنید.</p>}

        <label htmlFor="amount">مبلغ (تومان)</label>
        <input id="amount" className="amount-input" value={amount} onChange={(e) => onAmount(e.target.value)} inputMode="numeric" autoComplete="off" dir="ltr" placeholder="مثلاً ۱۰۰٬۰۰۰" aria-invalid={!!amountErr} />
        <div className="chips">
          {CHIPS.map((c) => <button key={c} type="button" className="chip" onClick={() => onAmount(String(c))}>{formatToman(c)}</button>)}
        </div>
        <p className="muted">حداقل {formatToman(PAYMENT_LIMITS.minToman)} تومان{amountNum > 0 && <> · مبلغ انتخابی: <strong>{formatToman(amountNum)} تومان</strong></>}</p>
        <span className="field-err" role="alert">{amountErr}{multi && !account && amountNum > 0 ? 'ابتدا حساب را انتخاب کنید.' : ''}</span>
        {general && <p className="field-err" role="alert">{general}</p>}
        {badRedirect && <p className="field-err" role="alert">آدرس درگاه نامعتبر است؛ پرداخت انجام نشد.</p>}

        <button type="submit" className="btn btn--block" disabled={pay.isPending || (multi && !account) || !targetOnline}>{pay.isPending ? 'در حال اتصال به درگاه…' : 'پرداخت آنلاین'}</button>
      </form>
      ) : (
        <p className="muted pay-off">{config.isPending ? '…' : 'پرداخت آنلاین فعلاً فعال نیست.'}{bank ? ' می‌توانید از واریز مستقیم زیر استفاده کنید.' : multi ? ' برای دیدن شماره حساب، یکی از حساب‌ها را انتخاب کنید.' : ''}</p>
      )}

      <BankBox bank={bank} title={account?.title} />
      {multi && !account && cause.accounts.some((a) => a.bank) && <p className="muted">برای دیدن شماره کارت و شبا، یکی از حساب‌ها را انتخاب کنید.</p>}
    </section>
  )
}
