import { useMemo, useState } from 'react'
import { ListState } from '../../components/ListState'
import { OccasionCard } from '../../components/OccasionCard'
import { Banner } from '../../components/Banner'
import { CategoryChips } from '../../components/CategoryChips'
import { useCategoryParam } from '../../components/useCategoryParam'
import { SectionHeader } from '../../components/SectionHeader'
import { useBanners, useHomeContent } from '../../content/hooks'
import { pickBanner } from '../../content/selectors'
import { musicTrack, prayerTrack } from '../../content/tracks'
import { MusicRow } from '../music/MusicRow'
import { PrayerRow } from '../prayers/PrayerRow'
import { VideoCard } from '../videos/VideoCard'
import { HeroVideo } from './HeroVideo'

export function HomePage() {
  const [cat, setCat] = useCategoryParam()
  const { data, isPending, isError, refetch } = useHomeContent(cat)
  const suffix = data?.active ? `?cat=${data.active}` : ''

  const prayers = useMemo(() => (data?.prayers.shown ?? []).map((p) => ({ prayer: p, track: prayerTrack(p) })), [data])
  const music = useMemo(() => (data?.music.shown ?? []).map((m) => ({ music: m, track: musicTrack(m) })), [data])
  const queue = useMemo(() => music.map((r) => r.track), [music])
  const retry = () => void refetch()
  const banners = useBanners('home')
  const [slot] = useState(() => Math.floor(Math.random() * 1000)) // هر بار باز شدن صفحه، چرخش متفاوت
  const banner = pickBanner(banners, slot)

  return (
    <>
      {data?.featured ? (
        <section aria-label="ویدیوی معرفی">
          <ul className="rows"><VideoCard video={data.featured} /></ul>
        </section>
      ) : <HeroVideo />}
      {data && <OccasionCard active={data.active} available={data.chips.map((c) => c.id)} />}
      {data && <CategoryChips items={data.chips} value={data.active} onChange={setCat} total={data.totalAll} />}

      <SectionHeader title="زیارت‌نامه‌ها و دعاها" moreTo={data?.prayers.hasMore ? `/prayers${suffix}` : undefined} moreLabel={data ? `همه (${data.prayers.total.toLocaleString('fa-IR')})` : undefined} />
      <ListState loading={isPending} error={isError} empty={prayers.length === 0} emptyText="هنوز دعایی اضافه نشده است." onRetry={retry}>
        <ul className="rows">
          {prayers.map((r) => <PrayerRow key={r.prayer.id} prayer={r.prayer} track={r.track} />)}
        </ul>
      </ListState>

      {banner && <Banner banner={banner} />}

      <SectionHeader title="نوای معنوی" moreTo={data?.music.hasMore ? `/music${suffix}` : undefined} moreLabel={data ? `همه (${data.music.total.toLocaleString('fa-IR')})` : undefined} />
      <ListState loading={isPending} error={isError} empty={music.length === 0} emptyText="هنوز نوایی اضافه نشده است." onRetry={retry}>
        <ul className="rows">
          {music.map((r) => <MusicRow key={r.music.id} music={r.music} track={r.track} queue={queue} />)}
        </ul>
      </ListState>

      {data && data.videos.shown.length > 0 && (
        <>
          <SectionHeader title="ویدیوها" moreTo={data.videos.hasMore ? '/videos' : undefined} moreLabel={`همه (${data.videos.total.toLocaleString('fa-IR')})`} />
          <ul className="rows">{data.videos.shown.map((v) => <VideoCard key={v.id} video={v} />)}</ul>
        </>
      )}
    </>
  )
}
