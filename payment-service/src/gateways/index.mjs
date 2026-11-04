import { createMock } from './mock.mjs'
import { createZarinpal } from './zarinpal.mjs'

/** برای افزودن درگاه تازه (زیبال، آی‌دی‌پی، نکست‌پی…): یک فایل با همین دو متد request/verify بسازید و اینجا ثبت کنید. */
export function createGateway(cfg, fetch) {
  switch (cfg.gateway) {
    case 'zarinpal': return createZarinpal({ sandbox: cfg.sandbox, fetch })
    case 'mock': return createMock({ publicUrl: cfg.publicUrl })
    default: throw new Error(`درگاه ناشناخته: ${cfg.gateway}`)
  }
}
