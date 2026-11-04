import type { ReactNode } from 'react'

interface Props {
  loading: boolean
  error: boolean
  empty: boolean
  emptyText: string
  onRetry(): void
  children: ReactNode
}

/** وضعیت‌های مشترک لیست: در حال بارگذاری، خطا (با تلاش دوباره)، خالی */
export function ListState({ loading, error, empty, emptyText, onRetry, children }: Props) {
  if (loading) {
    return (
      <div className="list-state" role="status" aria-live="polite">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
      </div>
    )
  }
  if (error) {
    return (
      <div className="list-state list-state--msg" role="alert">
        <p>دریافت اطلاعات انجام نشد.</p>
        <button type="button" className="btn" onClick={onRetry}>تلاش دوباره</button>
      </div>
    )
  }
  if (empty) return <p className="list-state list-state--msg">{emptyText}</p>
  return <>{children}</>
}
