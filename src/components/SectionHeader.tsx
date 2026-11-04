import { IconChevronLeft } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

export function SectionHeader({ title, moreTo, moreLabel }: { title: string; moreTo?: string; moreLabel?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {moreTo && (
        <Link to={moreTo} className="section-header__more">
          {moreLabel ?? 'همه'} <IconChevronLeft size={16} aria-hidden />
        </Link>
      )}
    </div>
  )
}
