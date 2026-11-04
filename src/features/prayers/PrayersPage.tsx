import { useMemo, useState } from 'react'
import { ListState } from '../../components/ListState'
import { CategoryChips } from '../../components/CategoryChips'
import { useCategoryParam } from '../../components/useCategoryParam'
import { SearchBox } from '../../components/SearchBox'
import { useCategories, usePrayers } from '../../content/hooks'
import { categoryCounts, inCategory } from '../../content/selectors'
import { prayerTrack } from '../../content/tracks'
import { normalizeSearch } from '../../lib/text'
import { PrayerRow } from './PrayerRow'

export function PrayersPage() {
  const { data, isPending, isError, refetch } = usePrayers()
  const [q, setQ] = useState('')
  const [cat, setCat] = useCategoryParam()
  const categories = useCategories()
  const chips = useMemo(() => categoryCounts(data ?? [], categories), [data, categories])
  const active = cat && chips.some((c) => c.id === cat) ? cat : null

  const rows = useMemo(() => {
    const needle = normalizeSearch(q)
    return inCategory(data ?? [], active)
      .filter((p) => !needle || normalizeSearch(p.title).includes(needle))
      .map((p) => ({ prayer: p, track: prayerTrack(p) }))
  }, [data, q, active])

  return (
    <section>
      <h2 className="page-title">زیارت‌نامه‌ها و دعاها</h2>
      <CategoryChips items={chips} value={active} onChange={setCat} total={data?.length ?? 0} />
      <SearchBox value={q} onChange={setQ} placeholder="جستجو در دعاها" />
      <ListState loading={isPending} error={isError} empty={rows.length === 0} emptyText={q ? 'موردی پیدا نشد.' : 'هنوز دعایی اضافه نشده است.'} onRetry={() => void refetch()}>
        <ul className="rows">
          {rows.map((r) => <PrayerRow key={r.prayer.id} prayer={r.prayer} track={r.track} />)}
        </ul>
      </ListState>
    </section>
  )
}
