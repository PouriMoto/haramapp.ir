import { IconPlus } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { ListState } from '../../components/ListState'
import { SearchBox } from '../../components/SearchBox'
import { useCauses, useHelpTotal } from '../../data/hooks/useHelp'
import { formatToman, normalizeSearch } from '../../lib/text'
import { AddCauseSheet } from './AddCauseSheet'
import { CauseCard } from './CauseCard'
import { PaymentsList } from './PaymentsList'

export function HelpPage() {
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const causes = useCauses()
  const total = useHelpTotal()
  const list = useMemo(() => {
    const needle = normalizeSearch(q)
    return (causes.data ?? []).filter((c) => !needle || normalizeSearch(`${c.title} ${c.description ?? ''} ${c.accounts.map((a) => a.title).join(' ')} ${c.bank?.ownerName ?? ''}`).includes(needle))
  }, [causes.data, q])

  return (
    <section>
      <h2 className="page-title">همیاری</h2>

      <div className="help-total" aria-live="polite">
        <span>مجموع کمک‌های مردمی</span>
        <strong>{total.data ? `${formatToman(total.data.totalToman)} تومان` : total.isError ? '—' : '…'}</strong>
      </div>

      <div className="help-tools">
        <SearchBox value={q} onChange={setQ} placeholder="جستجوی نام مسجد، حسینیه یا خیریه" />
        <button type="button" className="btn btn--icon" onClick={() => setAdding(true)}><IconPlus size={18} aria-hidden /> افزودن</button>
      </div>

      <ListState loading={causes.isPending} error={causes.isError} empty={list.length === 0} emptyText={q ? 'موردی با این نام پیدا نشد.' : 'هنوز کارتی اضافه نشده است.'} onRetry={() => void causes.refetch()}>
        <ul className="rows">{list.map((c) => <CauseCard key={c.id} cause={c} />)}</ul>
      </ListState>

      <div className="section-header"><h2>پرداخت‌های من</h2></div>
      <p className="muted" style={{ marginBottom: 8 }}>فقط پرداخت‌هایی که از همین مرورگر انجام داده‌اید نمایش داده می‌شود.</p>
      <PaymentsList />

      <AddCauseSheet open={adding} onClose={() => setAdding(false)} />
    </section>
  )
}
