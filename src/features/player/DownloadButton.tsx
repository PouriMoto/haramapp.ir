import { IconDownload } from '@tabler/icons-react'
import { downloadAudio } from '../../lib/download'

export function DownloadButton({ src, title }: { src: string; title: string }) {
  return (
    <button type="button" className="row__fav" onClick={() => void downloadAudio(src, title)} aria-label={`دانلود ${title}`}>
      <IconDownload size={20} aria-hidden />
    </button>
  )
}
