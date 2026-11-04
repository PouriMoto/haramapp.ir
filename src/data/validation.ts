import { normalizeDigits } from '../lib/text'
import { ValidationError } from './errors'
import type { BankInfo, NewCause, NewMessage, StartPaymentInput } from './types'

export const LIMITS = {
  messageMin: 3,
  messageMax: 1000,
  nameMax: 60,
  titleMax: 80,
  descriptionMax: 300,
  minToman: 10_000,
  maxToman: 500_000_000,
} as const

export function validateMessage(i: NewMessage): Required<Pick<NewMessage, 'message'>> & { name: string; phone: string } {
  const message = i.message.trim()
  if (message.length < LIMITS.messageMin) throw new ValidationError('message', 'متن درد و دل خیلی کوتاه است')
  if (message.length > LIMITS.messageMax) throw new ValidationError('message', `حداکثر ${LIMITS.messageMax} کاراکتر`)
  const name = (i.name ?? '').trim()
  if (name.length > LIMITS.nameMax) throw new ValidationError('name', `نام حداکثر ${LIMITS.nameMax} کاراکتر`)
  const phone = normalizeDigits((i.phone ?? '').trim())
  if (phone && !/^09\d{9}$/.test(phone)) throw new ValidationError('phone', 'شماره موبایل معتبر نیست')
  return { message, name, phone }
}

/** bank خالی/ناقص → undefined؛ مقدار نامعتبر → خطا */
export function validateBank(b: BankInfo | undefined, field = 'bank'): BankInfo | undefined {
  if (!b) return undefined
  const cardNumber = normalizeDigits(b.cardNumber ?? '').replace(/[\s-]/g, '')
  const iban = normalizeDigits(b.iban ?? '').replace(/[\s-]/g, '').toUpperCase()
  const bankName = (b.bankName ?? '').trim().slice(0, 60)
  const ownerName = (b.ownerName ?? '').trim().slice(0, 80)
  if (!cardNumber && !iban) return undefined
  if (cardNumber && !/^\d{16}$/.test(cardNumber)) throw new ValidationError(field, 'شماره کارت باید ۱۶ رقم باشد')
  if (iban && !/^IR\d{24}$/.test(iban)) throw new ValidationError(field, 'شماره شبا باید IR و ۲۴ رقم باشد')
  return { bankName, ownerName, cardNumber, iban }
}

export function validateCause(i: NewCause): NewCause {
  const title = i.title.trim()
  if (!title) throw new ValidationError('title', 'عنوان لازم است')
  if (title.length > LIMITS.titleMax) throw new ValidationError('title', `عنوان حداکثر ${LIMITS.titleMax} کاراکتر`)
  const description = i.description?.trim()
  if (description && description.length > LIMITS.descriptionMax) {
    throw new ValidationError('description', `توضیح حداکثر ${LIMITS.descriptionMax} کاراکتر`)
  }
  const accounts = (i.accounts ?? [])
    .map((a) => ({ id: a.id, title: a.title.trim(), bank: validateBank(a.bank, 'accounts'), online: a.online === true }))
    .filter((a) => a.title)
  if (accounts.length > 8) throw new ValidationError('accounts', 'حداکثر ۸ حساب')
  return { id: i.id, online: i.online === true, title, description, bank: validateBank(i.bank), accounts }
}

/** مبلغ ورودی کاربر (ممکن است ارقام فارسی و جداکننده داشته باشد) → عدد تومان */
export function parseToman(raw: string): number {
  const digits = normalizeDigits(raw).replace(/[,٬،\s]/g, '')
  if (!/^\d+$/.test(digits)) throw new ValidationError('amount', 'مبلغ را به عدد وارد کنید')
  return Number(digits)
}

export function validatePayment(i: StartPaymentInput): StartPaymentInput {
  if (!Number.isSafeInteger(i.amountToman)) throw new ValidationError('amount', 'مبلغ نامعتبر است')
  if (i.amountToman < LIMITS.minToman) throw new ValidationError('amount', 'مبلغ کمتر از حداقل است')
  if (i.amountToman > LIMITS.maxToman) throw new ValidationError('amount', 'مبلغ بیشتر از سقف مجاز است')
  if (!i.causeId) throw new ValidationError('causeId', 'مقصد انتخاب نشده')
  if (!i.clientId) throw new ValidationError('clientId', 'شناسه دستگاه موجود نیست')
  return i
}
