// تولید آیکون‌های PNG از design/*.svg (نیاز به playwright؛ فقط هنگام تغییر طرح لازم است).
// اجرا: node scripts/make-icons.cjs
const { chromium } = require('playwright')
const { readFileSync } = require('node:fs')

const jobs = [
  ['design/icon.svg', 'public/icons/icon-192.png', 192, true],
  ['design/icon.svg', 'public/icons/icon-512.png', 512, true],
  ['design/icon-maskable.svg', 'public/icons/icon-maskable-512.png', 512, false],
  ['design/icon-maskable.svg', 'public/icons/apple-touch-icon.png', 180, false], // iOS خودش گوشه را گرد می‌کند
]
;(async () => {
  const b = await chromium.launch()
  for (const [src, out, size, transparent] of jobs) {
    const p = await b.newPage({ viewport: { width: size, height: size } })
    await p.setContent(`<body style="margin:0;background:transparent">${readFileSync(src, 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`)
    await p.screenshot({ path: out, omitBackground: transparent })
    await p.close()
    console.log('✔', out)
  }
  await b.close()
})()
