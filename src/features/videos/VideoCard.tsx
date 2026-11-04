import { IconVideoOff, IconExternalLink, IconPlayerPlayFilled } from '@tabler/icons-react'
import { memo, useState } from 'react'
import { resolveMedia } from '../../content/hooks'
import type { VideoItem } from '../../content/types'
import { useOnline } from '../../lib/online'

/** iframe آپارات فقط بعد از لمس بارگیری می‌شود (سبک بودن صفحه + بدون ردیابی پیش از تماشا). */
export const VideoCard = memo(function VideoCard({ video }: { video: VideoItem }) {
  const [open, setOpen] = useState(false)
  const online = useOnline()
  return (
    <li className="video">
      <div className="video__frame">
        {open ? (
          <iframe
            src={`https://www.aparat.com/video/video/embed/videohash/${video.aparat}/vt/frame`}
            title={video.title} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="video__poster" onClick={() => setOpen(true)} disabled={!online} aria-label={`پخش ویدیو ${video.title}`}
            style={video.poster ? { backgroundImage: `url(${resolveMedia(video.poster)})` } : undefined}>
            <span className="video__play">{online ? <IconPlayerPlayFilled size={30} aria-hidden /> : <IconVideoOff size={30} aria-hidden />}</span>
          </button>
        )}
      </div>
      <div className="video__meta">
        <strong>{video.title}</strong>
        <a href={`https://www.aparat.com/v/${video.aparat}`} target="_blank" rel="noopener noreferrer" aria-label="باز کردن در آپارات"><IconExternalLink size={18} aria-hidden /></a>
      </div>
    </li>
  )
})
