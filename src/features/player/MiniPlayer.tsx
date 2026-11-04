import { IconMoon, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlayerTrackNext, IconPlayerTrackPrev, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { toast } from '../../components/toast'
import { formatTime } from '../../lib/time'
import { usePlayer, usePlayerProgress } from './context'

const STEPS = [0, 15, 30, 60] as const

/** تایمر خواب: بعد از ۱۵/۳۰/۶۰ دقیقه پخش را قطع می‌کند. */
function SleepTimer({ onFire }: { onFire: () => void }) {
  const [i, setI] = useState(0)
  const min = STEPS[i]
  useEffect(() => {
    if (!min) return
    const t = setTimeout(() => { onFire(); setI(0); toast('تایمر خواب: پخش متوقف شد') }, min * 60_000)
    return () => clearTimeout(t)
  }, [min, onFire])
  const next = () => { const n = (i + 1) % STEPS.length; setI(n); toast(n ? `پخش بعد از ${STEPS[n].toLocaleString('fa-IR')} دقیقه متوقف می‌شود` : 'تایمر خواب خاموش شد') }
  return (
    <button type="button" onClick={next} aria-label="تایمر خواب" className={min ? 'sleep sleep--on' : 'sleep'}>
      <IconMoon size={18} aria-hidden />{min > 0 && <small>{min.toLocaleString('fa-IR')}</small>}
    </button>
  )
}

export function MiniPlayer() {
  const { current, playing, error, toggle, pause, next, prev, stop } = usePlayer()
  const { time, duration, seek } = usePlayerProgress()
  if (!current) return null

  return (
    <section className="mini-player" aria-label="پخش‌کننده">
      <div className="mini-player__top">
        <div className="mini-player__info">
          <strong>{current.title}</strong>
          <span>{error ? 'پخش نشد؛ اتصال را بررسی کنید' : current.subtitle}</span>
        </div>
        <div className="mini-player__controls">
          {/* در RTL «بعدی» به چپ است؛ آیکن‌ها برعکس می‌شوند */}
          <button type="button" onClick={prev} aria-label="قبلی" className="flip-rtl"><IconPlayerTrackPrev size={20} aria-hidden /></button>
          <button type="button" onClick={toggle} aria-label={playing ? 'توقف' : 'پخش'} className="mini-player__play">
            {playing ? <IconPlayerPauseFilled size={22} aria-hidden /> : <IconPlayerPlayFilled size={22} aria-hidden />}
          </button>
          <button type="button" onClick={next} aria-label="بعدی" className="flip-rtl"><IconPlayerTrackNext size={20} aria-hidden /></button>
          <SleepTimer onFire={pause} />
          <button type="button" onClick={stop} aria-label="بستن پخش‌کننده"><IconX size={18} aria-hidden /></button>
        </div>
      </div>
      <div className="mini-player__bar" dir="ltr">
        <span>{formatTime(time)}</span>
        <input
          type="range" min={0} max={duration || 1} step={1} value={Math.min(time, duration || 1)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="موقعیت پخش" disabled={!duration}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </section>
  )
}
