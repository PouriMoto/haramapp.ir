import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getClientId } from '../../lib/clientId'
import { getHelpApi } from '../api'
import type { NewCause } from '../types'
import { LIMITS, parseToman, validatePayment } from '../validation'

export { LIMITS as PAYMENT_LIMITS }

/** کل فهرست یک‌بار گرفته می‌شود؛ جستجو سمت کلاینت است (هر حرف یک درخواست به Apps Script نمی‌شود). */
export function useCauses() {
  return useQuery({ queryKey: ['causes'], queryFn: () => getHelpApi().listCauses({}) })
}

export function useCause(id: string) {
  return useQuery({ queryKey: ['cause', id], queryFn: () => getHelpApi().getCause(id) })
}

/** کلید روشن/خاموش زنده؛ خطا = خاموش (امن‌ترین حالت) */
export function useHelpConfig() {
  return useQuery({ queryKey: ['helpConfig'], queryFn: () => getHelpApi().getConfig(), staleTime: 60_000 })
}

export function useHelpTotal() {
  return useQuery({ queryKey: ['helpTotal'], queryFn: () => getHelpApi().getHelpTotal() })
}

export function useMyPayments() {
  const clientId = getClientId()
  return useQuery({ queryKey: ['myPayments', clientId], queryFn: () => getHelpApi().listMyPayments(clientId) })
}

export function useAddCause() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (i: NewCause) => getHelpApi().addCause(i),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['causes'] }),
  })
}

/** مبلغ به‌صورت متن ورودی کاربر می‌آید (ارقام فارسی/جداکننده مجاز)؛ اعتبارسنجی کلاینت فقط UX است. */
export function useStartPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (i: { causeId: string; accountId?: string; amountText: string }) => {
      const clientId = getClientId()
      const v = validatePayment({ causeId: i.causeId, accountId: i.accountId, amountToman: parseToman(i.amountText), clientId })
      return getHelpApi().startPayment(v)
    },
    onSuccess: () => {
      for (const k of ['causes', 'cause', 'helpTotal', 'myPayments']) qc.invalidateQueries({ queryKey: [k] })
    },
  })
}
