import { Fragment, useMemo } from 'react'
import { Banner } from '../../components/Banner'
import { ListState } from '../../components/ListState'
import { useInfiniteSentinel } from '../../components/useInfiniteSentinel'
import { useBanners } from '../../content/hooks'
import { pickBanner } from '../../content/selectors'
import { useMessages } from '../../data/hooks/useMessages'
import { useStats } from '../../data/hooks/useStats'

const BANNER_EVERY = 20
const dateFmt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' })
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d)
}

export function MessagesPage() {
  const q = useMessages()
  const stats = useStats()
  const banners = useBanners('messages')
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data])
  const sentinel = useInfiniteSentinel(() => void q.fetchNextPage(), !!q.hasNextPage && !q.isFetchingNextPage && !q.isFetchNextPageError)

  return (
    <section>
      <h2 className="page-title">درد و دل‌ها</h2>
      {stats.data && stats.data.messages > 0 && (
        <p className="muted">{stats.data.messages.toLocaleString('fa-IR')} درد و دل با آقا در میان گذاشته شده است.</p>
      )}
      <ListState loading={q.isPending} error={q.isError && items.length === 0} empty={items.length === 0} emptyText="هنوز درد و دلی نمایش داده نمی‌شود. اولین نفر باشید." onRetry={() => void q.refetch()}>
        <ul className="rows">
          {items.map((m, i) => {
            // بعد از هر ۲۰ پیام یک بنر (چرخشی بین بنرهای فعال)
            const banner = (i + 1) % BANNER_EVERY === 0 ? pickBanner(banners, Math.floor(i / BANNER_EVERY)) : null
            return (
              <Fragment key={m.id}>
                <li className="msg">
                  <p className="msg__text">{m.message}</p>
                  <p className="msg__meta">{m.name || 'ناشناس'}{formatDate(m.createdAt) && ` · ${formatDate(m.createdAt)}`}</p>
                </li>
                {banner && <li className="banner--inline"><Banner banner={banner} /></li>}
              </Fragment>
            )
          })}
        </ul>
        <div ref={sentinel} aria-hidden style={{ height: 1 }} />
        {q.isFetchingNextPage && <div className="list-state" role="status"><div className="skeleton" /></div>}
        {q.isFetchNextPageError && (
          <div className="list-state list-state--msg" role="alert">
            <p>دریافت ادامهٔ لیست انجام نشد.</p>
            <button type="button" className="btn" onClick={() => void q.fetchNextPage()}>تلاش دوباره</button>
          </div>
        )}
      </ListState>
    </section>
  )
}
