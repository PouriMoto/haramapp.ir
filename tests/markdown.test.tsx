import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MarkdownView } from '../src/features/prayers/MarkdownView'
import { stripLeadingTitle } from '../src/lib/markdown'

const html = (md: string) => renderToStaticMarkup(<MarkdownView text={md} />)

describe('MarkdownView امن', () => {
  it('HTML خام، تصویر، لینک و اسکریپت حذف می‌شوند ولی متن می‌ماند', () => {
    const out = html('# عنوان\n\nسلام <script>alert(1)</script><img src=x onerror=alert(1)> [لینک](javascript:alert(1)) ![x](http://evil/x.png)\n\n<iframe src="http://evil"></iframe>')
    expect(out).not.toMatch(/<script|<img|<iframe|onerror|javascript:|<a /i)
    expect(out).toContain('سلام')
    expect(out).toContain('لینک')
    expect(out).not.toContain('عنوان') // عنوان اول حذف می‌شود
  })
  it('نقل‌قول = عربی RTL، **bold** و --- پشتیبانی می‌شود', () => {
    const out = html('> السلام علیک\n\nترجمه\n\n---\n\n**نکته**')
    expect(out).toContain('<blockquote lang="ar" dir="rtl">')
    expect(out).toContain('<hr')
    expect(out).toContain('<strong>نکته</strong>')
  })
})

describe('stripLeadingTitle', () => {
  it('فقط عنوان ابتدای متن را برمی‌دارد', () => {
    expect(stripLeadingTitle('# الف\nمتن\n# ب')).toBe('متن\n# ب')
    expect(stripLeadingTitle('بدون عنوان')).toBe('بدون عنوان')
  })
})
