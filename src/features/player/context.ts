import { createContext, useContext } from 'react'

export interface Track {
  id: string
  title: string
  subtitle?: string
  src: string
  cover?: string
}

export interface PlayerState {
  current: Track | null
  playing: boolean
  error: boolean
  play(track: Track, queue?: readonly Track[]): void
  toggle(): void
  pause(): void
  next(): void
  prev(): void
  stop(): void
}

export interface PlayerProgress {
  time: number
  duration: number
  seek(t: number): void
}

export const PlayerStateContext = createContext<PlayerState | null>(null)
export const PlayerProgressContext = createContext<PlayerProgress | null>(null)

export function usePlayer(): PlayerState {
  const v = useContext(PlayerStateContext)
  if (!v) throw new Error('usePlayer خارج از PlayerProvider')
  return v
}

/** جدا از usePlayer تا لیست‌ها با هر timeupdate دوباره رندر نشوند */
export function usePlayerProgress(): PlayerProgress {
  const v = useContext(PlayerProgressContext)
  if (!v) throw new Error('usePlayerProgress خارج از PlayerProvider')
  return v
}
