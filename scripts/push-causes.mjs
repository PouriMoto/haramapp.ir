#!/usr/bin/env node
// فقط برای «روشن کردن پرداخت آنلاین» یک کارت لازم است (online:true در Sheet). نمایش کارت‌ها به این دستور نیاز ندارد.
// کارت‌های همیاری را از data/causes.json به اپ‌اسکریپت می‌فرستد (upsert با id).
// استفاده:  APPS_SCRIPT_URL=... ADMIN_TOKEN=... node scripts/push-causes.mjs [--file path] [--dry]
// رمز مدیر فقط از متغیر محیطی خوانده می‌شود (در تاریخچهٔ shell/ریپو نماند).
import { readFile } from 'node:fs/promises'

const args = process.argv.slice(2)
const file = args.includes('--file') ? args[args.indexOf('--file') + 1] : 'data/causes.json'
const dry = args.includes('--dry')
const site = JSON.parse(await readFile('data/site.json', 'utf8')).appsScriptUrl
const url = process.env.APPS_SCRIPT_URL || site
const token = process.env.ADMIN_TOKEN
if (!dry && (!url || !token)) { console.error('آدرس Apps Script را در data/site.json پر کنید و ADMIN_TOKEN را در .env.local بگذارید.'); process.exit(1) }

const data = JSON.parse(await readFile(file, 'utf8'))
if (!Array.isArray(data.causes)) { console.error('causes[] یافت نشد'); process.exit(1) }

let bad = 0
for (const c of data.causes) {
  const body = { action: 'addCause', adminToken: token, id: c.id, title: c.title, description: c.description, online: c.online === true, bank: c.bank, accounts: c.accounts }
  if (dry) { console.log(`• ${c.id}: ${c.title} (online=${c.online === true}, حساب‌ها=${c.accounts.length})`); continue }
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' })
  const j = await res.json().catch(() => ({ ok: false, error: 'پاسخ نامعتبر' }))
  console.log(`${j.ok ? '✔' : '✖'} ${c.id}${j.ok ? '' : ': ' + j.error}`)
  if (!j.ok) bad++
}
process.exit(bad ? 1 : 0)
