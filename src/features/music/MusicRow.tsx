import { IconMusic, IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import { memo } from 'react'
import type { Music } from '../../content/types'
import { DownloadButton } from '../player/DownloadButton'
import { FavButton } from '../favorites/FavButton'
import { usePlayer, type Track } from '../player/context'

interface Props { music: Music; queue: readonly Track[]; track: Track }

export const MusicRow = memo(function MusicRow({ music, track, queue }: Props) {
  const { current, playing, play } = usePlayer()
  const active = current?.id === track.id
  return (
    <li className={active ? 'row row--active' : 'row'}>
      <button type="button" className="row__main" onClick={() => play(track, queue)} aria-label={`${active && playing ? 'توقف' : 'پخش'} ${music.title}`}>
        <span className="row__cover">
          {track.cover ? <img src={track.cover} alt="" loading="lazy" width={48} height={48} /> : <IconMusic size={22} aria-hidden />}
        </span>
        <span className="row__text">
          <strong>{music.title}</strong>
          {music.artist && <span>{music.artist}</span>}
        </span>
        <span className="row__action" aria-hidden>
          {active && playing ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} />}
        </span>
      </button>
      <DownloadButton src={track.src} title={music.title} />
      <FavButton id={track.id} title={music.title} />
    </li>
  )
})
