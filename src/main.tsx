import '@fontsource-variable/vazirmatn'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/features.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { env } from './config/env'
import { applyTheme } from './lib/theme'
import { initInstall } from './pwa/install'
import { prefetchPrayerPage } from './pwa/prefetch'
import { registerServiceWorker } from './pwa/register'

applyTheme()
initInstall()

// اتصال زودهنگام به هاست رسانه (DNS+TLS) تا manifest و اولین پخش سریع‌تر شروع شود
try {
  const origin = new URL(env.mediaBaseUrl, location.href).origin
  if (origin !== location.origin) {
    const l = document.createElement('link')
    l.rel = 'preconnect'
    l.href = origin
    l.crossOrigin = ''
    document.head.appendChild(l)
  }
} catch { /* رسانه تنظیم نشده */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
prefetchPrayerPage()
