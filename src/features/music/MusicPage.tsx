import { useMemo, useState } from 'react'
import { ListState } from '../../components/ListState'
import { CategoryChips } from '../../components/CategoryChips'
import { useCategoryParam } from '../../components/useCategoryParam'
import { SearchBox } from '../../components/SearchBox'
import { useCategories, useMusic } from '../../content/hooks'
import { categoryCounts, inCategory } from '../../content/selectors'
import { musicTrack } from '../../content/tracks'
import { normalizeSearch } from '../../lib/text'
import { MusicRow } from './MusicRow'

export function MusicPage() {
  const { data, isPending, isError, refetch } = useMusic()
  const [q, setQ] = useState('')
  const [cat, setCat] = useCategoryParam()
  const categories = useCategories()
  const chips = useMemo(() => categoryCounts(data ?? [], categories), [data, categories])
  const active = cat && chips.some((c) => c.id === cat) ? cat : null

  const rows = useMemo(() => {
    const needle = normalizeSearch(q)
    return inCategory(data ?? [], active)
      .filter((m) => !needle || normalizeSearch(`${m.title} ${m.artist}`).includes(needle))
      .map((m) => ({ music: m, track: musicTrack(m) }))
  }, [data, q, active])
  const queue = useMemo(() => rows.map((r) => r.track), [rows])

  return (
    <section>
      <h2 className="page-title">نوای معنوی</h2>
      <CategoryChips items={chips} value={active} onChange={setCat} total={data?.length ?? 0} />
      <SearchBox value={q} onChange={setQ} placeholder="جستجو در نواها یا نام هنرمند" />
      <ListState loading={isPending} error={isError} empty={rows.length === 0} emptyText={q ? 'موردی پیدا نشد.' : 'هنوز نوایی اضافه نشده است.'} onRetry={() => void refetch()}>
        <ul className="rows">
          {rows.map((r) => <MusicRow key={r.music.id} music={r.music} track={r.track} queue={queue} />)}
        </ul>
      </ListState>
    </section>
  )
}
