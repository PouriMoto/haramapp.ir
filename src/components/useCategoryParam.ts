import { useSearchParams } from 'react-router-dom'

/** دستهٔ انتخاب‌شده در URL می‌ماند (?cat=muharram) تا قابل اشتراک و برگشت‌پذیر باشد. */
export function useCategoryParam(): [string | null, (id: string | null) => void] {
  const [sp, setSp] = useSearchParams()
  const cat = sp.get('cat')
  return [cat, (id) => setSp((prev) => { const n = new URLSearchParams(prev); if (id) n.set('cat', id); else n.delete('cat'); return n }, { replace: true })]
}
