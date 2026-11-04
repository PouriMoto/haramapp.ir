import type { Track } from '../features/player/context'
import { resolveMedia } from './hooks'
import type { Music, Prayer } from './types'

export function musicTrack(m: Music): Track {
  return { id: `music:${m.id}`, title: m.title, subtitle: m.artist || 'نوای معنوی', src: resolveMedia(m.src), cover: m.cover ? resolveMedia(m.cover) : undefined }
}

export function prayerTrack(p: Prayer): Track | undefined {
  return p.audio ? { id: `prayer:${p.id}`, title: p.title, subtitle: 'زیارت‌نامه و دعا', src: resolveMedia(p.audio) } : undefined
}
