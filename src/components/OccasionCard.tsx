import { IconCalendarEvent } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { currentOccasion } from '../content/occasion'

/** پیشنهاد خودکار بر پایهٔ تاریخ قمری، بدون سرور. اگر دسته همان لحظه فعال یا بی‌محتوا باشد، نمایش داده نمی‌شود. */
export function OccasionCard({ active, available }: { active: string | null; available: readonly string[] }) {
  const o = currentOccasion()
  if (!o || active === o.cat || !available.includes(o.cat)) return null
  return (
    <Link to={`/?cat=${o.cat}`} className="occasion">
      <IconCalendarEvent size={22} aria-hidden />
      <span>{o.text}</span>
    </Link>
  )
}
