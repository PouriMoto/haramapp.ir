import { IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { toggleFavorite, useFavorites } from './store'

export function FavButton({ id, title }: { id: string; title: string }) {
  const on = useFavorites().includes(id)
  return (
    <button type="button" className={on ? 'row__fav row__fav--on' : 'row__fav'} onClick={() => toggleFavorite(id, title)} aria-pressed={on} aria-label={on ? `حذف ${title} از علاقه‌مندی‌ها` : `افزودن ${title} به علاقه‌مندی‌ها`}>
      {on ? <IconHeartFilled size={20} aria-hidden /> : <IconHeart size={20} aria-hidden />}
    </button>
  )
}
