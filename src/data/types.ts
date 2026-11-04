export interface Message {
  id: string
  name: string
  message: string
  createdAt: string // ISO
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export interface Stats {
  salavat: number
  messages: number
}

export interface NewMessage {
  name?: string
  phone?: string
  message: string
  website?: string // honeypot: باید خالی بماند
}

/** اطلاعات واریز مستقیم (عمومی است؛ برای کسانی که از لینک پرداخت نمی‌کنند) */
export interface BankInfo {
  bankName: string
  ownerName: string
  cardNumber: string // ۱۶ رقم، فقط لاتین
  iban: string // IR + ۲۴ رقم
}

export interface CauseAccount {
  id: string
  title: string // مثلاً «عمرانی»
  totalToman: number
  bank?: BankInfo
  /** پرداخت آنلاین برای این حساب فعال است (مرچنت جدا تنظیم شده) */
  online?: boolean
}

export interface Cause {
  id: string
  title: string
  description?: string
  totalToman: number
  bank?: BankInfo // کارت تک‌حساب
  online?: boolean // پرداخت آنلاین برای کارت تک‌حساب فعال است
  accounts: CauseAccount[] // خالی = کارت تک‌حساب
}

export interface NewCause {
  adminToken?: string // فقط برای addCause؛ هرگز ذخیره نمی‌شود
  id?: string // با id ثابت = upsert (seed از causes.json)
  online?: boolean
  title: string
  description?: string
  bank?: BankInfo
  accounts?: { id?: string; title: string; bank?: BankInfo; online?: boolean }[]
}

/** شکل فایل seed/causes.json */
export interface CausesFile {
  version: 1
  causes: { id: string; title: string; description?: string; bank?: BankInfo; online?: boolean; accounts: { id: string; title: string; bank?: BankInfo; online?: boolean }[] }[]
}

export interface Payment {
  id: string
  causeId: string
  causeTitle: string
  accountId?: string
  accountTitle?: string
  amountToman: number
  status: 'pending' | 'paid' | 'failed'
  createdAt: string
  refId?: string
}

/** تنظیمات زندهٔ همیاری از سرور (بدون نیاز به build مجدد) */
export interface HelpConfig {
  paymentsEnabled: boolean
}

export interface StartPaymentInput {
  causeId: string
  accountId?: string
  amountToman: number
  clientId: string
}
