import { useEffect, useRef } from 'react'

/** وقتی عنصر مرجع نزدیک viewport شد `onVisible` را صدا می‌زند. observer هر بار درست پاک می‌شود. */
export function useInfiniteSentinel(onVisible: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  const cb = useRef(onVisible)
  useEffect(() => { cb.current = onVisible }, [onVisible])

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) cb.current()
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [enabled])

  return ref
}
