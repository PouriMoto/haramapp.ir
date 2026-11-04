import { createHmac, timingSafeEqual } from 'node:crypto'

/** امضای وضعیت در callback_url: مبلغ و مرچنت را کاربر نمی‌تواند دست‌کاری کند. */
export function sign(secret, { p, a, k }) {
  return createHmac('sha256', secret).update(`${p}|${a}|${k}`).digest('hex')
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

export function verifySig(secret, state, sig) {
  return safeEqual(sign(secret, state), sig ?? '')
}
