#!/usr/bin/env node
// data/content.json (+ data/prayers/*.md, data/banners/*) → public/content/{manifest.json, prayers/, banners/}
// خودکار قبل از `npm run dev` و `npm run build` اجرا می‌شود. دستی: npm run content
// --check فقط اعتبارسنجی می‌کند و چیزی نمی‌نویسد.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { buildContent } from './lib/buildContent.mjs'

const args = process.argv.slice(2)
const check = args.includes('--check')
const dataDir = args.includes('--src') ? args[args.indexOf('--src') + 1] : 'data'
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'public/content'

const { manifest, texts, copies, errors, warnings } = await buildContent(dataDir)
for (const w of warnings) console.warn(`⚠ ${w}`)
if (errors.length) {
  console.error('\nخطا در اطلاعات data/ — لطفاً این موارد را اصلاح کنید:')
  for (const e of errors) console.error(`  ✖ ${e}`)
  process.exit(1)
}
const summary = `${manifest.prayers.length} دعا، ${manifest.music.length} نوا، ${manifest.videos.length} ویدیو، ${manifest.banners.length} بنر`
if (check) { console.log(`✔ معتبر: ${summary}`); process.exit(0) }

await rm(outDir, { recursive: true, force: true })
await mkdir(join(outDir, 'prayers'), { recursive: true })
await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
for (const [id, md] of Object.entries(texts)) await writeFile(join(outDir, 'prayers', `${id}.md`), md)
// کارت‌های همیاری: همان data/causes.json (عمومی) کنار محتوا قرار می‌گیرد
try {
  const causes = JSON.parse(await readFile(join(dataDir, 'causes.json'), 'utf8'))
  delete causes._note
  await writeFile(join(outDir, 'causes.json'), JSON.stringify(causes) + '\n')
} catch (e) {
  console.error(`✖ data/causes.json: ${e.code === 'ENOENT' ? 'پیدا نشد' : 'JSON نامعتبر (' + e.message + ')'}`)
  process.exit(1)
}
for (const c of copies) { await mkdir(dirname(join(outDir, c.to)), { recursive: true }); await copyFile(c.from, join(outDir, c.to)) }
console.log(`✔ ${outDir}: ${summary}`)
