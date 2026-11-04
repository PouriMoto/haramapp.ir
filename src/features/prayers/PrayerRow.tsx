import { IconBook2, IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Prayer } from '../../content/types'
import { DownloadButton } from '../player/DownloadButton'
import { FavButton } from '../favorites/FavButton'
import { usePlayer, type Track } from '../player/context'

export const PrayerRow = memo(function PrayerRow({ prayer, track }: { prayer: Prayer; track?: Track }) {
  const { current, playing, play } = usePlayer()
  const active = !!track && current?.id === track.id
  return (
    <li className={active ? 'row row--active' : 'row'}>
      <Link to={`/prayers/${prayer.id}`} className="row__main">
        <span className="row__cover row__cover--gold"><IconBook2 size={22} aria-hidden /></span>
        <span className="row__text"><strong>{prayer.title}</strong></span>
      </Link>
      {track && <DownloadButton src={track.src} title={prayer.title} />}
      <FavButton id={`prayer:${prayer.id}`} title={prayer.title} />
      {track && (
        <button type="button" className="row__play" onClick={() => play(track)} aria-label={`${active && playing ? 'توقف' : 'پخش صوت'} ${prayer.title}`}>
          {active && playing ? <IconPlayerPauseFilled size={20} aria-hidden /> : <IconPlayerPlayFilled size={20} aria-hidden />}
        </button>
      )}
    </li>
  )
})
