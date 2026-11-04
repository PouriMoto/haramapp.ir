import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getApi } from '../api'
import type { ApiError } from '../errors'

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: () => getApi().getStats() })
}

const FLUSH_MS = 700

/**
 * شمارندهٔ صلوات با ارسال دسته‌ای: هر ضربه فوراً در UI دیده می‌شود، ولی ضربه‌ها
 * ~۷۰۰ms جمع و با یک درخواست فرستاده می‌شوند (Apps Script کند است و rate limit دارد).
 * نمایش = مقدار سرور + ضربه‌های در صف + درخواست‌های در پرواز.
 */
export function useSalavatCounter() {
  const qc = useQueryClient()
  const stats = useStats()
  const [pending, setPending] = useState(0)
  const [inflight, setInflight] = useState(0)
  const [mine, setMine] = useState(0)
  const [error, setError] = useState<ApiError | null>(null)
  const pendingRef = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const flushRef = useRef<() => void>(() => undefined)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const n = Math.min(pendingRef.current, 100)
    if (n === 0) return
    pendingRef.current -= n
    setPending(pendingRef.current)
    setInflight((v) => v + n)
    const done = () => {
      setInflight((v) => v - n)
      if (pendingRef.current > 0) timer.current = setTimeout(() => flushRef.current(), FLUSH_MS)
    }
    getApi().addSalavat(n).then(
      (fresh) => { qc.setQueryData(['stats'], fresh); done() }, // هر دو در یک tick تا شمارنده دوبار نپرد
      (e: ApiError) => { setError(e); setMine((m) => Math.max(0, m - n)); done() },
    )
  }, [qc])

  const tap = useCallback(() => {
    pendingRef.current += 1
    setPending(pendingRef.current)
    setMine((m) => m + 1)
    setError(null)
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, FLUSH_MS)
  }, [flush])

  useEffect(() => { flushRef.current = flush }, [flush])

  // خروج از صفحه: ضربه‌های باقی‌مانده فرستاده شوند
  useEffect(() => () => flush(), [flush])

  const base = stats.data?.salavat
  return {
    total: base === undefined ? undefined : base + pending + inflight,
    mine,
    tap,
    error,
    loading: stats.isPending,
    loadError: stats.isError,
    retry: () => void stats.refetch(),
  }
}
