import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApi } from '../api'
import type { NewMessage } from '../types'
import { validateMessage } from '../validation'

const PAGE = 20

export function useMessages() {
  return useInfiniteQuery({
    queryKey: ['messages'],
    queryFn: ({ pageParam }) => getApi().listMessages({ cursor: pageParam, limit: PAGE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function usePostMessage() {
  const qc = useQueryClient()
  return useMutation({
    // اعتبارسنجی کلاینت فقط برای UX؛ سرور دوباره بررسی می‌کند
    mutationFn: (i: NewMessage) => {
      if (!i.website) validateMessage(i)
      return getApi().postMessage(i)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stats'] }),
  })
}
