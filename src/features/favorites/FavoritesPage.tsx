import { useMemo } from 'react'
import { ListState } from '../../components/ListState'
import { useManifest } from '../../content/hooks'
import { musicTrack, prayerTrack } from '../../content/tracks'
import { MusicRow } from '../music/MusicRow'
import { PrayerRow } from '../prayers/PrayerRow'
import { useFavorites } from './store'

export function FavoritesPage() {
  const favs = useFavorites()
  const m = useManifest()
  const prayers = useMemo(() => (m.data?.prayers ?? []).filter((p) => favs.includes(`prayer:${p.id}`)), [m.data, favs])
  const music = useMemo(() => (m.data?.music ?? []).filter((x) => favs.includes(`music:${x.id}`)), [m.data, favs])
  const queue = useMemo(() => music.map(musicTrack), [music])
  return (
    <section>
      <h2 className="page-title">علاقه‌مندی‌ها</h2>
      <p className="muted">روی همین گوشی ذخیره می‌شوند و جایی ارسال نمی‌شوند.</p>
      <ListState loading={m.isPending} error={m.isError} empty={prayers.length + music.length === 0} emptyText="هنوز چیزی را با قلب ♡ علامت نزده‌اید." onRetry={() => void m.refetch()}>
        {prayers.length > 0 && <ul className="rows">{prayers.map((p) => <PrayerRow key={p.id} prayer={p} track={prayerTrack(p)} />)}</ul>}
        {music.length > 0 && <ul className="rows" style={{ marginTop: 10 }}>{music.map((x, i) => <MusicRow key={x.id} music={x} track={queue[i]} queue={queue} />)}</ul>}
      </ListState>
    </section>
  )
}
