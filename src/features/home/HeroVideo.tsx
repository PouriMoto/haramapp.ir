import { resolveMedia, useHomeVideo } from '../../content/hooks'

export function HeroVideo() {
  const { data } = useHomeVideo()
  if (!data) return null
  return (
    <video
      className="hero-video"
      src={resolveMedia(data.src)}
      poster={data.poster ? resolveMedia(data.poster) : undefined}
      controls
      playsInline
      preload="metadata"
    />
  )
}
