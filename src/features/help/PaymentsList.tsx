import { ListState } from '../../components/ListState'
import { useMyPayments } from '../../data/hooks/useHelp'
import type { Payment } from '../../data/types'
import { formatToman } from '../../lib/text'

const dateFmt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })
const STATUS: Record<Payment['status'], string> = { paid: 'پرداخت‌شده', pending: 'در انتظار تأیید', failed: 'ناموفق' }

export function PaymentsList() {
  const q = useMyPayments()
  const items = q.data ?? []
  return (
    <ListState loading={q.isPending} error={q.isError} empty={items.length === 0} emptyText="هنوز پرداختی از این دستگاه ثبت نشده است." onRetry={() => void q.refetch()}>
      <ul className="rows">
        {items.map((p) => {
          const d = new Date(p.createdAt)
          return (
            <li key={p.id} className="pay">
              <div className="pay__main">
                <strong>{p.causeTitle}{p.accountTitle ? ` — ${p.accountTitle}` : ''}</strong>
                <span className="muted">{Number.isNaN(d.getTime()) ? '' : dateFmt.format(d)}{p.refId ? ` · کد پیگیری ${p.refId}` : ''}</span>
              </div>
              <div className="pay__side">
                <strong>{formatToman(p.amountToman)} <small>تومان</small></strong>
                <span className={`badge badge--${p.status}`}>{STATUS[p.status]}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </ListState>
  )
}
