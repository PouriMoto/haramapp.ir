# Haram Razavi (حرم رضوی)

A fast, installable (PWA), right-to-left Persian web app with Imam Reza (AS) prayers and ziyarat texts + audio, spiritual music, videos, a "heart-to-heart" message wall, a salavat counter, a personal dhikr counter, and charity ("همیاری") cards with direct bank details and optional online payment.

It runs **without a custom backend**: a static site on GitHub Pages, [Google Apps Script](https://developers.google.com/apps-script) + Google Sheets as the data store, and one external link for all media.

> Status: **v0.9** (feature complete, in manual QA). v1.0 = first production deploy.

## Features

- Prayers (Markdown text + audio), music, Aparat videos, categories (Fatemiyeh, Muharram, Ramadan, Qadr nights, …), search
- Mini player: queue, resume after reload, sleep timer, media-session controls
- Favorites, adjustable text size, dark mode, share, download audio
- Message wall with manual moderation, global salavat counter
- Charity cards: copyable card number / IBAN, optional online payment (Zarinpal; swappable gateway; on/off switch)
- Banners (campaigns / ads) between sections; occasion hint from the Hijri calendar
- PWA: install prompt, offline shell, cached data; **no trackers**

## Architecture

```
React components ─▶ hooks (TanStack Query) ─▶ Api / HelpApi contracts ─▶ adapters
                                                              ├─ mock         (dev, no network)
                                                              ├─ appsScript   (production)
                                                              └─ supabase     (not implemented)
data/ ── content.json, prayers/*.md, causes.json ──▶ scripts/build-content.mjs ──▶ public/content/ (served with the site)
payment-service (tiny Node app, optional) ── Zarinpal request / verify / callback
```

- `src/config/env.ts` is the only file that reads `import.meta.env`.
- Components never fetch directly; they call hooks. Adapters are chosen by `VITE_DATA_PROVIDER`.

## Quick start

Requires Node 22+.

```bash
npm ci
npm run dev        # works out of the box: content from data/, demo data until site.json has an Apps Script URL
```

**All editable information lives in [`data/`](data/README.md)** (Persian guide): `site.json` (Apps Script URL, domain), `content.json` (prayers, music, videos, banners), `prayers/*.md` (texts), `causes.json` (charity cards). No environment variables are required.

Checks (run before every release): `npm run lint && npm test && npm run build`.

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `preview` | Vite |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` / `test` | oxlint / vitest |
| `npm run content` / `content:check` | Build / only validate `data/` (also runs automatically before dev and build) |
| `npm run causes:push` | Optional: upsert charity cards into the Sheet to enable online payment for them (needs `ADMIN_TOKEN` in `.env.local`) |

> When previewing a sub-path build, pass the same base: `VITE_BASE=/haram-app/ npx vite preview`.

## Configuration

Everything is in `data/site.json` (public by design; never put secrets there):

| Key | Meaning |
|---|---|
| `appsScriptUrl` | Apps Script Web App `/exec` URL. Empty = demo (mock) data. |
| `domain` | Custom domain (e.g. `haramapp.ir`). When set: base path `/`, and a `CNAME` file is emitted. Leave empty until DNS is ready. |
| `homeLimit` | Items per section on the home page. |

The base path is automatic: custom domain → `/`; GitHub Actions without a domain → `/<repo>/`; local → `/`.
Optional overrides (`.env.local`, see `.env.example`): `VITE_APPS_SCRIPT_URL`, `VITE_DATA_PROVIDER`, `VITE_MEDIA_BASE_URL`, `VITE_BASE`. Admin-only: `ADMIN_TOKEN` (`npm run causes:push`). Server-side secrets live in Apps Script **Script Properties** and in the payment service env (`payment-service/.env.example`). The GitHub workflow needs **no variables and no secrets**.

## Deploy (GitHub Pages)

1. Deploy `backend/apps-script/Code.gs` as a Web App (execute as *Me*, access *Anyone*), set Script Properties (`ADMIN_TOKEN`, `AUTO_APPROVE=false`, `PAYMENTS_ENABLED=false`), paste the `/exec` URL into `data/site.json`.
2. Push to `main`. In **Settings → Pages** choose *GitHub Actions*. The `Deploy` workflow validates `data/`, lints, tests, builds and publishes.
3. Custom domain: DNS `A` records → `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`; then set `"domain"` in `data/site.json`, push, and enable *Enforce HTTPS* in Pages.

## Content

`npm run dev` / `npm run build` run `scripts/build-content.mjs`, which validates `data/` (clear Persian errors) and writes `public/content/` (manifest, prayer texts, banner images, charity cards). Audio is never stored in the repo: use direct `https` links from hosts listed in `data/content.json → allowedHosts`.

## Project layout

```
data/           ALL owner-editable content (see data/README.md)
src/            app (router, layout), features/*, components, content (manifest, selectors), data (contracts, adapters, hooks), lib, pwa, styles
backend/        Google Apps Script (Code.gs)
payment-service/ optional Node service (zero dependencies)
scripts/        content builder, causes pusher, service-worker template, icon generator
public/         favicon, PWA manifest + icons (public/content/ is generated)
tests/          vitest
```

## Security notes

- Markdown is rendered with raw HTML disabled; images/links/iframes are not allowed in prayer texts.
- Audio URLs must be `https` on a host allow-listed in `data/content.json`; the client re-checks `https`.
- Apps Script: lock + rate limit + honeypot, spreadsheet-formula injection defence, never returns phone numbers or client IDs.
- Payments: HMAC-signed callback, each destination uses its own merchant code and bank account, three independent on/off switches.
- Bank card numbers and IBANs are public by design (shown for direct transfer); keep them only in `data/causes.json`.

## License

[PolyForm Noncommercial 1.0.0](LICENSE): free for personal, charitable, religious and educational use, modification and sharing; **no commercial use** without written permission. (Source-available, not OSI "open source".)
