import type {
  Cause, HelpConfig, NewCause, NewMessage, Message, Page, Payment, StartPaymentInput, Stats,
} from './types'

export interface Api {
  listMessages(p: { cursor?: string; limit: number }): Promise<Page<Message>>
  postMessage(i: NewMessage): Promise<void>
  getStats(): Promise<Stats>
  /** count: تعداد صلوات دسته‌ای (۱ تا ۱۰۰) */
  addSalavat(count?: number): Promise<Stats>
}

export interface HelpApi {
  listCauses(p: { q?: string }): Promise<Cause[]>
  getCause(id: string): Promise<Cause>
  addCause(i: NewCause): Promise<Cause>
  startPayment(i: StartPaymentInput): Promise<{ payUrl: string }>
  listMyPayments(clientId: string): Promise<Payment[]>
  getHelpTotal(): Promise<{ totalToman: number }>
  getConfig(): Promise<HelpConfig>
}
