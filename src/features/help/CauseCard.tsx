import { IconChevronLeft, IconHeartHandshake } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import type { Cause } from '../../data/types'
import { formatToman } from '../../lib/text'

export function CauseCard({ cause }: { cause: Cause }) {
  return (
    <li>
      <Link to={`/help/${cause.id}`} className="cause-card">
        <span className="row__cover row__cover--gold"><IconHeartHandshake size={24} aria-hidden /></span>
        <span className="row__text">
          <strong className="cause-card__title">{cause.title}</strong>
          {cause.accounts.length > 0 && <span>{cause.accounts.map((a) => a.title).join('، ')}</span>}
          <span className="cause-card__sum">تاکنون {formatToman(cause.totalToman)} تومان</span>
        </span>
        <IconChevronLeft size={20} aria-hidden className="muted" />
      </Link>
    </li>
  )
}
