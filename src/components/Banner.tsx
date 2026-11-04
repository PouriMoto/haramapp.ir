import { Link } from 'react-router-dom'
import { resolveMedia } from '../content/hooks'
import type { Banner as BannerData } from '../content/types'

const LABEL = { ad: 'تبلیغ', campaign: 'کمپین' } as const

/** بنر کوچک ۳:۱. همیشه برچسب «تبلیغ/کمپین» دارد (شفافیت برای کاربر). بدون ردیاب. */
export function Banner({ banner }: { banner: BannerData }) {
  const body = (
    <>
      {banner.image ? (
        <img src={resolveMedia(banner.image)} alt={banner.alt ?? banner.title ?? ''} loading="lazy" decoding="async" width={1200} height={400} />
      ) : (
        <div className="banner__text">
          <strong>{banner.title}</strong>
          {banner.text && <span>{banner.text}</span>}
        </div>
      )}
      <span className={`banner__tag banner__tag--${banner.kind}`}>{LABEL[banner.kind]}{banner.sponsor ? ` · ${banner.sponsor}` : ''}</span>
    </>
  )

  const cls = 'banner'
  if (!banner.href) return <aside className={cls} aria-label={LABEL[banner.kind]}>{body}</aside>
  if (banner.href.startsWith('/')) return <aside className={cls} aria-label={LABEL[banner.kind]}><Link to={banner.href} className="banner__link">{body}</Link></aside>
  return (
    <aside className={cls} aria-label={LABEL[banner.kind]}>
      <a href={banner.href} className="banner__link" target="_blank" rel="noopener noreferrer sponsored">{body}</a>
    </aside>
  )
}
