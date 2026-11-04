import { IconRotate } from '@tabler/icons-react'
import { useState } from 'react'
import { toast } from '../../components/toast'
import { readJson, writeJson } from '../../lib/storage'

const KEY = 'haram.zikr'
const TARGETS = [33, 100, 313, 1000]
interface Z { count: number; target: number }

export function ZikrPage() {
  const [z, setZ] = useState<Z>(() => {
    const v = readJson<Partial<Z>>(KEY, {})
    return { count: Number.isInteger(v.count) && (v.count ?? 0) >= 0 ? (v.count as number) : 0, target: TARGETS.includes(v.target ?? 0) ? (v.target as number) : 100 }
  })
  const save = (n: Z) => { setZ(n); writeJson(KEY, n) }
  const fa = (n: number) => n.toLocaleString('fa-IR')
  const tap = () => {
    const count = z.count + 1
    save({ ...z, count })
    if (count % z.target === 0) { navigator.vibrate?.([60, 40, 60]); toast(`${fa(count)} ذکر کامل شد، قبول باشد`, 'ok') } else navigator.vibrate?.(8)
  }
  const round = Math.floor(z.count / z.target)
  const inRound = z.count - round * z.target
  return (
    <section className="salavat">
      <h2 className="page-title">ذکرشمار شخصی</h2>
      <p className="muted">فقط روی همین گوشی ذخیره می‌شود. هر ذکری را بشمارید.</p>
      <div className="chips" role="group" aria-label="هدف دور">
        {TARGETS.map((t) => (
          <button key={t} type="button" className={t === z.target ? 'chip cat-chip--on' : 'chip'} onClick={() => save({ ...z, target: t })}>{fa(t)}</button>
        ))}
      </div>
      <div className="salavat__total" aria-live="off">{fa(z.count)}<span>دور {fa(round + 1)} — {fa(inRound)} از {fa(z.target)}</span></div>
      <button type="button" className="salavat__btn" onClick={tap} aria-label="یک ذکر"><span>ذکر</span></button>
      <button type="button" className="btn btn--icon" onClick={() => { save({ ...z, count: 0 }); toast('شمارنده صفر شد') }}><IconRotate size={18} aria-hidden /> از نو</button>
    </section>
  )
}
