/** ثبت service worker فقط در production (در dev کش، توسعه را خراب می‌کند). خطا بی‌صدا نادیده گرفته می‌شود. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => undefined)
  })
}
