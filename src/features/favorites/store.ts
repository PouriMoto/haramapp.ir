import { useSyncExternalStore } from 'react'
import { toast } from '../../components/toast'
import { readJson, writeJson } from '../../lib/storage'

const KEY = 'haram.favs'
/** شناسه‌ها با همان قالب Track: `prayer:<id>` / `music:<id>` */
let favs: readonly string[] = readJson<string[]>(KEY, []).filter((x) => typeof x === 'string')
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toggleFavorite(id: string, title: string) {
  const has = favs.includes(id)
  favs = has ? favs.filter((x) => x !== id) : [...favs, id]
  writeJson(KEY, favs)
  emit()
  toast(has ? `«${title}» از علاقه‌مندی‌ها برداشته شد` : `«${title}» به علاقه‌مندی‌ها اضافه شد`, has ? 'info' : 'ok')
}

export function useFavorites(): readonly string[] {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => favs, () => [])
}
