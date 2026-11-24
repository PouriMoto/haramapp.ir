import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// فایل‌های public که در bundle نیستند ولی برای آفلاین/نصب لازم‌اند (فقط اگر وجود داشته باشند)
const STATIC_PRECACHE = ['favicon.svg', 'manifest.webmanifest', 'icons/icon-192.png']

/** sw.js را از scripts/sw.template.js می‌سازد و فایل‌های هش‌دار bundle را در آن precache می‌کند. */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'haram-service-worker',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = new Set<string>(['./'])
      for (const [name, item] of Object.entries(bundle)) {
        if (item.type === 'chunk' && item.isEntry) {
          files.add(name)
          for (const imp of item.imports) files.add(imp)
          for (const css of item.viteMetadata?.importedCss ?? []) files.add(css)
        }
        // فونت‌های لازم برای نمایش متن فارسی؛ latin-ext فقط در صورت نیاز دانلود می‌شود
        if (item.type === 'asset' && /vazirmatn-(arabic|latin)-wght-normal.*\.woff2$/.test(name)) files.add(name)
      }
      for (const f of STATIC_PRECACHE) if (existsSync(`public/${f}`)) files.add(f)
      const list = [...files].sort()
      const version = createHash('sha1').update(list.join('|')).digest('hex').slice(0, 10)
      const source = readFileSync('scripts/sw.template.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(list))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// data/site.json: تنظیمات ساده‌ی مالک (آدرس Apps Script، دامنه، تعداد صفحهٔ اصلی)
const site = JSON.parse(readFileSync('data/site.json', 'utf8')) as {
  appsScriptUrl?: string
  domain?: string
  homeLimit?: number
}

const domain = (site.domain ?? '').trim().toLowerCase()

/** با پر بودن domain در data/site.json، فایل CNAME ساخته می‌شود (GitHub Pages). */
function cnamePlugin(): Plugin {
  return {
    name: 'haram-cname',
    apply: 'build',
    generateBundle() {
      if (domain) this.emitFile({ type: 'asset', fileName: 'CNAME', source: `${domain}\n` })
    },
  }
}

/**
 * مسیر پایهٔ سایت (base):
 *  1) VITE_BASE اگر صریحاً داده شود (فقط جایگزینی دستی برای پیش‌نمایش)
 *  2) domain در data/site.json پر است → «/» (دامنهٔ اختصاصی همیشه از ریشه سرو می‌شود)
 *  3) داخل GitHub Actions بدون دامنه → «/<نام-ریپو>/» (آدرس USER.github.io/REPO/)
 *  4) غیر این‌ها (dev محلی) → «/»
 * علت باگ قبلی: workflow مقدار VITE_BASE=/haramapp.ir/ را اجبار می‌کرد و روی دامنهٔ اختصاصی assetها ۴۰۴ می‌شدند.
 */
export function resolveBase(env: NodeJS.ProcessEnv, customDomain: string): string {
  const norm = (b: string) => `/${b.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/')
  if (env.VITE_BASE?.trim()) return norm(env.VITE_BASE.trim())
  if (customDomain) return '/'
  const repo = (env.GITHUB_REPOSITORY ?? '').split('/')[1] ?? ''
  if (env.GITHUB_ACTIONS && repo && !repo.toLowerCase().endsWith('.github.io')) return norm(repo)
  return '/'
}

const base = resolveBase(process.env, domain)

export default defineConfig({
  base,
  plugins: [react(), serviceWorkerPlugin(), cnamePlugin()],
  // با هر build عوض می‌شود؛ کش ذخیره‌شدهٔ نسخهٔ قبل را بی‌اعتبار می‌کند (ساختار داده ممکن است عوض شده باشد)
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
    __SITE__: JSON.stringify(site),
  },
})
