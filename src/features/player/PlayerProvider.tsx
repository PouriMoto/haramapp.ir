import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from '../../components/toast'
import { readJson, removeKey, writeJson } from '../../lib/storage'
import {
  PlayerProgressContext, PlayerStateContext,
  type PlayerProgress, type PlayerState, type Track,
} from './context'

const RESUME = 'haram.resume'
interface Resume { track: Track; time: number }

function loadResume(): Resume | null {
  const v = readJson<Partial<Resume> | null>(RESUME, null)
  const t = v?.track
  if (!t || typeof t.id !== 'string' || typeof t.src !== 'string' || typeof t.title !== 'string') return null
  return { track: t, time: typeof v?.time === 'number' && v.time >= 0 ? v.time : 0 }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<readonly Track[]>([])
  const currentRef = useRef<Track | null>(null)
  const nextRef = useRef<() => void>(() => undefined)
  const pendingSeek = useRef(0) // برای «ادامهٔ پخش»: src تا اولین پخش ست نمی‌شود (دادهٔ بی‌خود مصرف نشود)
  const lastSave = useRef(0)
  const [resume] = useState(loadResume)

  const [current, setCurrent] = useState<Track | null>(resume?.track ?? null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const [time, setTime] = useState(resume?.time ?? 0)
  const [duration, setDuration] = useState(0)

  const audio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata' // تا کاربر پخش نزده، فقط متادیتا؛ نه کل فایل
    }
    return audioRef.current
  }, [])

  const saveResume = useCallback(() => {
    const t = currentRef.current
    if (t) writeJson(RESUME, { track: t, time: audioRef.current?.getAttribute('src') ? audioRef.current.currentTime : pendingSeek.current } satisfies Resume)
  }, [])

  /** اگر آهنگِ بازیابی‌شده هنوز src ندارد، همین حالا ست می‌کند و به زمان ذخیره‌شده می‌رود. */
  const ensureSrc = useCallback(() => {
    const a = audio()
    const t = currentRef.current
    if (t && !a.getAttribute('src')) {
      a.src = t.src
      const at = pendingSeek.current
      if (at > 0) a.addEventListener('loadedmetadata', () => { a.currentTime = at }, { once: true })
      pendingSeek.current = 0
    }
    return a
  }, [audio])

  const start = useCallback((track: Track, queue: readonly Track[]) => {
    const a = audio()
    queueRef.current = queue
    currentRef.current = track
    setCurrent(track)
    setError(false)
    setTime(0)
    setDuration(0)
    pendingSeek.current = 0
    a.src = track.src
    a.play().catch(() => { setError(true); toast('پخش نشد؛ اتصال را بررسی کنید', 'warn') })
    toast(`در حال پخش: ${track.title}`)
    writeJson(RESUME, { track, time: 0 } satisfies Resume)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.subtitle ?? '',
        artwork: track.cover ? [{ src: track.cover }] : [],
      })
    }
  }, [audio])

  const play = useCallback((track: Track, queue?: readonly Track[]) => {
    const a = ensureSrc()
    if (currentRef.current?.id === track.id && !a.error) {
      if (a.paused) a.play().catch(() => setError(true))
      else a.pause()
      return
    }
    start(track, queue && queue.length > 0 ? queue : [track])
  }, [ensureSrc, start])

  const toggle = useCallback(() => {
    if (!currentRef.current) return
    const a = ensureSrc()
    if (a.paused) a.play().catch(() => setError(true))
    else a.pause()
  }, [ensureSrc])

  const pause = useCallback(() => { audioRef.current?.pause() }, [])

  const step = useCallback((delta: 1 | -1) => {
    const q = queueRef.current
    const i = q.findIndex((t) => t.id === currentRef.current?.id)
    const target = q[i + delta]
    if (i >= 0 && target) start(target, q)
    else if (delta === 1) audio().pause()
  }, [audio, start])

  const next = useCallback(() => step(1), [step])
  const prev = useCallback(() => {
    const a = audio()
    if (a.currentTime > 3) a.currentTime = 0
    else step(-1)
  }, [audio, step])

  const stop = useCallback(() => {
    const a = audio()
    a.pause()
    a.removeAttribute('src')
    a.load()
    currentRef.current = null
    pendingSeek.current = 0
    removeKey(RESUME)
    setCurrent(null)
    setPlaying(false)
    setTime(0)
    setDuration(0)
  }, [audio])

  const seek = useCallback((t: number) => {
    const a = audio()
    if (Number.isFinite(t)) a.currentTime = Math.max(0, t)
  }, [audio])

  useEffect(() => { nextRef.current = next }, [next])

  useEffect(() => {
    const a = audio()
    const on = {
      play: () => setPlaying(true),
      pause: () => { setPlaying(false); saveResume() },
      ended: () => nextRef.current(),
      timeupdate: () => {
        setTime(a.currentTime)
        if (Date.now() - lastSave.current > 5000) { lastSave.current = Date.now(); saveResume() }
      },
      durationchange: () => setDuration(Number.isFinite(a.duration) ? a.duration : 0),
      error: () => { if (a.getAttribute('src')) { setError(true); setPlaying(false); toast('پخش نشد؛ اتصال را بررسی کنید', 'warn') } },
    }
    for (const [k, fn] of Object.entries(on)) a.addEventListener(k, fn)
    return () => {
      for (const [k, fn] of Object.entries(on)) a.removeEventListener(k, fn)
      a.pause()
    }
  }, [audio, saveResume])

  useEffect(() => {
    const h = () => saveResume()
    window.addEventListener('pagehide', h)
    return () => window.removeEventListener('pagehide', h)
  }, [saveResume])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.setActionHandler('play', toggle)
    ms.setActionHandler('pause', toggle)
    ms.setActionHandler('nexttrack', next)
    ms.setActionHandler('previoustrack', prev)
    return () => {
      for (const k of ['play', 'pause', 'nexttrack', 'previoustrack'] as const) ms.setActionHandler(k, null)
    }
  }, [toggle, next, prev])

  const state = useMemo<PlayerState>(
    () => ({ current, playing, error, play, toggle, pause, next, prev, stop }),
    [current, playing, error, play, toggle, pause, next, prev, stop],
  )
  const progress = useMemo<PlayerProgress>(() => ({ time, duration, seek }), [time, duration, seek])

  return (
    <PlayerStateContext.Provider value={state}>
      <PlayerProgressContext.Provider value={progress}>{children}</PlayerProgressContext.Provider>
    </PlayerStateContext.Provider>
  )
}
