import { IconHeartFilled } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { useSalavatCounter } from '../../data/hooks/useStats'

export function StatsPage() {
  const { total, mine, tap, error, loading, loadError, retry } = useSalavatCounter()
  const fmt = (n: number) => n.toLocaleString('fa-IR')

  return (
    <section className="salavat">
      <h2 className="page-title">صلوات‌شمار</h2>
      <p className="muted">اللّهمّ صلّ علی محمّد و آل محمّد و عجّل فرجهم</p>

      <div className="salavat__total" aria-live="polite">
        {total !== undefined ? fmt(total) : loading ? '…' : '—'}
        <span>صلوات ثبت‌شده</span>
      </div>
      {loadError && total === undefined && (
        <p className="field-err" role="alert">دریافت شمارنده انجام نشد. <button type="button" className="link-btn" onClick={retry}>تلاش دوباره</button></p>
      )}

      <button type="button" className="salavat__btn" onClick={tap} aria-label="ثبت یک صلوات">
        <IconHeartFilled size={44} aria-hidden />
        <span>صلوات</span>
      </button>

      <p className="muted">صلوات‌های شما در این بازدید: {fmt(mine)}</p>
      <Link to="/zikr" className="btn btn--icon" style={{ marginTop: 12 }}>ذکرشمار شخصی</Link>
      {error && <p className="field-err" role="alert">{error.message || 'ثبت صلوات انجام نشد.'}</p>}
    </section>
  )
}
