import { IconChevronRight, IconMinus, IconShare3, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlus } from '@tabler/icons-react'
import { useMemo, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListState } from '../../components/ListState'
import { useManifest, usePrayerText } from '../../content/hooks'
import { prayerTrack } from '../../content/tracks'
import { shareLink } from '../../lib/share'
import { FavButton } from '../favorites/FavButton'
import { usePlayer } from '../player/context'
import { MarkdownView } from './MarkdownView'
import { useFontScale } from './useFontScale'

export function PrayerPage() {
  const { id } = useParams()
  const manifest = useManifest()
  const prayer = manifest.data?.prayers.find((p) => p.id === id)
  const text = usePrayerText(prayer?.text)
  const track = useMemo(() => (prayer ? prayerTrack(prayer) : undefined), [prayer])
  const { current, playing, play } = usePlayer()
  const { scale, bigger, smaller, canBigger, canSmaller } = useFontScale()
  const active = !!track && current?.id === track.id

  const back = (
    <Link to="/prayers" className="back-link"><IconChevronRight size={18} aria-hidden /> همه دعاها</Link>
  )

  if (manifest.isPending || manifest.isError) {
    return (
      <section>
        {back}
        <ListState loading={manifest.isPending} error={manifest.isError} empty={false} emptyText="" onRetry={() => void manifest.refetch()}>{null}</ListState>
      </section>
    )
  }
  if (!prayer) {
    return (
      <section>
        {back}
        <p className="list-state list-state--msg">این دعا پیدا نشد.</p>
      </section>
    )
  }

  return (
    <section>
      {back}
      <h2 className="page-title">{prayer.title}</h2>

      <div className="reader-tools">
        {track && (
          <button type="button" className="btn btn--icon" onClick={() => play(track)}>
            {active && playing ? <IconPlayerPauseFilled size={18} aria-hidden /> : <IconPlayerPlayFilled size={18} aria-hidden />}
            {active && playing ? 'توقف صوت' : 'پخش صوت'}
          </button>
        )}
        <FavButton id={`prayer:${prayer.id}`} title={prayer.title} />
        <button type="button" className="row__fav" onClick={() => void shareLink(prayer.title, `/prayers/${prayer.id}`)} aria-label="اشتراک‌گذاری"><IconShare3 size={20} aria-hidden /></button>
        <div className="font-ctl" role="group" aria-label="اندازه متن">
          <button type="button" onClick={smaller} disabled={!canSmaller} aria-label="کوچک‌تر کردن متن"><IconMinus size={18} aria-hidden /></button>
          <span aria-hidden>Aa</span>
          <button type="button" onClick={bigger} disabled={!canBigger} aria-label="بزرگ‌تر کردن متن"><IconPlus size={18} aria-hidden /></button>
        </div>
      </div>

      <ListState loading={text.isPending} error={text.isError} empty={text.data?.trim() === ''} emptyText="متنی برای این دعا ثبت نشده است." onRetry={() => void text.refetch()}>
        <article className="reader" style={{ '--scale': scale } as CSSProperties}>
          <MarkdownView text={text.data ?? ''} />
        </article>
      </ListState>
    </section>
  )
}
