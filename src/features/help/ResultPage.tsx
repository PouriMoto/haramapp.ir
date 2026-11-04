import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { Link, useSearchParams } from 'react-router-dom'

/** بازگشت از درگاه: `/help/result?status=ok|fail&id=...` — وضعیت نهایی را سرور تعیین می‌کند؛ این صفحه فقط پیام می‌دهد. */
export function ResultPage() {
  const [sp] = useSearchParams()
  const ok = sp.get('status') === 'ok'
  return (
    <section className="sheet__done" role="status" style={{ paddingTop: 24 }}>
      <span className={ok ? 'sheet__check' : 'sheet__check sheet__check--bad'}>{ok ? <IconCheck size={28} aria-hidden /> : <IconAlertCircle size={28} aria-hidden />}</span>
      <h2 className="page-title">{ok ? 'پرداخت شما ثبت شد' : 'پرداخت انجام نشد'}</h2>
      <p className="muted">{ok ? 'از همراهی شما سپاسگزاریم. جزئیات را در «پرداخت‌های من» ببینید.' : 'اگر مبلغی از حساب شما کسر شده، معمولاً تا ۷۲ ساعت برمی‌گردد. می‌توانید دوباره تلاش کنید.'}</p>
      <Link to="/help" className="btn">بازگشت به همیاری</Link>
    </section>
  )
}
